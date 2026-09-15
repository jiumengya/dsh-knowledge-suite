# @deepseek-ai/dsh-client-ui-knowledge

English | [中文](README.zh.md)

Knowledge settings section: the document library as one table over the knowledge wire domain — upload, remove. The plugin waits for the settings package's `settings.section` slot through `ctx.slots.inject` and registers the section (order 25) with its controller, component, copy dictionaries, and a reconnect repull. Retrieval itself is model-side — the pre-step recall injection and the `knowledge` tool — and never renders here: the page's whole job is moving files in and out of the host library.

## Section controller

`KnowledgeSectionController` holds no library state of its own: every mutation writes through `knowledge.list`/`ingest`/`remove` and the page re-reads afterwards, because the model's own knowledge tool can change the same library between renders and nothing on the wire announces it. An empty library is a valid first-run state, not a failure. Uploads run one file per request and report each outcome on its own row — `reading` gathers the bytes, `sending` carries them, and the settled statuses name what the host did: added, skipped with a reason, or refused — because the store ingests sequentially anyway and a per-file report is what the page shows. A batch that lands at least one entry re-reads the library; one that lands nothing owes no refresh. Upload bytes are encoded as canonical base64 in bounded chunks (`btoa` over one spread of a multi-megabyte file overflows the argument limit).

## Rendering

The library renders as a table — document title with filename, format badge, chunk count, localized updated time — with a per-row delete that asks first through the shared modal. The picker stays in the accessibility tree (focusable, labeled) rather than `hidden`, and re-arms after every pick so re-selecting the same file uploads it again. The upload report announces a settled refusal (`role="alert"`), keeps its place on a load-failure page, and offers dismiss only once the batch settled. A whole-load failure replaces the page with the error and a retry; a single mutation failure renders beside the working list.

## Model Experience

None, as the plugin only manages library membership and contributes no model-visible input; retrieval runs model-side over the same library.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **No concurrent batches** — a second upload while one is in flight is ignored, because both would claim the same report slot.
- **The table does not live-refresh** — entries the model's `knowledge` tool adds or removes appear only after the section's own next re-read.
- **No upload cancellation or progress** — each file reports its stage, not a byte count.

**Runtime invariant:** No companion is published. This is a browser-side settings surface whose node half owns no event stream or mutable runtime data; the library and its retrieval pipeline are Host contracts covered by the owning plugins and the knowledge wire.
