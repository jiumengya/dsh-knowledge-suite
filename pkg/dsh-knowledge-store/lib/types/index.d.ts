/**
 * Local knowledge Service Provider: a durable document library over one JSON
 * file, retrieved by embedding cosine similarity when the embedding seam is
 * present and by lexical BM25 otherwise. Ingestion extracts text from plain
 * text, Markdown, HTML, PDF, and Word sources, splits it into chunks, and
 * indexes each chunk through both retrieval channels.
 * @module @deepseek-ai/dsh-knowledge-store
 */
import { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { Knowledge } from '@deepseek-ai/dsh-knowledge';
import type { KnowledgeEntry, KnowledgeIngestRequest, KnowledgeIngestResult, KnowledgeMatch, KnowledgeQuery, KnowledgeUploadRequest } from '@deepseek-ai/dsh-knowledge';
import type { KnowledgeId } from '@deepseek-ai/dsh-knowledge';
import type { MemoryEmbedding } from '@deepseek-ai/dsh-memory-embedding';
/** Default maximum accepted bytes for one uploaded document (32 MiB). */
export declare const DEFAULT_MAX_UPLOAD_BYTES: number;
/** Cordis plugin name used by loader diagnostics. */
export declare const name = "knowledge-store";
declare module '@deepseek-ai/cordis' {
    interface Context {
        memoryEmbedding: MemoryEmbedding;
    }
}
/** Plugin configuration: library location and retrieval behavior. */
export interface Config {
    /** Directory holding `knowledge.json`. Required. */
    root: string;
    /** Minimum cosine score for a semantic chunk match to be returned; defaults to 0.35. */
    minScore?: number;
    /** Maximum characters per retrieval chunk; defaults to 1200. */
    chunkSize?: number;
    /** Maximum bytes accepted for one uploaded document; defaults to 32 MiB. */
    maxUploadBytes?: number;
}
/** Schemastery validation for {@link Config}. */
export declare const Config: z<Config>;
/**
 * The local knowledge provider. One instance owns the document cache and the
 * JSON file; every mutation republishes the whole library atomically. The
 * embedding seam is optional: without it the provider degrades to lexical
 * retrieval instead of failing to load, so the library keeps working with
 * zero external services.
 */
export declare class LocalKnowledgeStore extends Knowledge {
    private documents;
    private ready;
    private readonly root;
    private readonly minScore;
    private readonly chunkSize;
    private readonly maxUploadBytes;
    private persistJson;
    private readonly embed;
    private readonly embeddingAvailable;
    private readonly tokenCache;
    private readonly vectorIndex;
    private readonly vectorNodeById;
    constructor(ctx: Context, config: Config);
    /**
     * Open the JSON backend and load documents.
     * @param config - validated plugin configuration.
     */
    private open;
    ingest(request: KnowledgeIngestRequest): Promise<KnowledgeIngestResult>;
    ingestUploaded(request: KnowledgeUploadRequest): Promise<KnowledgeIngestResult>;
    /**
     * Ingest every scan-accepted document of one directory, non-recursively.
     * @param directory - absolute directory path.
     * @returns per-file ingest and skip outcomes; one persist publishes the whole batch.
     */
    private ingestDirectory;
    /**
     * Extract, chunk, index, and store one file. Extraction failure is one
     * file's skip reason, not a batch failure; embedding failure throws because
     * a configured endpoint rejecting every request is a systemic fault.
     * @param path - absolute file path.
     * @param title - explicit display title overriding the file basename.
     * @returns the stored entry, or the skip reason.
     */
    private ingestFile;
    /**
     * Embed every chunk text in endpoint-sized batches.
     * @param texts - chunk texts in document order.
     * @returns one vector per chunk, in order.
     */
    private embedAll;
    search(query: KnowledgeQuery): Promise<readonly KnowledgeMatch[]>;
    private semanticMatches;
    list(): Promise<readonly KnowledgeEntry[]>;
    remove(id: KnowledgeId): Promise<boolean>;
    /** Every chunk paired with its owning document, in document then chunk order. */
    private indexedChunks;
    /** Add every embedded chunk of one document to the vector index. */
    private addDocumentToVectorIndex;
    /** Drop every vector-index node of one document. */
    private removeDocumentFromVectorIndex;
}
export default LocalKnowledgeStore;
//# sourceMappingURL=index.d.ts.map