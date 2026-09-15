<#
  test/verify-install.ps1 —— 安装后的静态与配置层验证（不启动进程）
  ============================================================================
  检查项：
    1. 六个包已装进运行时，且与 pkg/ 字节一致
    2. dsh-base / dsh-web-app 里那 5 行确实被摘除
    3. desktop.yml 里有插件标记块，且没有残留的孤立 knowledge-store 补丁行
    4. dsh --dump-config 里每个知识 id 恰好出现 1 次，且无 patch 警告
  用法：powershell -ExecutionPolicy Bypass -File test\verify-install.ps1
#>

$ErrorActionPreference = 'Stop'
. (Join-Path (Split-Path -Parent $PSScriptRoot) 'tools\patch-rows.ps1')

$PluginPackages = @('dsh-knowledge', 'dsh-knowledge-store', 'dsh-tool-knowledge',
    'dsh-knowledge-recall', 'dsh-api-knowledge-controller', 'dsh-client-ui-knowledge')
$RowIds = @('knowledge-store', 'tool-knowledge', 'knowledge-recall', 'knowledge-controller', 'ui-knowledge')

$DataDir   = Join-Path $env:LOCALAPPDATA 'DshNative'
$Runtime   = Join-Path $DataDir 'runtime'
$RuntimeAi = Join-Path $Runtime 'node_modules\@deepseek-ai'
$DataYml   = Join-Path $DataDir 'desktop.yml'
$BaseYml   = Join-Path $RuntimeAi 'dsh-base\cordis.patch.yml'
$WebYml    = Join-Path $RuntimeAi 'dsh-web-app\cordis.patch.yml'
$SrcPkg    = Join-Path (Split-Path -Parent $PSScriptRoot) 'pkg'

$fail = 0
function Assert([bool]$ok, [string]$what) {
    if ($ok) { Write-Host "  [PASS] $what" -ForegroundColor Green }
    else { Write-Host "  [FAIL] $what" -ForegroundColor Red; $script:fail++ }
}

Write-Host "== 1. 插件包 =="
foreach ($p in $PluginPackages) {
    $dst = Join-Path $RuntimeAi $p
    Assert (Test-Path (Join-Path $dst 'package.json')) "$p 已装进运行时"
    if (Test-Path (Join-Path $dst 'package.json')) {
        $same = $true
        foreach ($f in (Get-ChildItem -Recurse -File (Join-Path $SrcPkg $p))) {
            $rel = $f.FullName.Substring((Join-Path $SrcPkg $p).Length).TrimStart('\')
            $d = Join-Path $dst $rel
            if (-not (Test-Path $d)) { $same = $false; break }
            if ((Get-FileHash -Algorithm MD5 $f.FullName).Hash -ne (Get-FileHash -Algorithm MD5 $d).Hash) { $same = $false; break }
        }
        Assert $same "$p 与 pkg/ 字节一致"
        if ($same) {
            $extra = @{}
            $dstRoot = Join-Path $RuntimeAi $p
            foreach ($f in (Get-ChildItem -Recurse -File $dstRoot)) {
                $rel = $f.FullName.Substring($dstRoot.Length).TrimStart('\')
                $extra[$rel] = $true
            }
            foreach ($f in (Get-ChildItem -Recurse -File (Join-Path $SrcPkg $p))) {
                $rel = $f.FullName.Substring((Join-Path $SrcPkg $p).Length).TrimStart('\')
                $extra.Remove($rel)
            }
            Assert ($extra.Count -eq 0) "$p 没有残留的旧版本多余文件"
        }
    }
}

Write-Host "== 2. 上游摘除 =="
foreach ($id in @('knowledge-store', 'tool-knowledge', 'knowledge-recall')) {
    Assert ((Count-PatchRow ([IO.File]::ReadAllText($BaseYml)) $id) -eq 0) "dsh-base 已无 $id"
}
foreach ($id in @('knowledge-controller', 'ui-knowledge')) {
    Assert ((Count-PatchRow ([IO.File]::ReadAllText($WebYml)) $id) -eq 0) "dsh-web-app 已无 $id"
}

Write-Host "== 3. 桌面 overlay =="
$yml = [IO.File]::ReadAllText($DataYml)
Assert $yml.Contains('# >>> dsh-knowledge-suite BEGIN') '存在插件标记块'
Assert $yml.Contains('# <<< dsh-knowledge-suite END') '标记块闭合'
Assert ((Count-RootPatchRow $yml 'knowledge-store') -eq 0) '无残留的顶层孤立 knowledge-store 补丁行(已由插件块接管)'

Write-Host "== 4. --dump-config 组合树 =="
$dump = Join-Path $env:TEMP 'dsh-knowledge-suite-dump.yml'
& (Join-Path $Runtime 'node.exe') (Join-Path $RuntimeAi 'dsh\lib\bin.js') '--profile' 'web' '--patch' $DataYml '--dump-config' > $dump 2>&1
Assert ($LASTEXITCODE -eq 0) "dump-config 退出码 0(实际 $LASTEXITCODE)"
$text = [IO.File]::ReadAllText($dump)
foreach ($id in $RowIds) {
    Assert ((Count-PatchRow $text $id) -eq 1) "组合树里 $id 恰好 1 次(实际 $(Count-PatchRow $text $id))"
}
Assert (-not ($text -match '(?m)^\s*(warning|warn)\b')) '无 patch 警告'
Assert ($text -match 'maxUploadBytes: 67108864') '64MiB 上限已保留'

Write-Host ""
if ($fail -gt 0) { Write-Host "$fail 项失败" -ForegroundColor Red; exit 1 }
Write-Host "全部通过" -ForegroundColor Green
