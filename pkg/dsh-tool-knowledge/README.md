# @deepseek-ai/dsh-tool-knowledge

English | [中文](README.zh.md)

Model-facing `knowledge` tool over [`ctx.knowledge`](../knowledge): explicit `ingest`, `search`, `list`, and `remove` on the document library. Every call writes only through the seam, so the library stays the single durable record of uploaded materials while the session log stays the single short-term record.

The tool description steers the model toward it whenever a task references uploaded materials or background documents; `search` results carry the document title and filename so the model can cite its sources.

## Tool

`knowledge` accepts:

- `action` — required `ingest` | `search` | `list` | `remove`.
- `path` — file or directory path to ingest (`ingest`).
- `title` — optional display title for one ingested file (`ingest`).
- `text` — the search query (`search`).
- `id` — document id to remove (`remove`).

Results are action-shaped: `ingest` returns the stored entries plus per-file skip reasons, `search` returns `{ documentTitle, filename, chunkIndex, text, score, fusion? }` matches capped by `maxResults`, `list` returns every document newest-first, `remove` returns whether the id existed.

## Role

This is the Consumer package for the knowledge seam. It holds no extraction, storage, or retrieval logic; it translates model arguments into `KnowledgeIngestRequest` / `KnowledgeQuery` calls and renders the outcome.

## Config

| Key | Default | Meaning |
|---|---|---|
| `maxResults` | `8` | Maximum passages returned by one `search`. |

```yaml
- id: knowledge-store
  name: '@deepseek-ai/dsh-knowledge-store'
- id: tool-knowledge
  name: '@deepseek-ai/dsh-tool-knowledge'
```

## Model Experience

### Tool schema

#### What the model sees

The generated [`knowledge` schema](../../../docs/tool-catalog.md#deepseek-aidsh-tool-knowledge), including the four-action enum and the upload-materials guidance in the description.

#### Token effect

Fixed schema cost on every request where the tool is visible.

#### KV Cache effect

Prefix-stable while the definition and visibility are unchanged.

### Tool-call history and result

#### What the model sees

The full arguments stay in the assistant tool-call. The result renders as short text — `Ingested <n> documents.` with skip reasons, `Found <n> matching passages.`, `<n> documents in the library.`, or `Document removed.`; the structured matches and entry lists live in the tool result payload for the UI, while the model reads passage text through `search`'s rendered summary plus the injection consumer.

#### Token effect

Data-dependent retained tokens: one short result line per call, plus the call arguments.

#### KV Cache effect

Append-only; newly visible content follows the reusable request prefix and does not invalidate existing KV-cache entries.

## Known Limitations and Deferred Work

- **Search renders a count, not the passages** — the model-facing text summarizes the outcome; a model that needs the matched passage texts reads them through the retrieval injection or relies on the payload the UI renders.
- **No paging on `list`** — every stored document returns at once; the library's own growth, not the tool, must stay bounded.
- **No format filter on `search`** — retrieval cannot be narrowed to one document or format; scoping belongs to a future parameter.
