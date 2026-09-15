/**
 * Paragraph-aware text chunking for the local knowledge store: whole
 * paragraphs accumulate up to the configured size, oversized paragraphs split
 * on sentence boundaries, and unbreakable runs split by character.
 * @module @deepseek-ai/dsh-knowledge-store/src/chunk
 */
/**
 * Split extracted text into retrieval chunks.
 * @param text - extracted document text.
 * @param chunkSize - maximum characters per chunk; paragraphs never merge past it.
 * @returns one or more non-empty chunks in reading order; `[]` when the text has no non-whitespace content.
 */
export declare function chunkText(text: string, chunkSize: number): readonly string[];
//# sourceMappingURL=chunk.d.ts.map