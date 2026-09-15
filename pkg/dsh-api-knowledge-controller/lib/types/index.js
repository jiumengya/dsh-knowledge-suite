/**
 * Host Remote owner for the document-library wire domain. Three unary methods
 * — `list`, `ingest`, `remove` — over `ctx.knowledge`. Retrieval stays
 * model-side (the knowledge tool and pre-step recall Consumers) and never
 * crosses this wire. Uploads carry file bytes as canonical base64 in the JSON
 * envelope, exactly as image prompt parts do; the provider decodes and
 * persists the bytes before ingesting them.
 *
 * @module @deepseek-ai/dsh-api-knowledge-controller
 */
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { KnowledgeId } from '@deepseek-ai/dsh-knowledge';
/** Map one library entry to its wire view (the branded id widens to a plain string). */
function entryView(entry) {
    return {
        id: entry.id,
        title: entry.title,
        filename: entry.filename,
        format: entry.format,
        path: entry.path,
        chunkCount: entry.chunkCount,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
    };
}
/** Decode one wire upload while rejecting non-canonical base64 forms. */
function decodeUpload(data) {
    const decoded = Buffer.from(data, 'base64');
    if (data.length === 0 || decoded.toString('base64') !== data) {
        throw new Error('knowledge upload is not canonical base64');
    }
    return new Uint8Array(decoded);
}
/**
 * Host service backing the generated `ctx.remote.knowledge` namespace. The
 * `ctx.knowledge` read stays optional so a composition without the
 * document-library provider still serves every other domain; each call reports
 * the missing-provider diagnostic.
 */
let KnowledgeController = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _list_decorators;
    let _ingest_decorators;
    let _removeDocument_decorators;
    return class KnowledgeController extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _list_decorators = [Remote];
            _ingest_decorators = [Remote];
            _removeDocument_decorators = [Remote];
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _ingest_decorators, { kind: "method", name: "ingest", static: false, private: false, access: { has: obj => "ingest" in obj, get: obj => obj.ingest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _removeDocument_decorators, { kind: "method", name: "removeDocument", static: false, private: false, access: { has: obj => "removeDocument" in obj, get: obj => obj.removeDocument }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        constructor(ctx) {
            super(ctx, 'knowledgeController', { namespace: 'knowledge' });
            __runInitializers(this, _instanceExtraInitializers);
        }
        /** Resolve the optional provider or report how to supply it. */
        provider() {
            const knowledge = this.ctx.get('knowledge');
            if (knowledge === undefined) {
                throw new RemoteError('gateway/internal', 'knowledge service is absent: this deployment does not mount a knowledge provider (e.g. @deepseek-ai/dsh-knowledge-store) in its composition', {});
            }
            return knowledge;
        }
        /**
         * List every library document, newest first.
         * @returns every stored entry as its wire view.
         */
        async list() {
            const entries = await this.provider().list();
            return entries.map(entryView);
        }
        /**
         * Upload one document into the library. The host decodes `data` (canonical
         * base64), and the store persists the bytes inside the library it owns and
         * ingests that file — uploading the same filename again replaces the entry.
         * @param filename - client-reported filename including extension.
         * @param data - the file bytes as canonical base64.
         * @param title - optional display title overriding the file basename.
         * @returns the ingested entries and skipped candidates.
         */
        async ingest(filename, data, title) {
            try {
                const bytes = decodeUpload(data);
                const result = await this.provider().ingestUploaded({
                    filename,
                    bytes,
                    ...(title === undefined ? {} : { title }),
                });
                return { ingested: result.ingested.map(entryView), skipped: [...result.skipped] };
            }
            catch (error) {
                throw new RemoteError('knowledge/rejected', messageOf(error), { target: filename }, { cause: error });
            }
        }
        /**
         * Remove one document and its chunks permanently. Idempotent: removing an
         * absent id succeeds with `removed: false`.
         * @param id - library identity returned by `list` or `ingest`.
         * @returns whether a document was removed.
         */
        async removeDocument(id) {
            try {
                return { removed: await this.provider().remove(KnowledgeId(id)) };
            }
            catch (error) {
                throw new RemoteError('knowledge/rejected', messageOf(error), { target: id }, { cause: error });
            }
        }
    };
})();
export { KnowledgeController };
function messageOf(error) {
    return error instanceof Error ? error.message : String(error);
}
export default KnowledgeController;
//# sourceMappingURL=index.js.map