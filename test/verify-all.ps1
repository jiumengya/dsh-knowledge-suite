<#
  test/verify-all.ps1 —— 依次跑全部验证脚本（各自子进程，汇总结果）
  用法：powershell -ExecutionPolicy Bypass -File test\verify-all.ps1
#>
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$scripts = @('dry-run-strip.ps1', 'verify-install.ps1', 'verify-runtime.ps1')
$results = @()
foreach ($s in $scripts) {
    Write-Host ""
    Write-Host "################ $s ################"
    & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "test\$s")
    $code = $LASTEXITCODE
    $results += [pscustomobject]@{ Script = $s; Exit = $code }
}
Write-Host ""
Write-Host "################ 汇总 ################"
foreach ($r in $results) {
    $tag = if ($r.Exit -eq 0) { 'PASS' } else { 'FAIL' }
    Write-Host ("  [{0}] {1}" -f $tag, $r.Script)
}
$bad = ($results | Where-Object { $_.Exit -ne 0 }).Count
if ($bad -gt 0) { Write-Host "$bad 个脚本失败" -ForegroundColor Red; exit 1 }
Write-Host "全部通过" -ForegroundColor Green
