/**
 * Knowledge surface plugin, browser half — one settings section: the document
 * library as a list with an upload picker and delete confirmation. The browser
 * owns no library state; every mutation writes through the knowledge wire
 * domain and the page re-reads the library, because the model's own knowledge
 * tool can change the same library between renders.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
import { type KnowledgeKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Knowledge settings section copy. */
        'settings.knowledge': KnowledgeKey;
    }
}
export type { KnowledgeSectionInjected, KnowledgeSectionProps } from './KnowledgeSection.tsx';
export { formatWhen } from './KnowledgeSection.tsx';
export type { KnowledgeRow, KnowledgeSectionState, UploadRow } from './section-store.ts';
export { encodeUploadBase64, KnowledgeSectionController, messageOf } from './section-store.ts';
/** Locale namespace the section registers. */
export declare const NS = "settings.knowledge";
/** Required services (cordis fiber inject). */
export declare const inject: string[];
/**
 * Mount the Knowledge settings section.
 * @param ctx - the browser plugin context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map