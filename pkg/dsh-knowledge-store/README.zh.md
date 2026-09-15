# @deepseek-ai/dsh-knowledge-store

[English](README.md) | 中文

[`ctx.knowledge`](../knowledge) 的本地 Provider：每进程一个文档库，从用户上传的资料提取并按段落检索。摄入时按扩展名识别格式（`.txt`/`.text`、`.md`/`.markdown`、`.html`/`.htm`/`.xhtml`、`.pdf`、`.docx`）并提取文本 —— 纯文本、Markdown、HTML 在进程内处理；PDF 与 Word 通过动态导入的解析器处理，启动时不为任何格式付费，直到该格式的文档到来 —— 再切成每块至多 `chunkSize` 字符的段落感知切块，超长段落依次按句子、按词、按硬字符切分。

检索是混合式的 —— 面向中文单字与词元组的 BM25 词法通道，在 [`ctx.memoryEmbedding`](../../memory/memory-embedding) 激活时与经进程内 HNSW 索引的余弦相似度通道融合。排名融合（reciprocal rank fusion）为合并后的候选排序，并作为每个匹配的 `fusion` 浮出；返回的 `score` 保持为检索度量，`minScore` 过滤因此保留其含义。

存储是一个 JSON 文件（`root` 下的 `knowledge.json`，每次变更原子重发，文件格式版本 1）。文件缺失即空库；损坏或结构不符的文件在加载时高声失败。

## 生命周期

`ingest` 按路径重新摄入：库中已有的路径保留其 id 与 `createdAt`，替换段落与嵌入，并刷新 `updatedAt`。目录扫描非递归且逐文件隔离故障 —— 不可读或损坏的文件作为跳过原因返回；已配置的嵌入端点拒绝其批次仍会抛出，因为那是系统性故障。`remove` 删除文档及其向量索引节点。

## 配置

| 键 | 默认值 | 含义 |
|---|---|---|
| `root` | — | 存放 `knowledge.json` 的目录（必填）。 |
| `minScore` | `0.35` | 语义段落匹配存活过滤所需的最小余弦分数。 |
| `chunkSize` | `1200` | 每个检索段落的最大字符数。 |

```yaml
- id: knowledge-store
  name: '@deepseek-ai/dsh-knowledge-store'
- id: memory-embedding
  name: '@deepseek-ai/dsh-memory-embedding'
```

嵌入接缝是可选的：缺失或休眠时，store 仅运行词法检索，资料库在零外部服务下继续可用。

## 模型体验

间接，经由 knowledge 工具与检索注入消费方，它们拥有已检索段落的全部模型可见渲染。

#### KV Cache 影响

无。Provider 只注册 `ctx.knowledge`，不贡献任何请求内容；消费方拥有的注入与工具结果拥有任何前缀变化。

## 已知限制与暂缓事项

- **整库一个 JSON 文件** —— 每次变更重写全部文档与段落嵌入；多文件或 SQLite 存储属于未来后端，与 memory store 的后端对称。
- **HNSW 图在加载时重建** —— 重启后的语义检索把已存的全部段落嵌入重放进索引构造器；持久化图属于未来的磁盘格式。
- **段落一经存储不再重算** —— 修改 `chunkSize` 只影响未来的摄入；已有文档保留其已存段落，直到其路径被重新摄入。
- **扫描图像 PDF 提取不到内容** —— 文本提取只读文本层；OCR 超出范围，此类文件以提取原因跳过。
