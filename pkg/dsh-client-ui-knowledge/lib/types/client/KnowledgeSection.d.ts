/**
 * Knowledge settings section: the document library as a table, an upload
 * picker that reports each file's outcome, and a delete confirmation.
 *
 * The browser edits no document text — the page's whole job is moving files
 * in and out of the host library, because retrieval happens model-side (the
 * pre-step recall and the knowledge tool) and never renders here. An empty
 * library is the section's first-run state, not a failure: the intro and the
 * upload button are what it shows.
 */
import type { ReactNode } from 'react';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { KnowledgeSectionState } from './section-store.ts';
/** Registration-side business face for the document-library section. */
export interface KnowledgeSectionInjected {
    hooks: {
        /** Page snapshot bound by the renderer as useKnowledgeSection. */
        knowledgeSection: SnapshotStore<KnowledgeSectionState>;
    };
    /** Read the library; called once when the section first renders. */
    load: () => Promise<void>;
    /** Upload the picked files, reporting each outcome. */
    upload: (files: readonly File[]) => Promise<void>;
    /** Clear the settled upload report. */
    dismissUploads: () => void;
    /** Ask for delete confirmation, or dismiss it with null. */
    confirmDelete: (id: string | null) => void;
    /** Delete the entry awaiting confirmation. */
    remove: () => Promise<void>;
}
/** Full component props. */
export type KnowledgeSectionProps = PropsRuntime<'settings.section'> & PropsLocale<'settings.knowledge'> & InjectFace<KnowledgeSectionInjected>;
/**
 * Render one epoch-milliseconds stamp in the reading locale's calendar.
 * @param epochMs - the host-reported `updatedAt` (or `createdAt`).
 * @returns the localized date-time text.
 */
export declare function formatWhen(epochMs: number): string;
/**
 * Render the Knowledge section content column.
 * @param props - composed slot props.
 * @returns the section.
 */
export declare function KnowledgeSection(props: KnowledgeSectionProps): ReactNode;
//# sourceMappingURL=KnowledgeSection.d.ts.map