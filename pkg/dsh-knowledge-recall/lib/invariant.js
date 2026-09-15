//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `@deepseek-ai/dsh-knowledge-recall`.
* @module @deepseek-ai/dsh-knowledge-recall/invariant
*/
const PACKAGE_NAME = "@deepseek-ai/dsh-knowledge-recall";
/** Cordis companion plugin name. */
const name = "knowledge-recall-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: every injected passage reaches the model through a
* logged snapshot user message, so the session log already carries the full
* model-visible record of this Consumer's output.
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
