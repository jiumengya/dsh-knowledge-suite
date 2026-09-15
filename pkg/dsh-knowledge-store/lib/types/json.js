/**
 * Local JSON-file knowledge backend: one `knowledge.json` under a configured
 * root, atomically republished on every mutation. In-memory state is
 * authoritative; chunk embeddings ride along with documents so a later
 * embedding provider switch keeps the file loadable.
 * @module @deepseek-ai/dsh-knowledge-store/src/json
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { writeFileAtomic } from '@deepseek-ai/dsh-atomic-write';
const FORMATS = ['text', 'markdown', 'html', 'pdf', 'docx'];
/**
 * Open or create the JSON-backed store.
 * @param root - directory holding `knowledge.json`; created on first write.
 * @returns the loaded documents and a persist function.
 */
export async function openJsonStore(root) {
    let documents = [];
    const path = join(root, 'knowledge.json');
    try {
        documents = parseKnowledgeFile(await readFile(path, 'utf8'), path);
    }
    catch (error) {
        if (error.code !== 'ENOENT')
            throw error;
        // Missing file = empty library; materialization defers to the first write.
    }
    const persist = async (next) => {
        await writeFileAtomic(path, serializeKnowledgeFile(next), { mode: 0o600, dirMode: 0o700 });
    };
    return { documents: [...documents], persist };
}
/**
 * Serialize documents into the on-disk file text.
 * @param documents - complete library contents, in file order.
 * @returns the version-1 file text with one trailing newline.
 */
export function serializeKnowledgeFile(documents) {
    const file = { version: 1, documents };
    return `${JSON.stringify(file, null, 2)}\n`;
}
/**
 * Parse and validate file text into documents.
 * @param text - raw file contents.
 * @param path - file path used only in corruption diagnostics.
 * @returns the validated documents, in file order.
 * @throws when the file is not valid JSON or does not match the stored shape.
 */
export function parseKnowledgeFile(text, path) {
    let parsed;
    try {
        parsed = JSON.parse(text);
    }
    catch (error) {
        throw new Error(`corrupt knowledge store "${path}": invalid JSON`, { cause: error });
    }
    if (typeof parsed !== 'object' || parsed === null) {
        throw new Error(`corrupt knowledge store "${path}": unexpected file structure`);
    }
    const { version, documents } = parsed;
    if (version !== 1 || !Array.isArray(documents)) {
        throw new Error(`corrupt knowledge store "${path}": unexpected file structure`);
    }
    return documents.map(document => validateStoredDocument(document, path));
}
/** Validate one decoded document against the stored shape. */
function validateStoredDocument(value, storePath) {
    if (typeof value !== 'object' || value === null) {
        throw new Error(`corrupt knowledge store "${storePath}": document is not an object`);
    }
    const { id, title, filename, format, path, createdAt, updatedAt, chunks } = value;
    if (typeof id !== 'string'
        || typeof title !== 'string'
        || typeof filename !== 'string'
        || typeof format !== 'string'
        || !FORMATS.includes(format)
        || typeof path !== 'string'
        || typeof createdAt !== 'number'
        || typeof updatedAt !== 'number'
        || !Array.isArray(chunks)
        || chunks.some(chunk => !isValidChunk(chunk))) {
        throw new Error(`corrupt knowledge store "${storePath}": document does not match the stored shape`);
    }
    return value;
}
/** Validate one decoded chunk. */
function isValidChunk(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const { index, text, embedding } = value;
    if (typeof index !== 'number' || typeof text !== 'string')
        return false;
    return embedding === undefined
        || (Array.isArray(embedding) && embedding.every(dim => typeof dim === 'number'));
}
//# sourceMappingURL=json.js.map