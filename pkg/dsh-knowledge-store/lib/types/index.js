/**
 * Local knowledge Service Provider: a durable document library over one JSON
 * file, retrieved by embedding cosine similarity when the embedding seam is
 * present and by lexical BM25 otherwise. Ingestion extracts text from plain
 * text, Markdown, HTML, PDF, and Word sources, splits it into chunks, and
 * indexes each chunk through both retrieval channels.
 * @module @deepseek-ai/dsh-knowledge-store
 */
import z from '@deepseek-ai/schemastery';
import { randomUUID } from 'node:crypto';
import { readdir, stat } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { writeFileAtomic } from '@deepseek-ai/dsh-atomic-write';
import { Knowledge } from '@deepseek-ai/dsh-knowledge';
import { cosineToScore, HnswIndex, hybridSearch, tokenize } from '@deepseek-ai/dsh-retrieval';
import { chunkText } from "./chunk.js";
import { explicitFormat, extractDocumentText, scanFormat } from "./extract.js";
import { openJsonStore } from "./json.js";
import { toKnowledgeEntry } from "./types.js";
/**
 * Texts per one embedding request. Embedding endpoints cap request size; this
 * is an endpoint-spec constant, not a deployment tunable.
 */
const EMBED_BATCH_SIZE = 32;
/** Directory under the library root where uploaded source bytes persist. */
const UPLOADS_DIRECTORY = 'uploads';
/** Default maximum accepted bytes for one uploaded document (32 MiB). */
export const DEFAULT_MAX_UPLOAD_BYTES = 32 * 1024 * 1024;
/** Filenames Windows treats as devices regardless of directory or extension. */
const WINDOWS_RESERVED = new Set([
    'CON', 'PRN', 'AUX', 'NUL',
    ...Array.from({ length: 9 }, (_, index) => `COM${index + 1}`),
    ...Array.from({ length: 9 }, (_, index) => `LPT${index + 1}`),
]);
/** Cordis plugin name used by loader diagnostics. */
export const name = 'knowledge-store';
/** Schemastery validation for {@link Config}. */
export const Config = z.object({
    root: z.string(),
    minScore: z.number().min(0).max(1).default(0.35),
    chunkSize: z.number().step(1).min(200).max(8000).default(1200),
    maxUploadBytes: z.number().step(1).min(1).default(DEFAULT_MAX_UPLOAD_BYTES),
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
    const base = filename.replaceAll('\\', '/').split('/').pop() ?? '';
    if (base.length === 0 || base === '.' || base === '..' || base.length > 200)
        return undefined;
    if (/[\u0000-\u001F\u007F]/.test(base) || /[<>:"|?*]/.test(base))
        return undefined;
    if (base.endsWith('.') || base.endsWith(' '))
        return undefined;
    const stem = base.slice(0, base.includes('.') ? base.lastIndexOf('.') : base.length);
    if (WINDOWS_RESERVED.has(stem.toUpperCase()))
        return undefined;
    return base;
}
/**
 * The local knowledge provider. One instance owns the document cache and the
 * JSON file; every mutation republishes the whole library atomically. The
 * embedding seam is optional: without it the provider degrades to lexical
 * retrieval instead of failing to load, so the library keeps working with
 * zero external services.
 */
export class LocalKnowledgeStore extends Knowledge {
    documents = [];
    ready;
    root;
    minScore;
    chunkSize;
    maxUploadBytes;
    persistJson;
    embed;
    embeddingAvailable;
    tokenCache = new WeakMap();
    vectorIndex = new HnswIndex({ maxNeighbors: 16, efSearch: 64 });
    vectorNodeById = new Map();
    constructor(ctx, config) {
        super(ctx);
        this.root = config.root;
        this.minScore = config.minScore ?? 0.35;
        this.chunkSize = config.chunkSize ?? 1200;
        this.maxUploadBytes = config.maxUploadBytes ?? DEFAULT_MAX_UPLOAD_BYTES;
        const embedding = ctx.get('memoryEmbedding');
        this.embeddingAvailable = embedding !== undefined && embedding.activeMode !== 'none';
        this.embed = async (texts) => {
            if (embedding === undefined)
                throw new Error('knowledge-store: embedding service absent');
            const vectors = await embedding.embed(texts);
            if (vectors.length !== texts.length) {
                throw new Error(`knowledge-store: embedding service returned ${vectors.length} vectors for ${texts.length} texts`);
            }
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
        if (root === undefined || root.length === 0)
            throw new Error('knowledge-store: json backend requires root');
        const store = await openJsonStore(root);
        this.documents = [...store.documents];
        this.persistJson = store.persist;
        if (this.embeddingAvailable) {
            for (const document of this.documents) {
                this.addDocumentToVectorIndex(document);
            }
        }
    }
    async ingest(request) {
        await this.ready;
        const target = resolve(request.path);
        const targetStat = await stat(target);
        if (targetStat.isDirectory()) {
            if (request.title !== undefined) {
                throw new Error('knowledge-store: title override applies only to one file, not a directory scan');
            }
            return await this.ingestDirectory(target);
        }
        const outcome = await this.ingestFile(target, request.title);
        if (outcome.kind === 'skipped') {
            return { ingested: [], skipped: [{ path: target, reason: outcome.reason }] };
        }
        await this.persistJson?.(this.documents);
        return { ingested: [outcome.entry], skipped: [] };
    }
    async ingestUploaded(request) {
        await this.ready;
        if (request.bytes.byteLength > this.maxUploadBytes) {
            return {
                ingested: [],
                skipped: [{ path: request.filename, reason: `upload exceeds the ${this.maxUploadBytes}-byte cap` }],
            };
        }
        const filename = sanitizeUploadFilename(request.filename);
        if (filename === undefined || scanFormat(filename) === undefined) {
            return { ingested: [], skipped: [{ path: request.filename, reason: 'unsupported filename or format' }] };
        }
        const target = join(this.root, UPLOADS_DIRECTORY, filename);
        await writeFileAtomic(target, request.bytes, { mode: 0o600, dirMode: 0o700 });
        const outcome = await this.ingestFile(target, request.title);
        if (outcome.kind === 'skipped') {
            return { ingested: [], skipped: [{ path: target, reason: outcome.reason }] };
        }
        await this.persistJson?.(this.documents);
        return { ingested: [outcome.entry], skipped: [] };
    }
    /**
     * Ingest every scan-accepted document of one directory, non-recursively.
     * @param directory - absolute directory path.
     * @returns per-file ingest and skip outcomes; one persist publishes the whole batch.
     */
    async ingestDirectory(directory) {
        const entries = (await readdir(directory, { withFileTypes: true }))
            .filter(entry => entry.isFile() && scanFormat(entry.name) !== undefined)
            .sort((a, b) => a.name.localeCompare(b.name));
        const ingested = [];
        const skipped = [];
        for (const entry of entries) {
            const path = join(directory, entry.name);
            const outcome = await this.ingestFile(path, undefined);
            if (outcome.kind === 'skipped') {
                skipped.push({ path, reason: outcome.reason });
            }
            else {
                ingested.push(outcome.entry);
            }
        }
        if (ingested.length > 0)
            await this.persistJson?.(this.documents);
        return { ingested, skipped };
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
        }
        catch (error) {
            return { kind: 'skipped', reason: `extraction failed: ${error instanceof Error ? error.message : String(error)}` };
        }
        const chunks = chunkText(text, this.chunkSize);
        if (chunks.length === 0)
            return { kind: 'skipped', reason: 'no extractable text' };
        const embeddings = this.embeddingAvailable
            ? await this.embedAll(chunks)
            : undefined;
        const existing = this.documents.findIndex(document => document.path === path);
        const now = Date.now();
        const previous = existing >= 0 ? this.documents[existing] : undefined;
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
                    ...(embedding !== undefined ? { embedding: [...embedding] } : {}),
                };
            }),
        };
        if (previous !== undefined)
            this.removeDocumentFromVectorIndex(previous);
        if (existing >= 0)
            this.documents[existing] = document;
        else
            this.documents.push(document);
        this.addDocumentToVectorIndex(document);
        return { kind: 'ingested', entry: toKnowledgeEntry(document) };
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
        if (pairs.length === 0)
            return [];
        const queryTokens = tokenize(query.text);
        if (queryTokens.length === 0 && !this.embeddingAvailable)
            return [];
        const chunkTokens = new Map();
        const documentFrequency = new Map();
        for (const { chunk } of pairs) {
            const tokens = this.tokenCache.get(chunk) ?? tokenize(chunk.text);
            this.tokenCache.set(chunk, tokens);
            chunkTokens.set(chunk, tokens);
            for (const token of new Set(tokens))
                documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
        }
        const avgLength = [...chunkTokens.values()].reduce((sum, tokens) => sum + tokens.length, 0)
            / chunkTokens.size;
        const ranked = await hybridSearch({
            queryTokens,
            corpus: pairs.map(pair => [pair, chunkTokens.get(pair.chunk) ?? []]),
            documentFrequency,
            documentCount: chunkTokens.size,
            avgLength,
            topK,
            minScore: this.minScore,
            semantic: this.embeddingAvailable ? () => this.semanticMatches(query.text, topK * 4) : undefined,
            keyOf: pair => `${pair.document.id}:${pair.chunk.index}`,
        });
        return ranked.map(match => ({
            document: toKnowledgeEntry(match.item.document),
            chunk: {
                documentId: match.item.document.id,
                index: match.item.chunk.index,
                text: match.item.chunk.text,
            },
            score: match.score,
            fusion: match.fusion,
        }));
    }
    async semanticMatches(text, topK) {
        const [queryVector] = await this.embed([text]);
        if (queryVector === undefined)
            return [];
        return this.vectorIndex.search(queryVector, topK)
            .map(match => ({ item: match.item, score: cosineToScore(match.score) }))
            .filter(match => match.score >= this.minScore);
    }
    async list() {
        await this.ready;
        return [...this.documents]
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(toKnowledgeEntry);
    }
    async remove(id) {
        await this.ready;
        const index = this.documents.findIndex(document => document.id === id);
        if (index < 0)
            return false;
        const [removed] = this.documents.splice(index, 1);
        if (removed !== undefined)
            this.removeDocumentFromVectorIndex(removed);
        await this.persistJson?.(this.documents);
        return true;
    }
    /** Every chunk paired with its owning document, in document then chunk order. */
    indexedChunks() {
        const pairs = [];
        for (const document of this.documents) {
            for (const chunk of document.chunks)
                pairs.push({ document, chunk });
        }
        return pairs;
    }
    /** Add every embedded chunk of one document to the vector index. */
    addDocumentToVectorIndex(document) {
        for (const chunk of document.chunks) {
            if (chunk.embedding !== undefined) {
                this.vectorNodeById.set(`${document.id}:${chunk.index}`, this.vectorIndex.add({ document, chunk }, chunk.embedding));
            }
        }
    }
    /** Drop every vector-index node of one document. */
    removeDocumentFromVectorIndex(document) {
        for (const chunk of document.chunks) {
            const key = `${document.id}:${chunk.index}`;
            const node = this.vectorNodeById.get(key);
            if (node !== undefined) {
                this.vectorIndex.delete(node);
                this.vectorNodeById.delete(key);
            }
        }
    }
}
export default LocalKnowledgeStore;
//# sourceMappingURL=index.js.map