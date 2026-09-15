/**
 * Knowledge retrieval injection Consumer: before each model request, retrieve
 * the most relevant document-library passages for the incoming user text and
 * inject them as one durable, source-attributed snapshot user message — the
 * same pattern as memory-recall. This is the document-library step of RAG
 * context assembly; model-visible input is fully logged, satisfying the
 * model-visible ⟺ logged invariant.
 * @module @deepseek-ai/dsh-knowledge-recall
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { type RecallInjectionConfig } from '@deepseek-ai/dsh-agent';
/** Cordis plugin name used by loader diagnostics. */
export declare const name = "knowledge-recall";
/** The knowledge service and agent registry must exist before registration. */
export declare const inject: string[];
/** Knowledge retrieval injection configuration. */
export type Config = RecallInjectionConfig;
/** Schemastery validation for {@link Config}. */
export declare const Config: z<Config>;
/**
 * Register a prepended pre-step listener injecting retrieved passages.
 * @param ctx - plugin context; the listener is disposed with it.
 * @param config - retrieval breadth and scheduling configuration.
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map