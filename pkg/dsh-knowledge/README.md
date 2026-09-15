# @deepseek-ai/dsh-knowledge

English | [中文](README.zh.md)

The document-library Service Definition (`ctx.knowledge`): project materials users upload, stored as whole documents and retrieved by passage. One abstract service, no implementation — [dsh-knowledge-store](../knowledge-store) provides it. Consumers are the model-facing [`knowledge` tool](../tool-knowledge) (`ingest`/`search`/`list`/`remove`) and pre-step [retrieval injection](../knowledge-recall) into RAG context assembly.

Long-term memory is out of scope: [`ctx.memory`](../../memory/memory) stores distilled conversation facts; this seam stores whole uploaded documents with their own titles and provenance.

## Service API

- `ingest(request): Promise<KnowledgeIngestResult>` — extract, chunk, and index one file or every supported file of one directory; re-ingesting a path already in the library replaces its content, preserving identity and creation time. Unsupported or unreadable candidates return as `skipped` with their reason, never as a thrown error.
- `search(query): Promise<readonly KnowledgeMatch[]>` — the most relevant document chunks for one query; `score` lies in `[0, 1]` and is comparable only within one backend, and `fusion` carries the rank-fusion contribution that ordered the list.
- `list(): Promise<readonly KnowledgeEntry[]>` — every document, newest first.
- `remove(id): Promise<boolean>` — delete one document with all its chunks; `false` when absent.

Entries carry library identity and provenance — title, filename, format, source path, chunk count, timestamps — but no document text: the store keeps the extracted chunks, and retrieval returns them per match.

```yaml
- id: knowledge-store
  name: '@deepseek-ai/dsh-knowledge-store'
```

Load exactly one provider per context; retrieval never depends on which consumer calls it.

## Model Experience

Indirectly, through the knowledge tool and retrieval-injection consumers, which own every model-visible rendering of stored passages.

#### KV Cache effect

None. The seam registers no service of its own and changes no request; the loaded provider and its consumers own any prefix change.

## Known Limitations and Deferred Work

- **No per-project or per-session libraries** — every consumer of one `ctx.knowledge` sees the same library; scoping a document to one project belongs to a future provider field, not this seam.
- **No document update-at-source detection** — the seam refreshes content only when a path is re-ingested; watching the source file for changes is a provider concern that has no contract here yet.
