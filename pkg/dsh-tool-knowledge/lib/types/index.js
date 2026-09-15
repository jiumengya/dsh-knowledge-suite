/**
 * Model-facing knowledge tool: explicit ingest, search, list, and remove over
 * the document-library seam. Ingest reads uploaded material files; search
 * returns the most relevant passages with their source citations; every call
 * writes only through {@link Knowledge} so the library stays the single
 * durable record.
 * @module @deepseek-ai/dsh-tool-knowledge
 */
import z from '@deepseek-ai/schemastery';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { KnowledgeId } from '@deepseek-ai/dsh-knowledge';
/** Cordis plugin name used by loader diagnostics. */
export const name = 'tool-knowledge';
/** The knowledge service and tool registry must exist before registration. */
export const inject = ['tools', 'knowledge'];
/** Schemastery validation for {@link Config}. */
export const Config = z.object({
    maxResults: z.number().step(1).min(1).max(50).default(8),
});
const DESCRIPTION = 'Document library of project reference materials. Users upload documents '
    + '(text, Markdown, HTML, PDF, Word); the tool extracts and indexes them. '
    + 'Actions: `ingest` one file or a directory of files by path (re-ingesting '
    + 'a path refreshes its content); `search` passages by meaning, returning '
    + 'the document title and filename for citation; `list` every document; '
    + '`remove` one document by id. Use it when a task references uploaded '
    + 'materials or background documents.';
/** JSON-schema fields shared by every document summary the tool reports. */
const documentSummaryFields = {
    id: { type: 'string', required: true },
    title: { type: 'string', required: true },
    filename: { type: 'string', required: true },
    format: { type: 'string', required: true },
    chunkCount: { type: 'integer', required: true },
};
/**
 * Register the `knowledge` tool on `ctx.tools`.
 * @param ctx - registrant context carrying the tool registry and knowledge service.
 * @param config - deployment's explicit result cap.
 */
export function apply(ctx, config) {
    const maxResults = config.maxResults;
    ctx.tools.register(defineTool({
        name: 'knowledge',
        description: DESCRIPTION,
        parameters: {
            action: {
                type: 'string',
                required: true,
                enum: ['ingest', 'search', 'list', 'remove'],
                description: 'ingest (add file or directory) | search (find passages) | list (all documents) | remove (delete by id).',
            },
            path: {
                type: 'string',
                description: 'File or directory path to ingest (action=ingest).',
            },
            title: {
                type: 'string',
                description: 'Optional display title for one ingested file (action=ingest).',
            },
            text: {
                type: 'string',
                description: 'The search query (action=search).',
            },
            id: {
                type: 'string',
                description: 'Document id to remove (action=remove).',
            },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    action: { type: 'string', required: true },
                    ingested: {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                ...documentSummaryFields,
                                path: { type: 'string', required: true },
                            },
                        },
                    },
                    skipped: {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                path: { type: 'string', required: true },
                                reason: { type: 'string', required: true },
                            },
                        },
                    },
                    matches: {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                documentTitle: { type: 'string', required: true },
                                filename: { type: 'string', required: true },
                                chunkIndex: { type: 'integer', required: true },
                                text: { type: 'string', required: true },
                                score: { type: 'number', required: true },
                                fusion: { type: 'number' },
                            },
                        },
                    },
                    documents: {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                ...documentSummaryFields,
                                createdAt: { type: 'integer', required: true },
                            },
                        },
                    },
                    removed: { type: 'boolean' },
                },
            },
            render: (args, value) => [{
                    type: 'text',
                    text: renderResult(args.action, value),
                }],
        },
        execute(args) {
            switch (args.action) {
                case 'ingest':
                    return ingest(ctx, args);
                case 'search':
                    return search(ctx, args, maxResults);
                case 'list':
                    return list(ctx);
                case 'remove':
                    return remove(ctx, args);
            }
        },
        presentCall: args => ({ card: 'generic', title: `Knowledge ${args.action}`, kind: 'other', rawInput: args }),
    }));
}
/** Ingest one file or directory. */
async function ingest(ctx, args) {
    const path = args.path?.trim();
    if (path === undefined || path.length === 0) {
        throw new Error('knowledge ingest requires `path`');
    }
    const result = await ctx.knowledge.ingest({
        path,
        ...(args.title !== undefined && args.title.trim().length > 0 ? { title: args.title.trim() } : {}),
    });
    return {
        action: 'ingest',
        ingested: result.ingested.map(entry => ({
            id: entry.id,
            title: entry.title,
            filename: entry.filename,
            format: entry.format,
            chunkCount: entry.chunkCount,
            path: entry.path,
        })),
        skipped: result.skipped.map(skip => ({ path: skip.path, reason: skip.reason })),
    };
}
/** Search passages by meaning. */
async function search(ctx, args, maxResults) {
    const text = args.text?.trim();
    if (text === undefined || text.length === 0) {
        throw new Error('knowledge search requires non-empty `text`');
    }
    const matches = await ctx.knowledge.search({ text, topK: maxResults });
    return {
        action: 'search',
        matches: matches.map(match => ({
            documentTitle: match.document.title,
            filename: match.document.filename,
            chunkIndex: match.chunk.index,
            text: match.chunk.text,
            score: match.score,
            ...(match.fusion === undefined ? {} : { fusion: match.fusion }),
        })),
    };
}
/** List every document, newest first. */
async function list(ctx) {
    const entries = await ctx.knowledge.list();
    return {
        action: 'list',
        documents: entries.map(entry => ({
            id: entry.id,
            title: entry.title,
            filename: entry.filename,
            format: entry.format,
            chunkCount: entry.chunkCount,
            createdAt: entry.createdAt,
        })),
    };
}
/** Remove one document by id. */
async function remove(ctx, args) {
    if (args.id === undefined || args.id.length === 0) {
        throw new Error('knowledge remove requires `id`');
    }
    return { action: 'remove', removed: await ctx.knowledge.remove(KnowledgeId(args.id)) };
}
/** Render one tool result for the model. */
function renderResult(action, value) {
    switch (action) {
        case 'ingest': {
            const ingested = value.ingested?.length ?? 0;
            const skipped = value.skipped?.length ?? 0;
            const parts = [`Ingested ${ingested} document${ingested === 1 ? '' : 's'}.`];
            if (skipped > 0 && value.skipped !== undefined) {
                const skippedList = value.skipped.map(skip => `${skip.path} (${skip.reason})`).join('; ');
                parts.push(`Skipped ${skipped} file${skipped === 1 ? '' : 's'}: ${skippedList}.`);
            }
            return parts.join(' ');
        }
        case 'search':
            return value.matches === undefined || value.matches.length === 0
                ? 'No matching passages.'
                : `Found ${value.matches.length} matching passages.`;
        case 'list':
            return value.documents === undefined
                ? 'No documents in the library.'
                : `${value.documents.length} documents in the library.`;
        case 'remove':
            return value.removed === true ? 'Document removed.' : 'No document with that id.';
        default:
            return 'Unknown knowledge action.';
    }
}
//# sourceMappingURL=index.js.map