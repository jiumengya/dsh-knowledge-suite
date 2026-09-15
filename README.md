# dsh-knowledge-suite — knowledge capability plugins for DeepSeek Harness desktop

English | [中文](README.zh.md)

Turn DeepSeek Harness's **knowledge (document library)** capability from an application built-in into a **desktop plugin that can be installed and removed on its own**. Once installed, a "Knowledge" section appears in the settings panel (upload / list / delete documents), the model gets a `knowledge` tool, and every conversation performs one document-recall injection before its first step; once removed, the capability returns to the application's built-in default state, with runtime files and configuration restored character for character.

Six packages, **no npm dependencies installed of their own**, zero change in business behavior — this only moves the **5 lines hardcoded in `dsh-base` / `dsh-web-app`** over to the plugin side and re-registers them (configuration values kept as they are, including the 64 MiB per-file upload limit you added by hand).

## Why the "strip" step is required

Upstream hardcodes the knowledge capability into the `cordis.patch.yml` of two built-in packages, shipped with the installer:

| Built-in package | Row id | Target package |
|---|---|---|
| `@deepseek-ai/dsh-base` | `knowledge-store` | `dsh-knowledge-store` |
| `@deepseek-ai/dsh-base` | `tool-knowledge` | `dsh-tool-knowledge` |
| `@deepseek-ai/dsh-base` | `knowledge-recall` | `dsh-knowledge-recall` |
| `@deepseek-ai/dsh-web-app` | `knowledge-controller` | `dsh-api-knowledge-controller` |
| `@deepseek-ai/dsh-web-app` | `ui-knowledge` | `dsh-client-ui-knowledge` |

As long as those 5 rows stay upstream, inserting the plugin again collides. Measured outcome of three insertion approaches (cold-start reproduction, 2026-09-15):

| Approach | Result |
|---|---|
| Insert another row with the same id | `duplicate loader entry id: knowledge-store` → the process never starts |
| Do not strip, insert under a **new id** | `service "knowledge" has been registered` / `tool "knowledge" is already registered` → the process never starts |
| **Disable the 5 upstream rows and insert under new ids** | ✅ cold start passes (the approach this plugin takes) |

So what `install.ps1` does is: **back up → copy the plugin packages → strip those 5 rows from upstream → let the plugin re-register them**. Stripping is a hard prerequisite, not an optional optimization.

> The stripping logic fails loud: if upstream yields only `2/3` rows (its structure changed), the script **aborts without modifying that file**, rather than leaving a half-broken runtime.

## Install / uninstall

Install (right-click `install.ps1` → **Run with PowerShell**, or):

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

Five steps:

1. Back up to `%LOCALAPPDATA%\DshNative\backup-dsh-knowledge-suite-<timestamp>` (desktop.yml + the two upstream `cordis.patch.yml` + the six runtime packages, writing `manifest.json` with md5 records)
2. Copy the six plugin packages to `%LOCALAPPDATA%\DshNative\runtime\node_modules\@deepseek-ai\`
3. Strip 3 rows from `dsh-base` and 2 rows from `dsh-web-app`
4. Rewrite the desktop overlay `%LOCALAPPDATA%\DshNative\desktop.yml`: clear the old plugin marker block (idempotent), take over that `knowledge-store` 64 MiB patch row which has lost its target, and append the plugin registration block
5. Print a summary of package names / backup path / rollback procedure

**Takes effect after restarting DeepSeek Harness.**

Uninstall (rollback):

```powershell
powershell -ExecutionPolicy Bypass -File uninstall.ps1
# a specific backup:
powershell -ExecutionPolicy Bypass -File uninstall.ps1 -Backup <backup dir>
```

Restores the two upstream `cordis.patch.yml` and the six runtime packages from the most recent backup, strips the plugin block from the desktop overlay, and puts the 64 MiB patch row back exactly as it was. **The result = this plugin was never installed.**

### Idempotence and over-install

- `install.ps1` can be run repeatedly: it backs up the current state first, then writes deduplicated.
- **If those 5 upstream rows come back after an application over-install** (the installer overwrites `dsh-base` / `dsh-web-app` back to stock), the knowledge section disappears or reports a duplicate registration — **running `install.ps1` once more repairs it**; uninstalling first is not required.

## What the six packages do

| Package | Role |
|---|---|
| `@deepseek-ai/dsh-knowledge` | **Abstract service seam**: defines the `ctx.knowledge` interface (the contract layer of the document library) |
| `@deepseek-ai/dsh-knowledge-store` | **Local provider**: JSON-persisted document library, PDF / Word / HTML extraction, vector or lexical retrieval |
| `@deepseek-ai/dsh-tool-knowledge` | **Model-facing tool**: exposes the `knowledge` tool to the model (searching the document library) |
| `@deepseek-ai/dsh-knowledge-recall` | **First-step recall**: retrieves and injects relevant passages automatically before each conversation starts (`firstStepOnly`) |
| `@deepseek-ai/dsh-api-knowledge-controller` | **Remote host**: server side of the document-library wire domain (upload / list / delete) |
| `@deepseek-ai/dsh-client-ui-knowledge` | **Front-end section**: the "Knowledge" UI in the settings panel (declares `dsh.client`, routed through the `client.js` bundle) |

> `dsh-retrieval` (retrieval primitives) and `dsh-atomic-write` (atomic writes) are **shared primitives** and stay upstream — other capabilities such as memory share them, so they are not part of this plugin. The plugin takes over only the six above.

## Zero behavior change

The six packages under `pkg/` are byte-level copies of the **packages already deployed in the runtime** (all 79 file md5s identical), not rebuilds from repository sources. This guarantees:

- with the plugin enabled, semantics are **exactly equivalent** to the upstream built-in, with no business code changed;
- the only differences are the registration site (built-in → plugin), and that `ui-knowledge/client.js` differs from the repository `lib/` build in module import order (semantically equivalent; using the runtime bytes is precisely what avoids this difference).

## Configuration (desktop.yml)

The plugin registration block (`install.ps1` writes it into `%LOCALAPPDATA%\DshNative\desktop.yml`):

```yaml
- insert:
    - id: knowledge-store
      name: '@deepseek-ai/dsh-knowledge-store'
      config:
        root: !!js dshHomePath('knowledge')
        minScore: 0.35
        chunkSize: 1200
        maxUploadBytes: 67108864     # per-file upload limit 64MiB (default 32MiB)
    - id: tool-knowledge
      name: '@deepseek-ai/dsh-tool-knowledge'
      config:
        maxResults: 8                # results returned per search
    - id: knowledge-recall
      name: '@deepseek-ai/dsh-knowledge-recall'
      config:
        topK: 5                      # first-step recall count
        minScore: 0.35
        firstStepOnly: true
    - id: knowledge-controller
      name: '@deepseek-ai/dsh-api-knowledge-controller'
    - id: ui-knowledge
      name: '@deepseek-ai/dsh-client-ui-knowledge'
```

`root: !!js dshHomePath('knowledge')` → the document library lands in `~\.dsh\knowledge`.

## Verification

Four scripts under `test\`, all runnable directly and **requiring no API key**:

```powershell
powershell -ExecutionPolicy Bypass -File test\verify-all.ps1
```

| Script | Coverage | Assertions |
|---|---|---|
| `dry-run-strip.ps1` | **Offline unit test of the strip algorithm**: feeds the upstream source snapshots in `test\fixtures\` through the same `Remove-PatchRows` the install uses; asserts the target 5 rows are gone, neighbouring rows (memory-* / ui-*) all remain, a repeated run is a no-op, and the strip site swallowed no neighbouring row's config | 24 |
| `verify-install.ps1` | **Static + configuration layer**: the six packages are present in the runtime and byte-identical to `pkg/`, the 5 upstream rows are indeed gone, the desktop overlay has the marker block and no orphan `knowledge-store` row, and `dsh --dump-config` lists every knowledge id exactly once with no patch warning | 28 |
| `verify-runtime.ps1` | **Cold-start smoke + client asset fetch**: the `dsh web: http://127.0.0.1:<port>` ready line appears within 45s, stderr is empty, the process stays alive, the module manifest lists `dsh-client-ui-knowledge/client.js`, and that bundle fetches with HTTP 200 containing the knowledge-section implementation | 6 |

`verify-all.ps1` runs the three scripts as separate subprocesses in turn and summarizes them (58 assertions in total, plus 3 script-result summary items). Before copying or rewriting anything, the installer checks 22 runtime dependencies of the host runtime; it refuses to install when one is missing, avoiding a half-installed state.

**Why fixtures instead of live runtime files**: after installation those 5 rows have already been stripped from the runtime, so using live files as input would only test "already stripped" and never the algorithm itself. The fixtures are upstream rc.2 source snapshots copied from the backup before installation.

## Directory layout

```
dsh-knowledge-suite\
├─ install.ps1                     # install (back up → copy → strip → register), idempotent
├─ uninstall.ps1                   # uninstall (restore upstream from the backup + strip the plugin block)
├─ README.md                       # this file (English)
├─ README.zh.md                    # Chinese translation
├─ README.i18n.yaml                # bilingual-pair hash record
├─ pkg\                            # the six plugin packages (byte-level runtime copies, 79 files / 225 KB)
│  ├─ dsh-knowledge\               (15 files)
│  ├─ dsh-knowledge-store\         (19)
│  ├─ dsh-tool-knowledge\          (11)
│  ├─ dsh-knowledge-recall\        (11)
│  ├─ dsh-api-knowledge-controller\(11)
│  └─ dsh-client-ui-knowledge\     (12)
├─ tools\
│  ├─ patch-rows.ps1               # strip/count helper (strips a whole row by id, including its config subtree and the comment block above it)
│  └─ copy-tree.mjs                # recursive copy (bypasses the broken fs.cpSync on this machine)
└─ test\
   ├─ dry-run-strip.ps1            # offline unit test of the strip algorithm
   ├─ verify-install.ps1           # static + configuration verification
   ├─ verify-runtime.ps1           # cold-start + client asset fetch verification
   ├─ verify-all.ps1               # runs all three and summarizes
   └─ fixtures\                    # upstream rc.2 cordis.patch.yml source snapshots
```

## Caveats

- **Windows + DshNative desktop only** (`%LOCALAPPDATA%\DshNative`). The application must have been started once before installation, so that the runtime and `desktop.yml` exist.
- **`.ps1` files must carry a UTF-8 BOM**: Windows PowerShell 5.1 parses a BOM-less script as GBK, turning Chinese comments into mojibake and then into a syntax error. Every script in this plugin carries the BOM; keep it when editing.
- **Do not hand-edit or delete the `>>> dsh-knowledge-suite BEGIN/END` block in `desktop.yml`** — uninstall relies on it to locate the block.
- Uninstall **restores from the backup** rather than inferring backwards: if the backup directory is deleted, uninstall aborts (fail-loud) instead of guessing.
- Backup directories `backup-dsh-knowledge-suite-*` can be deleted once you have checked them; keeping one after uninstall is advisable.

## Related

- Technical document (capability map / the three semantic traps in detail / before-and-after strip comparison):
  `D:\项目\deepseek-harness\.workbuddy\knowledge-plugin-doc\knowledge-plugin-doc.html`
- Plugin library master index: `D:\项目\DeepSeek Harness plugings\README.md`
