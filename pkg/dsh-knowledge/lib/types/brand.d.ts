import type { Branded } from '@deepseek-ai/dsh-brand';
/** Stable identity of one document in the knowledge library. */
export type KnowledgeId = Branded<'KnowledgeId'>;
/**
 * Brand an implementation-minted document identity.
 * @param id - opaque document identity.
 * @returns the same string, branded; no validation is performed.
 */
export declare function KnowledgeId(id: string): KnowledgeId;
//# sourceMappingURL=brand.d.ts.map