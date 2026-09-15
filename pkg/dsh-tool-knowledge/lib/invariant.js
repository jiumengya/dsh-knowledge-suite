//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `@deepseek-ai/dsh-tool-knowledge`.
* @module @deepseek-ai/dsh-tool-knowledge/invariant
*/
const PACKAGE_NAME = "@deepseek-ai/dsh-tool-knowledge";
/** Cordis companion plugin name. */
const name = "tool-knowledge-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: this model-facing adapter owns no independent event
* stream; tool input and output schemas are enforced by the tool registry.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
