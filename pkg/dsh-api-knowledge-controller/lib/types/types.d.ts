/**
 * Browser-safe wire vocabulary of the document-library surface this package
 * serves. The entry model itself lives with its seam in
 * `@deepseek-ai/dsh-knowledge`; these views widen the branded id to a plain
 * string at the wire boundary and carry nothing beyond what the settings page
 * renders.
 *
 * @module @deepseek-ai/dsh-api-knowledge-controller/types
 */
import type { KnowledgeFormat } from '@deepseek-ai/dsh-knowledge';
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface RemoteErrorDetailsMap {
        /**
         * A document-library write was refused: non-canonical upload bytes, an
         * unwritable store, or a provider failure. The details name the target —
         * the uploaded filename for ingest, the entry id for remove.
         */
        'knowledge/rejected': {
            readonly target: string;
        };
    }
}
/** Wire view of one library entry; the entry id is an opaque string here. */
export interface KnowledgeEntryView {
    /** Opaque library identity, echoed back by `knowledge.remove`. */
    readonly id: string;
    /** Human-readable display title. */
    readonly title: string;
    /** Original filename including extension. */
    readonly filename: string;
    /** Format detected at ingest. */
    readonly format: KnowledgeFormat;
    /** Store-side source path the document ingested from (uploads persist below the library root). */
    readonly path: string;
    /** Number of extracted chunks held for this document. */
    readonly chunkCount: number;
    /** Epoch milliseconds when the document entered the library. */
    readonly createdAt: number;
    /** Epoch milliseconds when the document content was last re-ingested. */
    readonly updatedAt: number;
}
/** One candidate upload ingest did not add to the library. */
export interface KnowledgeSkipView {
    /** The upload filename or store-side path that was skipped. */
    readonly path: string;
    /** Human-readable skip reason: unsupported filename/format, over the cap, or extraction failure. */
    readonly reason: string;
}
//# sourceMappingURL=types.d.ts.map