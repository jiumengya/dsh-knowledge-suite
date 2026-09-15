/**
 * Knowledge Service Definition (`ctx.knowledge`): a document library users
 * fill with project materials and the agent retrieves from. Providers own
 * text extraction, chunking, storage, and retrieval — semantic vector search
 * when an embedding model is available, lexical fallback otherwise. Consumers
 * are the model-facing knowledge tool and pre-step retrieval injection into
 * RAG context assembly.
 *
 * Long-term memory is out of scope here: `ctx.memory` stores distilled
 * conversation facts; this seam stores whole uploaded documents.
 * @module @deepseek-ai/dsh-knowledge
 */
import { Context, Service } from '@deepseek-ai/cordis';
import type { KnowledgeEntry, KnowledgeIngestRequest, KnowledgeIngestResult, KnowledgeMatch, KnowledgeQuery, KnowledgeUploadRequest } from './types.ts';
import type { KnowledgeId } from './brand.ts';
export type { KnowledgeEntry, KnowledgeIngestRequest, KnowledgeIngestResult, KnowledgeMatch, KnowledgeQuery, KnowledgeUploadRequest, KnowledgeSkip, KnowledgeChunk, KnowledgeFormat, } from './types.ts';
export { KnowledgeId } from './brand.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        knowledge: Knowledge;
    }
}
/**
 * Abstract document-library service. Implementations own durability and the
 * retrieval metric. Load one implementation per context as `ctx.knowledge`.
 */
export declare abstract class Knowledge extends Service {
    constructor(ctx: Context);
    /**
     * Ingest one file or every supported file of one directory into the
     * library. Ingesting a path already in the library replaces its content,
     * preserving identity and creation time.
     * @param request - the file or directory path, plus an optional single-file
     * display title.
     * @returns newly ingested entries and skipped candidate files with reasons.
     */
    abstract ingest(request: KnowledgeIngestRequest): Promise<KnowledgeIngestResult>;
    /**
     * Ingest one uploaded file whose bytes crossed a wire and had no host path
     * until the provider persisted them. Implementations keep the bytes inside
     * the library they own, so uploading the same filename again replaces that
     * entry exactly as re-ingesting one path does.
     * @param request - the reported filename, complete bytes, and optional
     * display title.
     * @returns newly ingested entries and skipped candidates with reasons.
     */
    abstract ingestUploaded(request: KnowledgeUploadRequest): Promise<KnowledgeIngestResult>;
    /**
     * Retrieve the most relevant document chunks for one query.
     * @param query - natural-language query and result count.
     * @returns the top matches ordered by descending fusion when the provider
     * fuses retrieval channels, otherwise by descending score; empty when the
     * library holds nothing.
     */
    abstract search(query: KnowledgeQuery): Promise<readonly KnowledgeMatch[]>;
    /**
     * List all documents, newest first.
     * @returns every stored entry ordered by descending `createdAt`.
     */
    abstract list(): Promise<readonly KnowledgeEntry[]>;
    /**
     * Remove one document and its chunks permanently.
     * @param id - identity returned by {@link ingest} or {@link list}.
     * @returns whether a document was removed.
     */
    abstract remove(id: KnowledgeId): Promise<boolean>;
}
export default Knowledge;
//# sourceMappingURL=index.d.ts.map