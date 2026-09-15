/**
 * Document-format detection and text extraction for the local knowledge
 * store. Plain text, Markdown, and HTML extract in-process; PDF and Word load
 * their parsers through dynamic import so the store starts without them and
 * pays the parse cost only per document of that format.
 * @module @deepseek-ai/dsh-knowledge-store/src/extract
 */
import type { KnowledgeFormat } from '@deepseek-ai/dsh-knowledge';
/**
 * Detect a document format from the filename, restricted to the extensions a
 * directory scan accepts.
 * @param filename - candidate file name.
 * @returns the format, or `undefined` when the extension is not a scan-accepted document format.
 */
export declare function scanFormat(filename: string): KnowledgeFormat | undefined;
/**
 * Resolve the format of one explicitly named file. Unlike {@link scanFormat},
 * an unknown or missing extension falls back to `text`: a file the caller
 * pointed at directly is ingested rather than skipped.
 * @param filename - explicitly named file.
 * @returns the format; never `undefined`.
 */
export declare function explicitFormat(filename: string): KnowledgeFormat;
/**
 * Extract the retrievable text of one document file.
 * @param path - absolute file path.
 * @param format - the document's format.
 * @returns the extracted text; whitespace is not normalized here — chunking owns that.
 * @throws when the file cannot be read or the parser rejects its contents.
 */
export declare function extractDocumentText(path: string, format: KnowledgeFormat): Promise<string>;
/**
 * Reduce HTML to retrievable text: drop script/style blocks, convert block
 * closings and `<br>` to newlines, strip remaining tags, and decode common
 * entities. Lossy by design — the output feeds retrieval, not rendering.
 * @param html - raw HTML source.
 * @returns the visible text content.
 */
export declare function stripHtml(html: string): string;
//# sourceMappingURL=extract.d.ts.map