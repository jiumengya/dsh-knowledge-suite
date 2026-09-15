//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `@deepseek-ai/dsh-knowledge`.
* @module @deepseek-ai/dsh-knowledge/invariant
*/
const PACKAGE_NAME = "@deepseek-ai/dsh-knowledge";
/** Cordis companion plugin name. */
const name = "knowledge-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: this Service Definition owns no event stream or mutable data;
* the local provider's entry-shape rules are covered by its own tests.
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
