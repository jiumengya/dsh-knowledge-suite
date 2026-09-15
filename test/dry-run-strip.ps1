<#
  test/dry-run-strip.ps1 —— 摘除逻辑的离线单元测试(不碰运行时)
  ============================================================================
  以 test/fixtures/ 下的"上游原文快照"(dsh-base / dsh-web-app 的 cordis.patch.yml)
  为输入,跑与 install.ps1 完全相同的 Remove-PatchRows,断言:
    · 目标 5 行确实消失
    · 同期其它行(如 memory-store / ui-settings-plugins)全部保留
    · 重复执行是空操作(幂等)
    · 摘除处没有把邻居行的 config 一起吞掉
  为什么用夹具而不是运行时活文件:安装之后运行时的那 5 行已经被摘除,拿它当输入只会
  测出"已经摘过了",测不到算法本身。
  用法:powershell -ExecutionPolicy Bypass -File test\dry-run-strip.ps1
#>

$ErrorActionPreference = 'Stop'
. (Join-Path (Split-Path -Parent $PSScriptRoot) 'tools\patch-rows.ps1')

$FixtureDir = Join-Path $PSScriptRoot 'fixtures'
$BaseYml   = Join-Path $FixtureDir 'dsh-base.cordis.patch.yml'
$WebYml    = Join-Path $FixtureDir 'dsh-web-app.cordis.patch.yml'
$BaseRowIds = @('knowledge-store', 'tool-knowledge', 'knowledge-recall')
$WebRowIds  = @('knowledge-controller', 'ui-knowledge')
# 摘除后必须仍然在场的邻居行
$MustKeepBase = @('memory-store', 'tool-memory', 'memory-recall', 'memory-distill')
$MustKeepWeb  = @('settings-controller', 'workspace-controller', 'ui-settings-plugins', 'ui-plan')

$tmp = Join-Path $env:TEMP "dsh-knowledge-suite-dryrun"
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

$fail = 0
function Assert([bool]$ok, [string]$what) {
    if ($ok) { Write-Host "  [PASS] $what" -ForegroundColor Green }
    else { Write-Host "  [FAIL] $what" -ForegroundColor Red; $script:fail++ }
}

foreach ($case in @(
    @{ name = 'dsh-base';    file = $BaseYml; ids = $BaseRowIds; keep = $MustKeepBase },
    @{ name = 'dsh-web-app'; file = $WebYml;  ids = $WebRowIds;  keep = $MustKeepWeb }
)) {
    Write-Host ""
    Write-Host "== $($case.name) =="
    $orig = [IO.File]::ReadAllText($case.file)
    $copy = Join-Path $tmp "$($case.name).yml"
    [IO.File]::WriteAllText($copy, $orig, (New-Object System.Text.UTF8Encoding($false)))

    # 摘除前:每个目标 id 都应恰好出现 1 次
    foreach ($id in $case.ids) {
        Assert ((Count-PatchRow $orig $id) -eq 1) "摘除前 $id 出现 1 次(实际 $(Count-PatchRow $orig $id))"
    }

    $r = Remove-PatchRows $orig $case.ids
    $new = $r[0]
    Assert ($r[1] -eq $case.ids.Count) "摘到 $($r[1])/$($case.ids.Count) 行"
    foreach ($id in $case.ids) {
        Assert ((Count-PatchRow $new $id) -eq 0) "摘除后 $id 已消失"
    }
    foreach ($id in $case.keep) {
        Assert ((Count-PatchRow $orig $id) -eq (Count-PatchRow $new $id)) "邻居 $id 未被误伤"
    }
    # 行数减少量应当只有被摘的行数 + 其 config/注释行
    $removedLines = ($orig -split "`r`n|`n").Count - ($new -split "`r`n|`n").Count
    Assert ($removedLines -gt $case.ids.Count) "确实移除了内容行(共 $removedLines 行)"

    # 幂等:再摘一次应为 0
    $r2 = Remove-PatchRows $new $case.ids
    Assert ($r2[1] -eq 0) "重复摘除为空操作"

    # 落盘一条 diff 供人工核对
    [IO.File]::WriteAllText((Join-Path $tmp "$($case.name).after.yml"), $new, (New-Object System.Text.UTF8Encoding($false)))
}

Write-Host ""
Write-Host "对比文件已写到 $tmp(orig 未动,.after.yml 是摘除结果)"
if ($fail -gt 0) { Write-Host "`n$fail 项失败" -ForegroundColor Red; exit 1 }
Write-Host "`n全部通过" -ForegroundColor Green
