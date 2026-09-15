# @deepseek-ai/dsh-knowledge-store

English | [中文](README.zh.md)

The local provider of the [`ctx.knowledge`](../knowledge) seam: one document library per process, extracted from user-uploaded materials and retrieved by passage. Ingestion detects the format from the extension (`.txt`/`.text`, `.md`/`.markdown`, `.html`/`.htm`/`.xhtml`, `.pdf`, `.docx`), extracts the text — plain text, Markdown, and HTML in-process; PDF and Word through dynamically imported parsers, so startup never pays for a format until a document of it arrives — and splits it into paragraph-aware chunks of at most `chunkSize` characters, splitting long paragraphs by sentence, then by word, then by hard character cut.

Retrieval is hybrid — a lexical BM25 pass over Chinese-aware single-character and word tokens, fused with a cosine-similarity pass through an in-process HNSW index whenever [`ctx.memoryEmbedding`](../../memory/memory-embedding) is active. Rank fusion (reciprocal rank fusion) orders the merged candidates and surfaces as `fusion` on each match, while the returned `score` stays the retrieval metric, so `minScore` filtering keeps its meaning.

Storage is one JSON file (`knowledge.json` under `root`, atomically republished on every mutation, format version 1). A missing file is an empty library; a corrupt or wrong-shape file fails loud at load.

## Lifecycle

`ingest` re-ingests by path: a path already in the library keeps its id and `createdAt`, replaces its chunks and embedding, and gets a fresh `updatedAt`. Directory scans are non-recursive and per-file fault-isolated — an unreadable or corrupt file returns as a skip reason, while a configured embedding endpoint rejecting its batch still throws, because that fault is systemic. `remove` deletes the document and its vector-index nodes.

## Config

| Key | Default | Meaning |
|---|---|---|
| `root` | — | Directory holding `knowledge.json` (required). |
| `minScore` | `0.35` | Minimum cosine-derived score for a semantic chunk match to survive filtering. |
| `chunkSize` | `1200` | Maximum characters per retrieval chunk. |

```yaml
- id: knowledge-store
  name: '@deepseek-ai/dsh-knowledge-store'
- id: memory-embedding
  name: '@deepseek-ai/dsh-memory-embedding'
```

The embedding seam is optional: absent or dormant, the store runs lexical retrieval only and the library keeps working with zero external services.

## Model Experience

Indirectly, through the knowledge tool and retrieval-injection consumers, which own every model-visible rendering of retrieved passages.

#### KV Cache effect

None. The provider registers `ctx.knowledge` only and contributes no request content; consumer-owned injections and tool results own any prefix change.

## Known Limitations and Deferred Work

- **One JSON file for the whole library** — every mutation rewrites all documents and chunk embeddings; multi-file or SQLite storage belongs to a future backend, symmetric with the memory store's backends.
- **The HNSW graph is rebuilt on load** — semantic retrieval after a restart replays every stored chunk embedding through the index constructor; a persisted graph belongs to a future on-disk format.
- **Chunks are stored, never re-derived** — changing `chunkSize` affects only future ingests; existing documents keep their stored chunks until their path is re-ingested.
- **Scanned-image PDFs extract nothing** — text extraction reads the text layer only; OCR is out of scope, and such a file skips with an extraction reason.
