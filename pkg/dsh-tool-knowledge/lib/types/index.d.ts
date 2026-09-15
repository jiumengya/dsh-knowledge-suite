/**
 * Model-facing knowledge tool: explicit ingest, search, list, and remove over
 * the document-library seam. Ingest reads uploaded material files; search
 * returns the most relevant passages with their source citations; every call
 * writes only through {@link Knowledge} so the library stays the single
 * durable record.
 * @module @deepseek-ai/dsh-tool-knowledge
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
/** Cordis plugin name used by loader diagnostics. */
export declare const name = "tool-knowledge";
/** The knowledge service and tool registry must exist before registration. */
export declare const inject: string[];
/** Model-facing knowledge tool configuration. */
export interface Config {
    /** Maximum passages returned by one search; defaults to 8. */
    maxResults: number;
}
/** Schemastery validation for {@link Config}. */
export declare const Config: z<Config>;
/**
 * Register the `knowledge` tool on `ctx.tools`.
 * @param ctx - registrant context carrying the tool registry and knowledge service.
 * @param config - deployment's explicit result cap.
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map