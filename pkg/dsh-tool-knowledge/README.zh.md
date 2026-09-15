# @deepseek-ai/dsh-tool-knowledge

[English](README.md) | 中文

基于 [`ctx.knowledge`](../knowledge) 的模型可见 `knowledge` 工具：对资料库的显式 `ingest`、`search`、`list` 与 `remove`。每次调用只经由接缝写入，资料库因此保持上传资料的唯一持久记录，会话日志保持唯一短期记录。

工具描述引导模型在任务涉及上传资料或背景文档时使用它；`search` 结果携带文档标题与文件名，模型因此可以引用来源。

## 工具

`knowledge` 接受：

- `action` — 必填 `ingest` | `search` | `list` | `remove`。
- `path` — 要摄入的文件或目录路径（`ingest`）。
- `title` — 单个摄入文件的可选显示标题（`ingest`）。
- `text` — 搜索查询（`search`）。
- `id` — 要删除的文档 id（`remove`）。

结果按动作成形：`ingest` 返回已存条目及逐文件跳过原因，`search` 返回受 `maxResults` 封顶的 `{ documentTitle, filename, chunkIndex, text, score, fusion? }` 匹配，`list` 返回全部文档（最新在前），`remove` 返回该 id 是否存在。

## 角色

这是 knowledge 接缝的消费方包。它不持有提取、存储或检索逻辑；只把模型参数翻译为 `KnowledgeIngestRequest` / `KnowledgeQuery` 调用并渲染结果。

## 配置

| 键 | 默认值 | 含义 |
|---|---|---|
| `maxResults` | `8` | 一次 `search` 返回的最大段落数。 |

```yaml
- id: knowledge-store
  name: '@deepseek-ai/dsh-knowledge-store'
- id: tool-knowledge
  name: '@deepseek-ai/dsh-tool-knowledge'
```

## 模型体验

### 工具 schema

#### 模型看到什么

生成的 [`knowledge` schema](../../../docs/tool-catalog.md#deepseek-aidsh-tool-knowledge)，含四动作枚举与描述中的上传资料使用引导。

#### Token 影响

工具可见的每次请求承担固定 schema 开销。

#### KV Cache 影响

定义与可见性不变时前缀稳定。

### 工具调用历史与结果

#### 模型看到什么

完整参数保留在助手工具调用中。结果渲染为短文本 —— `Ingested <n> documents.`（附跳过原因）、`Found <n> matching passages.`、`<n> documents in the library.` 或 `Document removed.`；结构化匹配与条目清单存于工具结果 payload 供 UI 使用，模型经由 `search` 的渲染摘要与注入消费方读取段落文本。

#### Token 影响

数据相关的保留 token：每次调用一行短结果，外加调用参数。

#### KV Cache 影响

只追加；新可见内容位于可复用请求前缀之后，不会使既有 KV-cache 条目失效。

## 已知限制与暂缓事项

- **Search 渲染计数而非段落** —— 模型可见文本只概述结果；需要匹配段落文本的模型经由检索注入读取，或依赖 UI 渲染的 payload。
- **`list` 没有分页** —— 全部已存文档一次返回；保持有界的是资料库自身的增长，而非工具。
- **`search` 没有格式过滤** —— 检索无法收窄到某个文档或格式；范围限定属于未来参数。
