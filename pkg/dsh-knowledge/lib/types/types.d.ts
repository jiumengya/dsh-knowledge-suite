import type { KnowledgeId } from './brand.ts';
/**
 * Extracted document format. Providers detect the format from the file
 * extension at ingest; the format decides the text-extraction routine.
 * - `text` — plain text, including `.txt` and source-code-like extensions.
 * - `markdown` — Markdown prose.
 * - `html` — HTML or XML markup with tags stripped during extraction.
 * - `pdf` — Portable Document Format.
 * - `docx` — Office Open XML word-processing document.
 */
export type KnowledgeFormat = 'text' | 'markdown' | 'html' | 'pdf' | 'docx';
/**
 * One ingested document: library identity plus provenance for browsing and
 * citations. The entry carries no document text — the store keeps the
 * extracted chunks and retrieval returns them per match.
 */
export interface KnowledgeEntry {
    readonly id: KnowledgeId;
    /** Human-readable display title; defaults to the file basename without extension. */
    readonly title: string;
    /** Original filename including extension. */
    readonly filename: string;
    /** Format detected at ingest. */
    readonly format: KnowledgeFormat;
    /** Absolute path of the source file at ingest time. */
    readonly path: string;
    /** Number of extracted chunks held for this document. */
    readonly chunkCount: number;
    /** Epoch milliseconds when the document entered the library. */
    readonly createdAt: number;
    /** Epoch milliseconds when the document content was last re-ingested. */
    readonly updatedAt: number;
}
/** New-document input for {@link Knowledge.ingest}. */
export interface KnowledgeIngestRequest {
    /**
     * Absolute or workspace-relative path of a supported file, or of a directory
     * holding supported files (scanned non-recursively).
     */
    readonly path: string;
    /**
     * Display title overriding the file basename; applies only when `path`
     * resolves to a single file.
     */
    readonly title?: string;
}
/**
 * Wire-upload input for {@link Knowledge.ingestUploaded}: one file whose bytes
 * cross a boundary (a browser file input) and has no host path yet.
 */
export interface KnowledgeUploadRequest {
    /**
     * Filename including extension, as the uploading client reports it.
     * Implementations sanitize it before persisting the bytes.
     */
    readonly filename: string;
    /** Complete file bytes; the provider persists them inside the library it owns. */
    readonly bytes: Uint8Array;
    /** Display title overriding the file basename. */
    readonly title?: string;
}
/** Result of one {@link Knowledge.ingest} call. */
export interface KnowledgeIngestResult {
    /** Successfully ingested documents. */
    readonly ingested: readonly KnowledgeEntry[];
    /** Skipped candidate files, each with the reason. */
    readonly skipped: readonly KnowledgeSkip[];
}
/** One candidate file that ingest did not add to the library. */
export interface KnowledgeSkip {
    /** Absolute path of the skipped file. */
    readonly path: string;
    /** Human-readable skip reason: unsupported format or extraction failure. */
    readonly reason: string;
}
/** One extracted retrieval unit of a document. */
export interface KnowledgeChunk {
    /** Identity of the document this chunk belongs to. */
    readonly documentId: KnowledgeId;
    /** Zero-based position of the chunk within its document. */
    readonly index: number;
    /** Chunk text; non-empty. */
    readonly text: string;
}
/** One retrieved chunk with its owning document and relevance score. */
export interface KnowledgeMatch {
    /** The document the matched chunk belongs to. */
    readonly document: KnowledgeEntry;
    /** The matched chunk. */
    readonly chunk: KnowledgeChunk;
    /** Retrieval score in [0, 1]; higher is more relevant. Comparable within one backend. */
    readonly score: number;
    /**
     * Reciprocal-rank-fusion contribution that ordered this match within the
     * result list; higher ranks earlier. Present when the provider fuses
     * retrieval channels — the local store always does.
     */
    readonly fusion?: number;
}
/** Search query for {@link Knowledge.search}. */
export interface KnowledgeQuery {
    /** Natural-language query text. */
    readonly text: string;
    /** Maximum number of chunks to return; positive. */
    readonly topK: number;
}
//# sourceMappingURL=types.d.ts.map