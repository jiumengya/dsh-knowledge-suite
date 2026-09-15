import z from "@deepseek-ai/schemastery";
import { randomUUID } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { writeFileAtomic } from "@deepseek-ai/dsh-atomic-write";
import { Knowledge } from "@deepseek-ai/dsh-knowledge";
import { HnswIndex, cosineToScore, hybridSearch, tokenize } from "@deepseek-ai/dsh-retrieval";
//#region lib/types/chunk.js
/**
* Paragraph-aware text chunking for the local knowledge store: whole
* paragraphs accumulate up to the configured size, oversized paragraphs split
* on sentence boundaries, and unbreakable runs split by character.
* @module @deepseek-ai/dsh-knowledge-store/src/chunk
*/
/** Sentence enders shared by Latin and CJK prose; sentence splits stay inside one paragraph. */
const SENTENCE_SPLIT = /(?<=[.!?。！？；;])\s*/;
/**
* Split extracted text into retrieval chunks.
* @param text - extracted document text.
* @param chunkSize - maximum characters per chunk; paragraphs never merge past it.
* @returns one or more non-empty chunks in reading order; `[]` when the text has no non-whitespace content.
*/
function chunkText(text, chunkSize) {
	const chunks = [];
	let pending = [];
	let pendingLength = 0;
	const flush = () => {
		if (pending.length > 0) {
			chunks.push(pending.join("\n\n"));
			pending = [];
			pendingLength = 0;
		}
	};
	for (const raw of text.split(/\n\s*\n/)) {
		const paragraph = raw.trim();
		if (paragraph.length === 0) continue;
		if (paragraph.length > chunkSize) {
			flush();
			chunks.push(...splitLongParagraph(paragraph, chunkSize));
			continue;
		}
		if (pendingLength > 0 && pendingLength + 2 + paragraph.length > chunkSize) flush();
		pending.push(paragraph);
		pendingLength = pending.join("\n\n").length;
	}
	flush();
	return chunks;
}
/**
* Split one paragraph that alone exceeds the chunk size: sentence
* boundaries first, then whitespace-separated words, then characters for an
* unbreakable run.
* @param paragraph - the oversized paragraph.
* @param chunkSize - maximum characters per chunk.
* @returns the paragraph's text in chunk-sized pieces.
*/
function splitLongParagraph(paragraph, chunkSize) {
	const parts = [];
	let pending = "";
	for (const sentence of paragraph.split(SENTENCE_SPLIT)) {
		if (sentence.length === 0) continue;
		if (sentence.length > chunkSize) {
			if (pending.length > 0) {
				parts.push(pending);
				pending = "";
			}
			parts.push(...splitLongRun(sentence, chunkSize));
			continue;
		}
		if (pending.length > 0 && pending.length + sentence.length > chunkSize) {
			parts.push(pending);
			pending = "";
		}
		pending += sentence;
	}
	if (pending.length > 0) parts.push(pending);
	return parts;
}
/**
* Split one oversized sentence on word boundaries, hard-splitting only a word
* that alone exceeds the chunk size.
* @param sentence - the oversized sentence.
* @param chunkSize - maximum characters per chunk.
* @returns the sentence's text in chunk-sized pieces.
*/
function splitLongRun(sentence, chunkSize) {
	const parts = [];
	let pending = "";
	for (const word of sentence.split(" ")) {
		if (word.length > chunkSize) {
			if (pending.length > 0) {
				parts.push(pending);
				pending = "";
			}
			for (let start = 0; start < word.length; start += chunkSize) parts.push(word.slice(start, start + chunkSize));
			continue;
		}
		const joined = pending.length === 0 ? word : `${pending} ${word}`;
		if (joined.length > chunkSize) {
			parts.push(pending);
			pending = word;
		} else pending = joined;
	}
	if (pending.length > 0) parts.push(pending);
	return parts;
}
//#endregion
//#region lib/types/extract.js
/**
* Document-format detection and text extraction for the local knowledge
* store. Plain text, Markdown, and HTML extract in-process; PDF and Word load
* their parsers through dynamic import so the store starts without them and
* pays the parse cost only per document of that format.
* @module @deepseek-ai/dsh-knowledge-store/src/extract
*/
/** File extensions accepted during a directory scan, mapped to their format. */
const SCAN_EXTENSIONS = {
	".txt": "text",
	".text": "text",
	".md": "markdown",
	".markdown": "markdown",
	".html": "html",
	".htm": "html",
	".xhtml": "html",
	".pdf": "pdf",
	".docx": "docx"
};
/**
* Detect a document format from the filename, restricted to the extensions a
* directory scan accepts.
* @param filename - candidate file name.
* @returns the format, or `undefined` when the extension is not a scan-accepted document format.
*/
function scanFormat(filename) {
	const dot = filename.lastIndexOf(".");
	if (dot < 0) return void 0;
	return SCAN_EXTENSIONS[filename.slice(dot).toLowerCase()];
}
/**
* Resolve the format of one explicitly named file. Unlike {@link scanFormat},
* an unknown or missing extension falls back to `text`: a file the caller
* pointed at directly is ingested rather than skipped.
* @param filename - explicitly named file.
* @returns the format; never `undefined`.
*/
function explicitFormat(filename) {
	return scanFormat(filename) ?? "text";
}
/**
* Extract the retrievable text of one document file.
* @param path - absolute file path.
* @param format - the document's format.
* @returns the extracted text; whitespace is not normalized here — chunking owns that.
* @throws when the file cannot be read or the parser rejects its contents.
*/
async function extractDocumentText(path, format) {
	switch (format) {
		case "text":
		case "markdown": return await readFile(path, "utf8");
		case "html": return stripHtml(await readFile(path, "utf8"));
		case "pdf": return await extractPdfText(path);
		case "docx": return await extractDocxText(path);
	}
}
/**
* Extract PDF text through unpdf's serverless pdf.js build.
* @param path - absolute PDF path.
* @returns the text of every page concatenated in page order.
*/
async function extractPdfText(path) {
	const { extractText, getDocumentProxy } = await import("unpdf");
	const { text } = await extractText(await getDocumentProxy(new Uint8Array(await readFile(path))), { mergePages: true });
	return text;
}
/**
* Extract DOCX text through mammoth.
* @param path - absolute DOCX path.
* @returns the document's raw text without formatting.
*/
async function extractDocxText(path) {
	const { default: mammoth } = await import("mammoth");
	const { value } = await mammoth.extractRawText({ buffer: await readFile(path) });
	return value;
}
/** Block-level HTML tags whose close should start a new text line. */
const BLOCK_CLOSE = /* @__PURE__ */ new RegExp("</(?:p|div|li|dd|dt|h[1-6]|tr|table|thead|tbody|ul|ol|dl|section|article|aside|header|footer|nav|blockquote|pre|figure|figcaption)>", "gi");
/**
* Reduce HTML to retrievable text: drop script/style blocks, convert block
* closings and `<br>` to newlines, strip remaining tags, and decode common
* entities. Lossy by design — the output feeds retrieval, not rendering.
* @param html - raw HTML source.
* @returns the visible text content.
*/
function stripHtml(html) {
	return decodeEntities(html.replace(/<script[\s\S]*?<\/script\s*>/gi, " ").replace(/<style[\s\S]*?<\/style\s*>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(BLOCK_CLOSE, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "));
}
/** Named entities covering the characters that survive tag stripping. */
const NAMED_ENTITIES = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	nbsp: "\xA0",
	hellip: "…",
	mdash: "—",
	ndash: "–",
	lsquo: "‘",
	rsquo: "’",
	ldquo: "“",
	rdquo: "”",
	middot: "·",
	copy: "©",
	reg: "®",
	trade: "™"
};
/**
* Decode the HTML entities tag stripping leaves behind.
* @param text - text possibly containing named or numeric entities.
* @returns text with recognized entities replaced by their characters.
*/
function decodeEntities(text) {
	return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body) => {
		if (body.startsWith("#")) {
			const codePoint = body.startsWith("#x") || body.startsWith("#X") ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10);
			return Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 1114111 ? String.fromCodePoint(codePoint) : match;
		}
		return NAMED_ENTITIES[body] ?? match;
	});
}
//#endregion
//#region lib/types/json.js
/**
* Local JSON-file knowledge backend: one `knowledge.json` under a configured
* root, atomically republished on every mutation. In-memory state is
* authoritative; chunk embeddings ride along with documents so a later
* embedding provider switch keeps the file loadable.
* @module @deepseek-ai/dsh-knowledge-store/src/json
*/
const FORMATS = [
	"text",
	"markdown",
	"html",
	"pdf",
	"docx"
];
/**
* Open or create the JSON-backed store.
* @param root - directory holding `knowledge.json`; created on first write.
* @returns the loaded documents and a persist function.
*/
async function openJsonStore(root) {
	let documents = [];
	const path = join(root, "knowledge.json");
	try {
		documents = parseKnowledgeFile(await readFile(path, "utf8"), path);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	const persist = async (next) => {
		await writeFileAtomic(path, serializeKnowledgeFile(next), {
			mode: 384,
			dirMode: 448
		});
	};
	return {
		documents: [...documents],
		persist
	};
}
/**
* Serialize documents into the on-disk file text.
* @param documents - complete library contents, in file order.
* @returns the version-1 file text with one trailing newline.
*/
function serializeKnowledgeFile(documents) {
	return `${JSON.stringify({
		version: 1,
		documents
	}, null, 2)}\n`;
}
/**
* Parse and validate file text into documents.
* @param text - raw file contents.
* @param path - file path used only in corruption diagnostics.
* @returns the validated documents, in file order.
* @throws when the file is not valid JSON or does not match the stored shape.
*/
function parseKnowledgeFile(text, path) {
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch (error) {
		throw new Error(`corrupt knowledge store "${path}": invalid JSON`, { cause: error });
	}
	if (typeof parsed !== "object" || parsed === null) throw new Error(`corrupt knowledge store "${path}": unexpected file structure`);
	const { version, documents } = parsed;
	if (version !== 1 || !Array.isArray(documents)) throw new Error(`corrupt knowledge store "${path}": unexpected file structure`);
	return documents.map((document) => validateStoredDocument(document, path));
}
/** Validate one decoded document against the stored shape. */
function validateStoredDocument(value, storePath) {
	if (typeof value !== "object" || value === null) throw new Error(`corrupt knowledge store "${storePath}": document is not an object`);
	const { id, title, filename, format, path, createdAt, updatedAt, chunks } = value;
	if (typeof id !== "string" || typeof title !== "string" || typeof filename !== "string" || typeof format !== "string" || !FORMATS.includes(format) || typeof path !== "string" || typeof createdAt !== "number" || typeof updatedAt !== "number" || !Array.isArray(chunks) || chunks.some((chunk) => !isValidChunk(chunk))) throw new Error(`corrupt knowledge store "${storePath}": document does not match the stored shape`);
	return value;
}
/** Validate one decoded chunk. */
function isValidChunk(value) {
	if (typeof value !== "object" || value === null) return false;
	const { index, text, embedding } = value;
	if (typeof index !== "number" || typeof text !== "string") return false;
	return embedding === void 0 || Array.isArray(embedding) && embedding.every((dim) => typeof dim === "number");
}
//#endregion
//#region lib/types/types.js
/**
* Narrow a stored document to the seam's public entry shape.
* @param document - the stored document.
* @returns the public entry without chunk payloads.
*/
function toKnowledgeEntry(document) {
	return {
		id: document.id,
		title: document.title,
		filename: document.filename,
		format: document.format,
		path: document.path,
		chunkCount: document.chunks.length,
		createdAt: document.createdAt,
		updatedAt: document.updatedAt
	};
}
//#endregion
//#region lib/types/index.js
/**
* Local knowledge Service Provider: a durable document library over one JSON
* file, retrieved by embedding cosine similarity when the embedding seam is
* present and by lexical BM25 otherwise. Ingestion extracts text from plain
* text, Markdown, HTML, PDF, and Word sources, splits it into chunks, and
* indexes each chunk through both retrieval channels.
* @module @deepseek-ai/dsh-knowledge-store
*/
/**
* Texts per one embedding request. Embedding endpoints cap request size; this
* is an endpoint-spec constant, not a deployment tunable.
*/
const EMBED_BATCH_SIZE = 32;
/** Directory under the library root where uploaded source bytes persist. */
const UPLOADS_DIRECTORY = "uploads";
/** Default maximum accepted bytes for one uploaded document (32 MiB). */
const DEFAULT_MAX_UPLOAD_BYTES = 32 * 1024 * 1024;
/** Filenames Windows treats as devices regardless of directory or extension. */
const WINDOWS_RESERVED = new Set([
	"CON",
	"PRN",
	"AUX",
	"NUL",
	...Array.from({ length: 9 }, (_, index) => `COM${index + 1}`),
	...Array.from({ length: 9 }, (_, index) => `LPT${index + 1}`)
]);
/** Cordis plugin name used by loader diagnostics. */
const name = "knowledge-store";
/** Schemastery validation for {@link Config}. */
const Config = z.object({
	root: z.string(),
	minScore: z.number().min(0).max(1).default(.35),
	chunkSize: z.number().step(1).min(200).max(8e3).default(1200),
	maxUploadBytes: z.number().step(1).min(1).default(DEFAULT_MAX_UPLOAD_BYTES)
});
/**
* Reduce one client-reported filename to a basename safe to persist inside
* the uploads directory: strip every directory component (both separators),
* then refuse what Windows cannot round-trip — control characters, path
* metacharacters, reserved device names, names ending in a dot or space —
* and cap the length.
* @param filename - the filename as the uploading client reported it.
* @returns the safe basename, or `undefined` when nothing safe remains.
*/
function sanitizeUploadFilename(filename) {
	const base = filename.replaceAll("\\", "/").split("/").pop() ?? "";
	if (base.length === 0 || base === "." || base === ".." || base.length > 200) return void 0;
	if (/[\u0000-\u001F\u007F]/.test(base) || /[<>:"|?*]/.test(base)) return void 0;
	if (base.endsWith(".") || base.endsWith(" ")) return void 0;
	const stem = base.slice(0, base.includes(".") ? base.lastIndexOf(".") : base.length);
	if (WINDOWS_RESERVED.has(stem.toUpperCase())) return void 0;
	return base;
}
/**
* The local knowledge provider. One instance owns the document cache and the
* JSON file; every mutation republishes the whole library atomically. The
* embedding seam is optional: without it the provider degrades to lexical
* retrieval instead of failing to load, so the library keeps working with
* zero external services.
*/
var LocalKnowledgeStore = class extends Knowledge {
	documents = [];
	ready;
	root;
	minScore;
	chunkSize;
	maxUploadBytes;
	persistJson;
	embed;
	embeddingAvailable;
	tokenCache = /* @__PURE__ */ new WeakMap();
	vectorIndex = new HnswIndex({
		maxNeighbors: 16,
		efSearch: 64
	});
	vectorNodeById = /* @__PURE__ */ new Map();
	constructor(ctx, config) {
		super(ctx);
		this.root = config.root;
		this.minScore = config.minScore ?? .35;
		this.chunkSize = config.chunkSize ?? 1200;
		this.maxUploadBytes = config.maxUploadBytes ?? 33554432;
		const embedding = ctx.get("memoryEmbedding");
		this.embeddingAvailable = embedding !== void 0 && embedding.activeMode !== "none";
		this.embed = async (texts) => {
			if (embedding === void 0) throw new Error("knowledge-store: embedding service absent");
			const vectors = await embedding.embed(texts);
			if (vectors.length !== texts.length) throw new Error(`knowledge-store: embedding service returned ${vectors.length} vectors for ${texts.length} texts`);
			return vectors;
		};
		this.ready = this.open(config);
	}
	/**
	* Open the JSON backend and load documents.
	* @param config - validated plugin configuration.
	*/
	async open(config) {
		const root = config.root;
		if (root === void 0 || root.length === 0) throw new Error("knowledge-store: json backend requires root");
		const store = await openJsonStore(root);
		this.documents = [...store.documents];
		this.persistJson = store.persist;
		if (this.embeddingAvailable) for (const document of this.documents) this.addDocumentToVectorIndex(document);
	}
	async ingest(request) {
		await this.ready;
		const target = resolve(request.path);
		if ((await stat(target)).isDirectory()) {
			if (request.title !== void 0) throw new Error("knowledge-store: title override applies only to one file, not a directory scan");
			return await this.ingestDirectory(target);
		}
		const outcome = await this.ingestFile(target, request.title);
		if (outcome.kind === "skipped") return {
			ingested: [],
			skipped: [{
				path: target,
				reason: outcome.reason
			}]
		};
		await this.persistJson?.(this.documents);
		return {
			ingested: [outcome.entry],
			skipped: []
		};
	}
	async ingestUploaded(request) {
		await this.ready;
		if (request.bytes.byteLength > this.maxUploadBytes) return {
			ingested: [],
			skipped: [{
				path: request.filename,
				reason: `upload exceeds the ${this.maxUploadBytes}-byte cap`
			}]
		};
		const filename = sanitizeUploadFilename(request.filename);
		if (filename === void 0 || scanFormat(filename) === void 0) return {
			ingested: [],
			skipped: [{
				path: request.filename,
				reason: "unsupported filename or format"
			}]
		};
		const target = join(this.root, UPLOADS_DIRECTORY, filename);
		await writeFileAtomic(target, request.bytes, {
			mode: 384,
			dirMode: 448
		});
		const outcome = await this.ingestFile(target, request.title);
		if (outcome.kind === "skipped") return {
			ingested: [],
			skipped: [{
				path: target,
				reason: outcome.reason
			}]
		};
		await this.persistJson?.(this.documents);
		return {
			ingested: [outcome.entry],
			skipped: []
		};
	}
	/**
	* Ingest every scan-accepted document of one directory, non-recursively.
	* @param directory - absolute directory path.
	* @returns per-file ingest and skip outcomes; one persist publishes the whole batch.
	*/
	async ingestDirectory(directory) {
		const entries = (await readdir(directory, { withFileTypes: true })).filter((entry) => entry.isFile() && scanFormat(entry.name) !== void 0).sort((a, b) => a.name.localeCompare(b.name));
		const ingested = [];
		const skipped = [];
		for (const entry of entries) {
			const path = join(directory, entry.name);
			const outcome = await this.ingestFile(path, void 0);
			if (outcome.kind === "skipped") skipped.push({
				path,
				reason: outcome.reason
			});
			else ingested.push(outcome.entry);
		}
		if (ingested.length > 0) await this.persistJson?.(this.documents);
		return {
			ingested,
			skipped
		};
	}
	/**
	* Extract, chunk, index, and store one file. Extraction failure is one
	* file's skip reason, not a batch failure; embedding failure throws because
	* a configured endpoint rejecting every request is a systemic fault.
	* @param path - absolute file path.
	* @param title - explicit display title overriding the file basename.
	* @returns the stored entry, or the skip reason.
	*/
	async ingestFile(path, title) {
		const format = explicitFormat(basename(path));
		let text;
		try {
			text = await extractDocumentText(path, format);
		} catch (error) {
			return {
				kind: "skipped",
				reason: `extraction failed: ${error instanceof Error ? error.message : String(error)}`
			};
		}
		const chunks = chunkText(text, this.chunkSize);
		if (chunks.length === 0) return {
			kind: "skipped",
			reason: "no extractable text"
		};
		const embeddings = this.embeddingAvailable ? await this.embedAll(chunks) : void 0;
		const existing = this.documents.findIndex((document) => document.path === path);
		const now = Date.now();
		const previous = existing >= 0 ? this.documents[existing] : void 0;
		const document = {
			id: previous?.id ?? randomUUID(),
			title: title ?? basename(path, extname(path)),
			filename: basename(path),
			format,
			path,
			createdAt: previous?.createdAt ?? now,
			updatedAt: now,
			chunks: chunks.map((chunkTextOf, index) => {
				const embedding = embeddings?.[index];
				return {
					index,
					text: chunkTextOf,
					...embedding !== void 0 ? { embedding: [...embedding] } : {}
				};
			})
		};
		if (previous !== void 0) this.removeDocumentFromVectorIndex(previous);
		if (existing >= 0) this.documents[existing] = document;
		else this.documents.push(document);
		this.addDocumentToVectorIndex(document);
		return {
			kind: "ingested",
			entry: toKnowledgeEntry(document)
		};
	}
	/**
	* Embed every chunk text in endpoint-sized batches.
	* @param texts - chunk texts in document order.
	* @returns one vector per chunk, in order.
	*/
	async embedAll(texts) {
		const vectors = [];
		for (let start = 0; start < texts.length; start += EMBED_BATCH_SIZE) {
			const batch = texts.slice(start, start + EMBED_BATCH_SIZE);
			const embedded = await this.embed(batch);
			vectors.push(...embedded);
		}
		return vectors;
	}
	async search(query) {
		await this.ready;
		const topK = Math.max(1, Math.floor(query.topK));
		const pairs = this.indexedChunks();
		if (pairs.length === 0) return [];
		const queryTokens = tokenize(query.text);
		if (queryTokens.length === 0 && !this.embeddingAvailable) return [];
		const chunkTokens = /* @__PURE__ */ new Map();
		const documentFrequency = /* @__PURE__ */ new Map();
		for (const { chunk } of pairs) {
			const tokens = this.tokenCache.get(chunk) ?? tokenize(chunk.text);
			this.tokenCache.set(chunk, tokens);
			chunkTokens.set(chunk, tokens);
			for (const token of new Set(tokens)) documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
		}
		const avgLength = [...chunkTokens.values()].reduce((sum, tokens) => sum + tokens.length, 0) / chunkTokens.size;
		return (await hybridSearch({
			queryTokens,
			corpus: pairs.map((pair) => [pair, chunkTokens.get(pair.chunk) ?? []]),
			documentFrequency,
			documentCount: chunkTokens.size,
			avgLength,
			topK,
			minScore: this.minScore,
			semantic: this.embeddingAvailable ? () => this.semanticMatches(query.text, topK * 4) : void 0,
			keyOf: (pair) => `${pair.document.id}:${pair.chunk.index}`
		})).map((match) => ({
			document: toKnowledgeEntry(match.item.document),
			chunk: {
				documentId: match.item.document.id,
				index: match.item.chunk.index,
				text: match.item.chunk.text
			},
			score: match.score,
			fusion: match.fusion
		}));
	}
	async semanticMatches(text, topK) {
		const [queryVector] = await this.embed([text]);
		if (queryVector === void 0) return [];
		return this.vectorIndex.search(queryVector, topK).map((match) => ({
			item: match.item,
			score: cosineToScore(match.score)
		})).filter((match) => match.score >= this.minScore);
	}
	async list() {
		await this.ready;
		return [...this.documents].sort((a, b) => b.createdAt - a.createdAt).map(toKnowledgeEntry);
	}
	async remove(id) {
		await this.ready;
		const index = this.documents.findIndex((document) => document.id === id);
		if (index < 0) return false;
		const [removed] = this.documents.splice(index, 1);
		if (removed !== void 0) this.removeDocumentFromVectorIndex(removed);
		await this.persistJson?.(this.documents);
		return true;
	}
	/** Every chunk paired with its owning document, in document then chunk order. */
	indexedChunks() {
		const pairs = [];
		for (const document of this.documents) for (const chunk of document.chunks) pairs.push({
			document,
			chunk
		});
		return pairs;
	}
	/** Add every embedded chunk of one document to the vector index. */
	addDocumentToVectorIndex(document) {
		for (const chunk of document.chunks) if (chunk.embedding !== void 0) this.vectorNodeById.set(`${document.id}:${chunk.index}`, this.vectorIndex.add({
			document,
			chunk
		}, chunk.embedding));
	}
	/** Drop every vector-index node of one document. */
	removeDocumentFromVectorIndex(document) {
		for (const chunk of document.chunks) {
			const key = `${document.id}:${chunk.index}`;
			const node = this.vectorNodeById.get(key);
			if (node !== void 0) {
				this.vectorIndex.delete(node);
				this.vectorNodeById.delete(key);
			}
		}
	}
};
//#endregion
export { Config, DEFAULT_MAX_UPLOAD_BYTES, LocalKnowledgeStore, LocalKnowledgeStore as default, name };
