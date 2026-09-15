import type { KnowledgeEntry, KnowledgeFormat } from '@deepseek-ai/dsh-knowledge';
/**
 * The stored-chunk unit: one extracted retrieval unit plus its embedding when
 * the active embedding provider has vectorized it. The embedding is optional
 * so a store can hold chunks ingested before embeddings were configured.
 */
export interface StoredChunk {
    readonly index: number;
    readonly text: string;
    readonly embedding?: readonly number[];
}
/**
 * The stored-document unit: one library entry plus its extracted chunks.
 * Chunks ride along with the document so one JSON write publishes the whole
 * library consistently.
 */
export interface StoredDocument {
    readonly id: string;
    readonly title: string;
    readonly filename: string;
    readonly format: KnowledgeFormat;
    readonly path: string;
    readonly createdAt: number;
    readonly updatedAt: number;
    readonly chunks: readonly StoredChunk[];
}
/**
 * Narrow a stored document to the seam's public entry shape.
 * @param document - the stored document.
 * @returns the public entry without chunk payloads.
 */
export declare function toKnowledgeEntry(document: StoredDocument): KnowledgeEntry;
//# sourceMappingURL=types.d.ts.map