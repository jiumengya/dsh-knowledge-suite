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
import { Service } from '@deepseek-ai/cordis';
export { KnowledgeId } from "./brand.js";
/**
 * Abstract document-library service. Implementations own durability and the
 * retrieval metric. Load one implementation per context as `ctx.knowledge`.
 */
export class Knowledge extends Service {
    constructor(ctx) {
        super(ctx, 'knowledge');
    }
}
export default Knowledge;
//# sourceMappingURL=index.js.map