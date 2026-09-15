/**
 * Host Remote owner for the document-library wire domain. Three unary methods
 * — `list`, `ingest`, `remove` — over `ctx.knowledge`. Retrieval stays
 * model-side (the knowledge tool and pre-step recall Consumers) and never
 * crosses this wire. Uploads carry file bytes as canonical base64 in the JSON
 * envelope, exactly as image prompt parts do; the provider decodes and
 * persists the bytes before ingesting them.
 *
 * @module @deepseek-ai/dsh-api-knowledge-controller
 */
import { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { KnowledgeEntryView, KnowledgeSkipView } from './types.ts';
export type * from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        /** Host owner of the `knowledge` Remote namespace. */
        knowledgeController: KnowledgeController;
    }
}
/**
 * Host service backing the generated `ctx.remote.knowledge` namespace. The
 * `ctx.knowledge` read stays optional so a composition without the
 * document-library provider still serves every other domain; each call reports
 * the missing-provider diagnostic.
 */
export declare class KnowledgeController extends TypertRemoteService {
    constructor(ctx: Context);
    /** Resolve the optional provider or report how to supply it. */
    private provider;
    /**
     * List every library document, newest first.
     * @returns every stored entry as its wire view.
     */
    list(): Promise<KnowledgeEntryView[]>;
    /**
     * Upload one document into the library. The host decodes `data` (canonical
     * base64), and the store persists the bytes inside the library it owns and
     * ingests that file — uploading the same filename again replaces the entry.
     * @param filename - client-reported filename including extension.
     * @param data - the file bytes as canonical base64.
     * @param title - optional display title overriding the file basename.
     * @returns the ingested entries and skipped candidates.
     */
    ingest(filename: string, data: string, title: string | undefined): Promise<{
        ingested: KnowledgeEntryView[];
        skipped: KnowledgeSkipView[];
    }>;
    /**
     * Remove one document and its chunks permanently. Idempotent: removing an
     * absent id succeeds with `removed: false`.
     * @param id - library identity returned by `list` or `ingest`.
     * @returns whether a document was removed.
     */
    removeDocument(id: string): Promise<{
        removed: boolean;
    }>;
}
export default KnowledgeController;
//# sourceMappingURL=index.d.ts.map