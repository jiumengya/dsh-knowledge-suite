<#
  dsh-knowledge-suite 安装脚本
  ============================================================================
  把「资料库知识能力」（六个包）从 dsh-base / dsh-web-app 里摘除，改由本插件提供。

  为什么需要"摘除"这一步：
    上游把知识能力硬编码在 @deepseek-ai/dsh-base（knowledge-store / tool-knowledge /
    knowledge-recall）与 @deepseek-ai/dsh-web-app（knowledge-controller / ui-knowledge）
    这两份 cordis.patch.yml 里，随安装包分发。要让这六个包变成"可单独装卸的插件"，
    必须先把那 5 行从它们上游的位置移除，否则会出现两种硬失败（均已实测）：
      · 同 id 再插一行  → duplicate loader entry id: knowledge-store，进程起不来
      · 用新 id 再插一行 → service "knowledge" has been registered / tool "knowledge"
                          is already registered，进程同样起不来
    所以本脚本做的是：备份 → 复制插件包 → 从上游摘除那 5 行 → 由插件重新注册。

  幂等：可以反复运行。app 覆盖安装后若上游行回来了，再跑一次本脚本即可修复。
        卸载请用 uninstall.ps1（会从备份还原上游文件）。

  用法：右键「使用 PowerShell 运行」，或
        powershell -ExecutionPolicy Bypass -File install.ps1
#>

$ErrorActionPreference = 'Stop'

# ── 常量 ────────────────────────────────────────────────────────────────────
$PluginId       = 'dsh-knowledge-suite'
$PluginPackages = @(
    'dsh-knowledge',
    'dsh-knowledge-store',
    'dsh-tool-knowledge',
    'dsh-knowledge-recall',
    'dsh-api-knowledge-controller',
    'dsh-client-ui-knowledge'
)
# 要摘除的行 id：base 三个 + web-app 两个
$BaseRowIds = @('knowledge-store', 'tool-knowledge', 'knowledge-recall')
$WebRowIds  = @('knowledge-controller', 'ui-knowledge')

$DataDir    = Join-Path $env:LOCALAPPDATA 'DshNative'
$Runtime    = Join-Path $DataDir 'runtime'
$RuntimeNode = Join-Path $Runtime 'node_modules'
$RuntimeAi  = Join-Path $RuntimeNode '@deepseek-ai'
$DataYml    = Join-Path $DataDir 'desktop.yml'

# 这些是六个包的运行时导入；缺任何一个，安装后就会在冷启/加载 client bundle 时失败。
# 共享原语（dsh-retrieval / dsh-atomic-write / dsh-memory-embedding）不属于本插件，
# 但必须由宿主 runtime 继续提供，因此也在安装前一并 fail-loud 检查。
$RequiredRuntimeModules = @(
    'react', 'mammoth', 'unpdf', 'zod',
    '@deepseek-ai/cordis', '@deepseek-ai/schemastery', '@deepseek-ai/dsh-agent',
    '@deepseek-ai/dsh-tools', '@deepseek-ai/dsh-typert-protocol',
    '@deepseek-ai/dsh-invariants', '@deepseek-ai/dsh-atomic-write',
    '@deepseek-ai/dsh-retrieval', '@deepseek-ai/dsh-memory-embedding',
    '@deepseek-ai/dsh-brand', '@deepseek-ai/dsh-llm',
    '@deepseek-ai/dsh-client-connection', '@deepseek-ai/dsh-api-remotes',
    '@deepseek-ai/dsh-client-ui-settings', '@deepseek-ai/dsh-client-locale',
    '@deepseek-ai/dsh-client-store', '@deepseek-ai/dsh-client-ui-primitives'
)
$BaseYml   = Join-Path $RuntimeAi 'dsh-base\cordis.patch.yml'
$WebYml    = Join-Path $RuntimeAi 'dsh-web-app\cordis.patch.yml'
$SrcPkg    = Join-Path $PSScriptRoot 'pkg'

$BeginMark = '# >>> dsh-knowledge-suite BEGIN'
$EndMark   = '# <<< dsh-knowledge-suite END'

# 安装前桌面 overlay 里那条 64MiB 的 knowledge-store 补丁行：摘除上游行之后它会变成
# 指向不存在的行（每次启动都warn），所以由本插件接管——把它搬进插件块（配置值不变），
# 卸载时再原样放回。
$OrphanRowId  = 'knowledge-store'
$OrphanConfig = @'
- id: knowledge-store
  name: '@deepseek-ai/dsh-knowledge-store'
  config:
    root: !!js dshHomePath('knowledge')
    minScore: 0.35
    chunkSize: 1200
    maxUploadBytes: 67108864
'@

# ── 工具函数（共用实现见 tools/patch-rows.ps1）─────────────────────────────
. (Join-Path $PSScriptRoot 'tools\patch-rows.ps1')

# 备份一个路径（文件或目录）到备份目录，保留相对结构。
function Backup-Item([string]$Path, [string]$Root, [string]$BackupDir) {
    if (-not (Test-Path $Path)) { return $false }
    $rel = $Path.Substring($Root.Length).TrimStart('\')
    $dest = Join-Path $BackupDir $rel
    if ((Get-Item $Path).PSIsContainer) {
        New-Item -ItemType Directory -Force -Path $dest | Out-Null
        Copy-Item -Recurse -Force (Join-Path $Path '*') $dest
    } else {
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
        Copy-Item -Force $Path $dest
    }
    return $true
}

# ── 0. 前置检查 ────────────────────────────────────────────────────────────
if (-not (Test-Path $RuntimeAi)) {
    throw "找不到 DshNative 运行时:$RuntimeAi`n请先安装并至少启动过一次 DeepSeek Harness。"
}
if (-not (Test-Path $BaseYml)) { throw "找不到 $BaseYml —— 运行时布局与预期不符。" }
if (-not (Test-Path $WebYml))  { throw "找不到 $WebYml —— 运行时布局与预期不符。" }
foreach ($p in $PluginPackages) {
    if (-not (Test-Path (Join-Path $SrcPkg "$p\package.json"))) {
        throw "插件包不完整,缺少 $p\package.json(期望在 $SrcPkg)"
    }
}
$missing = @($RequiredRuntimeModules | Where-Object {
    $modulePath = Join-Path $RuntimeNode ($_ -replace '/', '\\')
    -not (Test-Path $modulePath)
})
if ($missing.Count -gt 0) {
    throw "宿主运行时缺少知识能力依赖,拒绝半安装:`n  $($missing -join "`n  ")`n请先更新/启动 DshNative 到与插件匹配的 runtime。"
}
Write-Host "[0/5] 宿主依赖检查通过($($RequiredRuntimeModules.Count) 项)"

# ── 1. 备份 ────────────────────────────────────────────────────────────────
$stamp   = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup  = Join-Path $DataDir "backup-$PluginId-$stamp"
New-Item -ItemType Directory -Force -Path $backup | Out-Null
$BackupRoot = $DataDir   # 相对这个根保存

$manifest = [ordered]@{ plugin = $PluginId; installedAt = (Get-Date).ToString('s'); files = @() }
foreach ($f in @($DataYml, $BaseYml, $WebYml)) {
    if (Backup-Item $f $BackupRoot $backup) {
        $manifest.files += [ordered]@{ path = $f; kind = 'file'; md5 = (Get-FileHash -Algorithm MD5 $f).Hash }
    }
}
foreach ($p in $PluginPackages) {
    $pkgDir = Join-Path $RuntimeAi $p
    if (Backup-Item $pkgDir $BackupRoot $backup) {
        $manifest.files += [ordered]@{ path = $pkgDir; kind = 'dir' }
    }
}
Write-TextUtf8 (Join-Path $backup 'manifest.json') ($manifest | ConvertTo-Json -Depth 6)
Write-Host "[1/5] 已备份到 $backup"

# ── 2. 复制插件包到运行时 ──────────────────────────────────────────────────
foreach ($p in $PluginPackages) {
    $dst = Join-Path $RuntimeAi $p
    if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
    Copy-Item -Recurse -Force (Join-Path $SrcPkg $p) $dst
}
Write-Host "[2/5] 已装入 $($PluginPackages.Count) 个包到 $RuntimeAi"

# ── 3. 从 dsh-base / dsh-web-app 摘除知识行 ────────────────────────────────
#    顺序很重要:先摘除,后注册 —— 否则加载器会报重复 id / 重复服务。
$baseText = [IO.File]::ReadAllText($BaseYml)
$r = Remove-PatchRows $baseText $BaseRowIds
if ($r[1] -lt $BaseRowIds.Count) {
    throw "dsh-base 里只摘到 $($r[1])/$($BaseRowIds.Count) 行 —— 上游结构可能已变,已中止(未改动该文件)。"
}
Write-TextUtf8 $BaseYml $r[0]
Write-Host "[3/5] 已从 dsh-base 摘除 $($r[1]) 行:$($BaseRowIds -join ', ')"

$webText = [IO.File]::ReadAllText($WebYml)
$r = Remove-PatchRows $webText $WebRowIds
if ($r[1] -lt $WebRowIds.Count) {
    throw "dsh-web-app 里只摘到 $($r[1])/$($WebRowIds.Count) 行 —— 上游结构可能已变,已中止(未改动该文件)。"
}
Write-TextUtf8 $WebYml $r[0]
Write-Host "      已从 dsh-web-app 摘除 $($r[1]) 行:$($WebRowIds -join ', ')"

# ── 4. 改写桌面 overlay ────────────────────────────────────────────────────
$yml = Read-TextOrEmpty $DataYml
if ($yml -eq '') {
    throw "找不到桌面 overlay:$DataYml —— 请先启动一次应用让它生成,再重新运行本脚本。"
}
# 4a. 去掉旧的插件块(保证幂等)
$yml = Remove-MarkedBlock $yml $BeginMark $EndMark
# 4b. 去掉那条已失去目标的 64MiB knowledge-store 补丁行(其取值由下面的插件块继承)
$r = Remove-PatchRows $yml @($OrphanRowId)
$yml = $r[0]
if ($r[1] -gt 0) { Write-Host "      已接管桌面 overlay 里原有的 $OrphanRowId 补丁行(64MiB 上限保持不变)" }

# 4c. 追加插件块
$block = @"

$BeginMark
# 资料库知识能力(六个包):已从 dsh-base / dsh-web-app 摘除,改由本插件注册。
# 见 plugins\$PluginId —— 卸载会从备份还原上游文件,请勿手工删改本段。
- insert:
    - id: knowledge-store
      name: '@deepseek-ai/dsh-knowledge-store'
      config:
        root: !!js dshHomePath('knowledge')
        minScore: 0.35
        chunkSize: 1200
        maxUploadBytes: 67108864
    - id: tool-knowledge
      name: '@deepseek-ai/dsh-tool-knowledge'
      config:
        maxResults: 8
    - id: knowledge-recall
      name: '@deepseek-ai/dsh-knowledge-recall'
      config:
        topK: 5
        minScore: 0.35
        firstStepOnly: true
    - id: knowledge-controller
      name: '@deepseek-ai/dsh-api-knowledge-controller'
    - id: ui-knowledge
      name: '@deepseek-ai/dsh-client-ui-knowledge'
$EndMark
"@
$yml = $yml.TrimEnd("`r`n") + $block + "`r`n"
Write-TextUtf8 $DataYml $yml
Write-Host "[4/5] 已把插件注册块写入 $DataYml"

# ── 5. 汇总 ────────────────────────────────────────────────────────────────
Write-Host "[5/5] 安装完成。"
Write-Host ""
Write-Host "  插件包 : $($PluginPackages -join ', ')"
Write-Host "  备份   : $backup"
Write-Host "  回滚   : 运行 uninstall.ps1"
Write-Host ""
Write-Host "重启 DeepSeek Harness 后生效:设置 → 资料库 应能看到文档库区块。"
Write-Host "注意:app 覆盖安装后若上游行回来了,请重新运行本脚本(幂等)。"
