# dsh-knowledge-suite — 资料库知识能力插件（DeepSeek Harness 桌面版）

把 DeepSeek Harness 的**资料库（knowledge）**能力从应用内置改为**可单独装卸的桌面插件**。装上之后，
设置面板里出现「资料库」区块（上传 / 列表 / 删除文档），模型侧拿到 `knowledge` 工具，每轮对话开始前
自动做一次文档召回注入；卸载之后功能退回应用内置默认状态，运行时文件与配置一字不差地还原。

六个包、**不自行安装 npm 依赖**、零业务行为变化——只是把上游**硬编码在 `dsh-base` / `dsh-web-app` 里的那 5 行**搬到
插件侧重新注册（配置值原样保留，含你之前手加的 64MiB 单文件上传上限）。

## 为什么需要「摘除」这一步

上游把知识能力写死在两个内置包的 `cordis.patch.yml` 里，随安装包分发：

| 内置包 | 行 id | 指向的包 |
|---|---|---|
| `@deepseek-ai/dsh-base` | `knowledge-store` | `dsh-knowledge-store` |
| `@deepseek-ai/dsh-base` | `tool-knowledge` | `dsh-tool-knowledge` |
| `@deepseek-ai/dsh-base` | `knowledge-recall` | `dsh-knowledge-recall` |
| `@deepseek-ai/dsh-web-app` | `knowledge-controller` | `dsh-api-knowledge-controller` |
| `@deepseek-ai/dsh-web-app` | `ui-knowledge` | `dsh-client-ui-knowledge` |

只要这 5 行还在上游，插件再插一份就会撞车。三种插法的实测结果（2026-09-15 冷启复现）：

| 做法 | 结果 |
|---|---|
| 同 id 再插一行 | `duplicate loader entry id: knowledge-store` → 进程起不来 |
| 不摘除、用一个**新 id** 插 | `service "knowledge" has been registered` / `tool "knowledge" is already registered` → 进程起不来 |
| **禁用上游 5 行 + 用新 id 插** | ✅ 冷启通过（本插件采用的方案） |

所以 `install.ps1` 干的事是：**备份 → 复制插件包 → 从上游摘除那 5 行 → 由插件重新注册**。
摘除是硬性前提，不是可选优化。

> 摘除逻辑 fail-loud：如果上游只摘到 `2/3` 行（结构变了），脚本会**中止并且不改动该文件**，
> 而不是留下一个半残的运行时。

## 安装 / 卸载

安装（右键 `install.ps1` → **使用 PowerShell 运行**，或）：

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

五步：

1. 备份到 `%LOCALAPPDATA%\DshNative\backup-dsh-knowledge-suite-<时间戳>`（desktop.yml + 两个上游
   `cordis.patch.yml` + 六个运行时包，写 `manifest.json` 记录 md5）
2. 复制六个插件包到 `%LOCALAPPDATA%\DshNative\runtime\node_modules\@deepseek-ai\`
3. 从 `dsh-base` 摘除 3 行、从 `dsh-web-app` 摘除 2 行
4. 改写桌面 overlay `%LOCALAPPDATA%\DshNative\desktop.yml`：清掉旧的插件标记块（幂等）、
   接管那条已失去目标的 64MiB `knowledge-store` 补丁行、追加插件注册块
5. 汇总打印包名 / 备份路径 / 回滚方式

**重启 DeepSeek Harness 后生效。**

卸载（回滚）：

```powershell
powershell -ExecutionPolicy Bypass -File uninstall.ps1
# 指定某次备份：
powershell -ExecutionPolicy Bypass -File uninstall.ps1 -Backup <备份目录>
```

从最近一次备份还原两个上游 `cordis.patch.yml` 与六个运行时包，摘除桌面 overlay 的插件块，
把 64MiB 补丁行原样放回。**结果 = 本插件没装过。**

### 幂等与覆盖安装

- `install.ps1` 可反复运行：会先备份当前状态，再去重写入。
- **应用覆盖安装后若上游那 5 行回来了**（安装包会把 `dsh-base` / `dsh-web-app` 覆盖回原样），
  知识区块会消失或报重复注册——**再跑一次 `install.ps1` 即可修复**，不必先卸载。

## 六个包的分工

| 包 | 角色 |
|---|---|
| `@deepseek-ai/dsh-knowledge` | **抽象服务缝**：定义 `ctx.knowledge` 接口（文档库的契约层） |
| `@deepseek-ai/dsh-knowledge-store` | **本地服务实现**：持久化 JSON 文档库，PDF / Word / HTML 抽取，向量或词法检索 |
| `@deepseek-ai/dsh-tool-knowledge` | **模型侧工具**：把 `knowledge` 工具暴露给模型（搜索文档库） |
| `@deepseek-ai/dsh-knowledge-recall` | **首步召回**：每轮对话开始前自动检索并注入相关片段（`firstStepOnly`） |
| `@deepseek-ai/dsh-api-knowledge-controller` | **远程宿主**：文档库 wire domain 的服务端（上传 / 列表 / 删除） |
| `@deepseek-ai/dsh-client-ui-knowledge` | **前端区块**：设置面板「资料库」UI（声明 `dsh.client`，走 `client.js` bundle 路由） |

> `dsh-retrieval`（检索原语）与 `dsh-atomic-write`（原子写）是**共享原语**，仍留在上游——
> 它们被 memory 等其它能力共用，不属于本插件。插件只接管上面这六个。

## 零行为变化

`pkg/` 里的六个包是从**运行时已部署的包**字节级复制的（79 个文件 md5 全一致），不是从仓库源码重新构建。
这样保证：

- 插件启用后与「上游内置」在语义上**完全等价**，不改一行业务代码；
- 唯一的差异是注册位置（内置 → 插件），以及 `ui-knowledge/client.js` 与仓库 `lib/` 版本的
  模块 import 顺序不同（语义等价，改用运行时字节正是为了避开这个差异）。

## 配置（desktop.yml）

插件注册块（`install.ps1` 写入 `%LOCALAPPDATA%\DshNative\desktop.yml`）：

```yaml
- insert:
    - id: knowledge-store
      name: '@deepseek-ai/dsh-knowledge-store'
      config:
        root: !!js dshHomePath('knowledge')
        minScore: 0.35
        chunkSize: 1200
        maxUploadBytes: 67108864     # 单文件上传上限 64MiB（默认 32MiB）
    - id: tool-knowledge
      name: '@deepseek-ai/dsh-tool-knowledge'
      config:
        maxResults: 8                # 单次搜索返回条数
    - id: knowledge-recall
      name: '@deepseek-ai/dsh-knowledge-recall'
      config:
        topK: 5                      # 首步召回条数
        minScore: 0.35
        firstStepOnly: true
    - id: knowledge-controller
      name: '@deepseek-ai/dsh-api-knowledge-controller'
    - id: ui-knowledge
      name: '@deepseek-ai/dsh-client-ui-knowledge'
```

`root: !!js dshHomePath('knowledge')` → 文档库落在 `~\.dsh\knowledge`。

## 验证

`test\` 下四个脚本，全部可直接运行、**不需要 API key**：

```powershell
powershell -ExecutionPolicy Bypass -File test\verify-all.ps1
```

| 脚本 | 覆盖 | 断言数 |
|---|---|---|
| `dry-run-strip.ps1` | **摘除算法离线单测**：以 `test\fixtures\` 里的上游原文快照为输入，跑与 install 相同的 `Remove-PatchRows`；断言目标 5 行消失、邻居行（memory-* / ui-*）全留、重复执行是空操作、摘除处没吞掉邻居行的 config | 24 |
| `verify-install.ps1` | **静态 + 配置层**：六个包装进运行时且与 `pkg/` 字节一致、上游 5 行确实摘除、桌面 overlay 有标记块且无孤立 `knowledge-store` 行、`dsh --dump-config` 里每个知识 id 恰好 1 次且无 patch 警告 | 28 |
| `verify-runtime.ps1` | **冷启冒烟 + 客户端取件**：45s 内出现 `dsh web: http://127.0.0.1:<port>` 就绪行、stderr 为空、进程存活、模块清单列出 `dsh-client-ui-knowledge/client.js`、该 bundle 取到 HTTP 200 且含知识区块实现 | 6 |

`verify-all.ps1` 依次跑三个脚本各自子进程并汇总（共 58 项断言，另有 3 个脚本结果汇总项）。安装脚本会在复制或改写前检查宿主 runtime 的 22 项运行时依赖；缺依赖时直接拒绝安装，避免留下半安装状态。

**为什么用夹具而不是运行时活文件**：装完之后运行时的那 5 行已经被摘掉了，拿活文件当输入只会测出
「已经摘过了」，测不到算法本身。夹具是安装前从备份复制的上游 rc.2 原文快照。

## 目录结构

```
dsh-knowledge-suite\
├─ install.ps1                     # 安装（备份 → 复制 → 摘除 → 注册），幂等
├─ uninstall.ps1                   # 卸载（从备份还原上游 + 摘除插件块）
├─ README.md                       # 本文
├─ pkg\                            # 六个插件包（运行时字节级复制，79 文件 / 225 KB）
│  ├─ dsh-knowledge\               (15 文件)
│  ├─ dsh-knowledge-store\         (19)
│  ├─ dsh-tool-knowledge\          (11)
│  ├─ dsh-knowledge-recall\        (11)
│  ├─ dsh-api-knowledge-controller\(11)
│  └─ dsh-client-ui-knowledge\     (12)
├─ tools\
│  ├─ patch-rows.ps1               # 摘除/计数助手（按 id 摘整行含 config 子树与上方注释块）
│  └─ copy-tree.mjs                # 递归复制（绕开本机失效的 fs.cpSync）
└─ test\
   ├─ dry-run-strip.ps1            # 摘除算法离线单测
   ├─ verify-install.ps1           # 静态 + 配置层验证
   ├─ verify-runtime.ps1           # 冷启 + 客户端取件验证
   ├─ verify-all.ps1               # 汇总跑三个
   └─ fixtures\                    # 上游 rc.2 cordis.patch.yml 原文快照
```

## 注意事项

- **仅 Windows + DshNative 桌面版**（`%LOCALAPPDATA%\DshNative`）。安装前需先启动过一次应用，
  让运行时与 `desktop.yml` 生成出来。
- **`.ps1` 必须带 UTF-8 BOM**：Windows PowerShell 5.1 会把无 BOM 的脚本按 GBK 解析，中文注释变
  乱码直接语法错误。本插件所有脚本已带 BOM，改脚本时请保留。
- **不要手工删改 `desktop.yml` 里的 `>>> dsh-knowledge-suite BEGIN/END` 块**——卸载依赖它定位。
- 卸载是**从备份还原**而非反向推导：如果备份目录被删掉，卸载会中止（fail-loud）而不是猜。
- 备份目录 `backup-dsh-knowledge-suite-*` 确认无误后可自行删除；卸载后建议保留一份以防万一。

## 相关

- 技术文档（能力分布图 / 三条语义陷阱详解 / 摘除前后对比）：
  `D:\项目\deepseek-harness\.workbuddy\knowledge-plugin-doc\knowledge-plugin-doc.html`
- 插件库总索引：`D:\项目\DeepSeek Harness plugings\README.md`
