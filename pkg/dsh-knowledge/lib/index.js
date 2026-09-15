import { Service } from "@deepseek-ai/cordis";
//#region lib/types/brand.js
/**
* Brand an implementation-minted document identity.
* @param id - opaque document identity.
* @returns the same string, branded; no validation is performed.
*/
function KnowledgeId(id) {
	return id;
}
//#endregion
//#region lib/types/index.js
/**
* Knowledge Service Definition (`ctx.knowledge`): a document library users
* fill with project materials and the agent retrieves from. Providers own
* text extraction, chunking, storage, and retrieval — semantic vector search
* when an embedding model is available, lexical fallback otherwise. Consumers
* are the model-facing knowledge tool and pre-step retrieval injection into
* RAG context assembly.
*
* Long-term memory is out of scope here: `ctx.memory` stores distilled
* conversation facts; this seam stores whole uploaded documents.
* @module @deepseek-ai/dsh-knowledge
*/
/**
* Abstract document-library service. Implementations own durability and the
* retrieval metric. Load one implementation per context as `ctx.knowledge`.
*/
var Knowledge = class extends Service {
	constructor(ctx) {
		super(ctx, "knowledge");
	}
};
//#endregion
export { Knowledge, Knowledge as default, KnowledgeId };
