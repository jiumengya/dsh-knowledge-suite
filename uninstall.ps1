<#
  dsh-knowledge-suite 卸载脚本
  ============================================================================
  还原 install.ps1 的全部改动：
    1. 从最近一次备份还原 dsh-base / dsh-web-app 的 cordis.patch.yml（那 5 行回到上游位置）
    2. 从备份还原被插件覆盖的六个运行时包（它们本来就是随安装包分发的）
    3. 从桌面 overlay 里摘掉插件注册块，并把被接管的 64MiB knowledge-store 补丁行放回
  结果是知识库功能退回应用内置的默认状态（即"本插件没装过"）。

  用法：右键「使用 PowerShell 运行」，或
        powershell -ExecutionPolicy Bypass -File uninstall.ps1
        powershell -ExecutionPolicy Bypass -File uninstall.ps1 -Backup <备份目录>
#>

[CmdletBinding()]
param(
    # 指定备份目录；缺省用最近一次 backup-dsh-knowledge-suite-*
    [string]$Backup
)

$ErrorActionPreference = 'Stop'

$PluginId       = 'dsh-knowledge-suite'
$PluginPackages = @(
    'dsh-knowledge',
    'dsh-knowledge-store',
    'dsh-tool-knowledge',
    'dsh-knowledge-recall',
    'dsh-api-knowledge-controller',
    'dsh-client-ui-knowledge'
)
$RestoreTargets = @(
    'runtime\node_modules\@deepseek-ai\dsh-base\cordis.patch.yml',
    'runtime\node_modules\@deepseek-ai\dsh-web-app\cordis.patch.yml'
)

$DataDir   = Join-Path $env:LOCALAPPDATA 'DshNative'
$RuntimeAi = Join-Path $DataDir 'runtime\node_modules\@deepseek-ai'
$DataYml   = Join-Path $DataDir 'desktop.yml'

$BeginMark = '# >>> dsh-knowledge-suite BEGIN'
$EndMark   = '# <<< dsh-knowledge-suite END'

# 还原时要放回桌面 overlay 的那条补丁行（install 时被本插件接管）
$OrphanRow = @'
# 资料库单文件上传上限 64MiB(默认 32MiB 装不下大 PDF)。patch 整体替换
# knowledge-store 的 config,base 行字段全部重述。
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

# ── 0. 找备份 ──────────────────────────────────────────────────────────────
if (-not $Backup) {
    $cands = Get-ChildItem -Path $DataDir -Directory -Filter "backup-$PluginId-*" -ErrorAction SilentlyContinue |
             Sort-Object Name -Descending
    if (-not $cands -or $cands.Count -eq 0) {
        throw "找不到任何 backup-$PluginId-* 备份目录(在 $DataDir)。无法安全还原,已中止。"
    }
    $Backup = $cands[0].FullName
}
if (-not (Test-Path $Backup)) { throw "备份目录不存在:$Backup" }
Write-Host "使用备份:$Backup"

$Restored = 0

# ── 1. 还原上游 patch 文件 ─────────────────────────────────────────────────
foreach ($rel in $RestoreTargets) {
    $src  = Join-Path $Backup $rel
    $dest = Join-Path $DataDir $rel
    if (-not (Test-Path $src)) { Write-Host "  [跳过] 备份里没有 $rel"; continue }
    Copy-Item -Force $src $dest
    $Restored++
    Write-Host "  已还原 $rel"
}
if ($Restored -eq 0) { throw "备份里没有任何上游 patch 文件,无法还原,已中止。" }
Write-Host "[1/3] 上游 patch 文件已还原($Restored 个)"

# ── 2. 还原六个运行时包 ────────────────────────────────────────────────────
foreach ($p in $PluginPackages) {
    $rel  = "runtime\node_modules\@deepseek-ai\$p"
    $src  = Join-Path $Backup $rel
    $dest = Join-Path $RuntimeAi $p
    if (Test-Path $src) {
        if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
        Copy-Item -Recurse -Force $src $dest
        Write-Host "  已还原 $p"
    } else {
        # 安装前不存在(本插件引入的),直接移除
        if (Test-Path $dest) { Remove-Item -Recurse -Force $dest; Write-Host "  已移除 $p(安装前不存在)" }
    }
}
Write-Host "[2/3] 运行时包已还原"

# ── 3. 还原桌面 overlay ────────────────────────────────────────────────────
if (Test-Path $DataYml) {
    $yml = [IO.File]::ReadAllText($DataYml)
    $hadBlock = $yml.Contains($BeginMark)
    $yml = Remove-MarkedBlock $yml $BeginMark $EndMark
    # 放回被接管的补丁行(仅当不存在时)
    if (-not $yml.Contains("maxUploadBytes: 67108864")) {
        $yml = $yml.TrimEnd("`r`n") + "`r`n" + $OrphanRow + "`r`n"
        Write-Host "  已放回 64MiB 上限补丁行"
    }
    Write-TextUtf8 $DataYml $yml
    if ($hadBlock) { Write-Host "  已摘除插件注册块" } else { Write-Host "  未发现插件注册块(可能已手工移除)" }
} else {
    Write-Host "  桌面 overlay 不存在,跳过"
}
Write-Host "[3/3] 桌面 overlay 已还原"

Write-Host ""
Write-Host "卸载完成。重启 DeepSeek Harness 后生效。"
Write-Host "备份保留在:$Backup（确认无误后可自行删除）"
