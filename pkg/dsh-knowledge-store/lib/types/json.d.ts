/**
 * Local JSON-file knowledge backend: one `knowledge.json` under a configured
 * root, atomically republished on every mutation. In-memory state is
 * authoritative; chunk embeddings ride along with documents so a later
 * embedding provider switch keeps the file loadable.
 * @module @deepseek-ai/dsh-knowledge-store/src/json
 */
import type { StoredDocument } from './types.ts';
/**
 * Open or create the JSON-backed store.
 * @param root - directory holding `knowledge.json`; created on first write.
 * @returns the loaded documents and a persist function.
 */
export declare function openJsonStore(root: string): Promise<{
    documents: readonly StoredDocument[];
    persist: (documents: readonly StoredDocument[]) => Promise<void>;
}>;
/**
 * Serialize documents into the on-disk file text.
 * @param documents - complete library contents, in file order.
 * @returns the version-1 file text with one trailing newline.
 */
export declare function serializeKnowledgeFile(documents: readonly StoredDocument[]): string;
/**
 * Parse and validate file text into documents.
 * @param text - raw file contents.
 * @param path - file path used only in corruption diagnostics.
 * @returns the validated documents, in file order.
 * @throws when the file is not valid JSON or does not match the stored shape.
 */
export declare function parseKnowledgeFile(text: string, path: string): StoredDocument[];
//# sourceMappingURL=json.d.ts.map