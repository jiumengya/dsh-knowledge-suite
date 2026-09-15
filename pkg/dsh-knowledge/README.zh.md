# @deepseek-ai/dsh-knowledge

[English](README.md) | 中文

资料库 Service Definition（`ctx.knowledge`）：用户上传的项目资料，按整篇文档存储、按段落检索。一个抽象服务、无实现 —— [dsh-knowledge-store](../knowledge-store) 提供实现。消费方是模型可见的 [`knowledge` 工具](../tool-knowledge)（`ingest`/`search`/`list`/`remove`）和进入 RAG 上下文组装的[检索注入](../knowledge-recall)。

长期记忆不在范围内：[`ctx.memory`](../../memory/memory) 存储提炼后的对话事实；本接缝存储整篇上传文档，各自拥有标题与来源。

## 服务 API

- `ingest(request): Promise<KnowledgeIngestResult>` — 提取、切块并索引一个文件或一个目录下所有受支持文件；重新摄入库中已有的路径会替换其内容，保留身份与创建时间。不受支持或不可读的候选项以 `skipped` 连同原因返回，绝不作为抛出的错误。
- `search(query): Promise<readonly KnowledgeMatch[]>` — 一个查询最相关的文档段落；`score` 位于 `[0, 1]`，仅在同一后端内可比；`fusion` 携带决定列表顺序的排名融合贡献。
- `list(): Promise<readonly KnowledgeEntry[]>` — 全部文档，最新在前。
- `remove(id): Promise<boolean>` — 删除一个文档及其全部段落；不存在时返回 `false`。

条目只携带库内身份与来源 —— 标题、文件名、格式、来源路径、段落数、时间戳 —— 不携带文档正文：store 持有提取出的段落，检索时按匹配返回。

```yaml
- id: knowledge-store
  name: '@deepseek-ai/dsh-knowledge-store'
```

每个 context 只加载一个 Provider；检索不依赖调用它的消费方。

## 模型体验

间接，经由 knowledge 工具与检索注入消费方，它们拥有已存段落的全部模型可见渲染。

#### KV Cache 影响

无。本接缝自身不注册服务、不改变请求；已加载的 Provider 及其消费方拥有任何前缀变化。

## 已知限制与暂缓事项

- **没有按项目或按会话的资料库** —— 同一个 `ctx.knowledge` 的所有消费方看到同一个库；把文档限定到一个项目属于未来的 Provider 字段，不在本接缝。
- **没有源文件变更检测** —— 接缝只在路径被重新摄入时刷新内容；监视源文件变化是 Provider 的职责，此处尚无对应契约。
