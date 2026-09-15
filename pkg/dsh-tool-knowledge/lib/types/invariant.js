/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-tool-knowledge`.
 * @module @deepseek-ai/dsh-tool-knowledge/invariant
 */
const PACKAGE_NAME = '@deepseek-ai/dsh-tool-knowledge';
/** Cordis companion plugin name. */
export const name = 'tool-knowledge-invariant';
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants'];
/**
 * No runtime invariant: this model-facing adapter owns no independent event
 * stream; tool input and output schemas are enforced by the tool registry.
 */
const install = () => { };
/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
/* jscpd:ignore-end */
//# sourceMappingURL=invariant.js.map