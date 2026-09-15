/**
 * Narrow a stored document to the seam's public entry shape.
 * @param document - the stored document.
 * @returns the public entry without chunk payloads.
 */
export function toKnowledgeEntry(document) {
    return {
        id: document.id,
        title: document.title,
        filename: document.filename,
        format: document.format,
        path: document.path,
        chunkCount: document.chunks.length,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
    };
}
//# sourceMappingURL=types.js.map