/**
 * Knowledge settings-section controller: the document library as one list,
 * uploads as a per-file report, and a delete confirmation over one entry.
 *
 * The browser owns no library state. Every mutation writes through the
 * knowledge wire domain and the page re-reads the library afterwards, because
 * the model's own knowledge tool can change the same library between renders
 * and nothing on the wire announces it.
 */
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol';
import type { KnowledgeEntryView, KnowledgeSkipView } from '@deepseek-ai/dsh-api-remotes/client';
import { type SnapshotStore } from '@deepseek-ai/dsh-client-store';
/**
 * The generated `knowledge` Remote namespace face this controller drives. The
 * methods carry canonical base64 upload bytes in the JSON envelope, exactly as
 * image prompt parts do.
 */
export interface KnowledgeRemote {
    list(): Promise<RemoteResult<KnowledgeEntryView[]>>;
    ingest(filename: string, data: string, title: string | undefined): Promise<RemoteResult<{
        ingested: KnowledgeEntryView[];
        skipped: KnowledgeSkipView[];
    }>>;
    removeDocument(id: string): Promise<RemoteResult<{
        removed: boolean;
    }>>;
}
/**
 * Human text for a rejected wire call. A transport failure rejects with an
 * Error; a host or a runtime can reject with anything, and the surface still
 * has to say something.
 * @param error - the rejection value.
 * @returns the message to show.
 */
export declare function messageOf(error: unknown): string;
/**
 * Encode upload bytes as the canonical base64 the knowledge wire accepts.
 *
 * `btoa` over one spread of a multi-megabyte file overflows the argument
 * limit, so the string is assembled in bounded chunks. `btoa` emits canonical
 * base64 (final partial group padded with `=`), which is exactly the form the
 * host's round-trip check demands.
 * @param bytes - the complete file bytes.
 * @returns the canonical base64 text.
 */
export declare function encodeUploadBase64(bytes: Uint8Array): string;
/** One library entry the page renders, exactly as the host reported it. */
export type KnowledgeRow = KnowledgeEntryView;
/**
 * One selected file's upload outcome, shown until the next upload or dismiss.
 *
 * The statuses read as the file's own progress: `reading` gathers its bytes,
 * `sending` carries them, and the three settled statuses name what the host
 * did with them — added, skipped with a reason, or refused.
 */
export interface UploadRow {
    /** Filename as selected, also the identity the store re-ingests under. */
    filename: string;
    /** The file's current stage. */
    status: 'reading' | 'sending' | 'ingested' | 'skipped' | 'failed';
    /**
     * Why a settled file did not enter the library: the host's skip reason or
     * refusal message, absent while in flight and on success.
     */
    reason?: string;
}
/** Page snapshot. */
export interface KnowledgeSectionState {
    status: 'idle' | 'loading' | 'ready' | 'error';
    /** Whole-load failure text; a single upload's failure stays on its row. */
    error: string | null;
    /** Every library entry, in the order the host lists them (newest first). */
    rows: readonly KnowledgeRow[];
    /** The in-flight or just-settled upload batch, empty when there is none. */
    uploads: readonly UploadRow[];
    /** The entry awaiting delete confirmation. */
    pendingDelete: string | null;
    /** Whether a delete is in flight. */
    deleting: boolean;
}
/** Reads the library and drives uploads and deletes. */
export declare class KnowledgeSectionController {
    private readonly api;
    /** Page snapshot the renderer subscribes to. */
    readonly store: SnapshotStore<KnowledgeSectionState>;
    constructor(api: KnowledgeRemote);
    private set;
    private patchUpload;
    /**
     * Load the library. An empty library is a valid state rather than a
     * failure — the section shows its empty intro and the upload button.
     * @returns once the snapshot reflects the host.
     */
    load(): Promise<void>;
    /**
     * Upload the selected files one by one, reporting each outcome on its own
     * row, then re-read the library when at least one landed.
     *
     * One file per request: the store ingests sequentially anyway (each upload
     * rewrites the whole library JSON), and a per-file report is what the page
     * shows — batching would turn three clear outcomes into one opaque failure.
     * @param files - the files the picker handed over.
     * @returns once every selected file settled and the page reflects them.
     */
    upload(files: readonly File[]): Promise<void>;
    /** Clear the settled upload report. */
    dismissUploads(): void;
    /**
     * Ask for confirmation before deleting one entry.
     * @param id - the entry to delete, or null to dismiss the confirmation.
     */
    confirmDelete(id: string | null): void;
    /**
     * Delete the entry awaiting confirmation, then re-read the library.
     * @returns once the delete settled and the page reflects it.
     */
    remove(): Promise<void>;
}
//# sourceMappingURL=section-store.d.ts.map