<#
  test/verify-runtime.ps1 —— 冷启冒烟 + 客户端半边取件验证
  ============================================================================
  做一次真实冷启（等价于 DshNative 的启动参数），断言：
    1. 45 秒内发布就绪行 `dsh web: http://127.0.0.1:<port>/?token=...`
    2. stderr 为空（无插件树加载失败 / 重复服务注册）
    3. 进程存活（没有启动后立刻退出）
    4. 首页的模块清单里列出了 @deepseek-ai/dsh-client-ui-knowledge/client.js
    5. 该 bundle 能取到 HTTP 200，且内容里含知识区块的标识
  用法：powershell -ExecutionPolicy Bypass -File test\verify-runtime.ps1
#>

$ErrorActionPreference = 'Stop'
$DataDir = Join-Path $env:LOCALAPPDATA 'DshNative'
$Runtime = Join-Path $DataDir 'runtime'
$DataYml = Join-Path $DataDir 'desktop.yml'
$Tmp = Join-Path $env:TEMP 'dsh-knowledge-suite-verify'
New-Item -ItemType Directory -Force -Path $Tmp | Out-Null

$fail = 0
function Assert([bool]$ok, [string]$what) {
    if ($ok) { Write-Host "  [PASS] $what" -ForegroundColor Green }
    else { Write-Host "  [FAIL] $what" -ForegroundColor Red; $script:fail++ }
}
# node 独占 stdout 重定向文件，必须共享读
function Read-Shared([string]$path) {
    if (-not (Test-Path $path)) { return '' }
    try {
        $fs = New-Object IO.FileStream($path, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
        try { return (New-Object IO.StreamReader($fs)).ReadToEnd() } finally { $fs.Dispose() }
    } catch { return '' }
}

$proc = $null
try {
    $stdout = Join-Path $Tmp 'stdout.log'
    $stderr = Join-Path $Tmp 'stderr.log'
    Remove-Item -Force $stdout, $stderr -ErrorAction SilentlyContinue

    $proc = Start-Process -FilePath (Join-Path $Runtime 'node.exe') `
        -ArgumentList @((Join-Path $Runtime 'node_modules\@deepseek-ai\dsh\lib\bin.js'), '--profile', 'web', '--patch', $DataYml, '--no-open', '--port', '0') `
        -NoNewWindow -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr `
        -WorkingDirectory $env:USERPROFILE

    Write-Host "== 1. 就绪 =="
    $url = $null
    for ($i = 0; $i -lt 45; $i++) {
        Start-Sleep -Seconds 1
        $m = [regex]::Match((Read-Shared $stdout), 'dsh web: (http://127\.0\.0\.1:\d+/\?token=\S+)')
        if ($m.Success) { $url = $m.Groups[1].Value; break }
        if ($proc.HasExited) { break }
    }
    Assert ($null -ne $url) "发布就绪行（耗时 ${i}s）"

    if ($url) {
        Write-Host "== 2. 错误与存活 =="
        $err = Read-Shared $stderr
        Assert ([string]::IsNullOrWhiteSpace($err)) 'stderr 为空'
        if (-not [string]::IsNullOrWhiteSpace($err)) { Write-Host ($err.Substring(0, [Math]::Min(600, $err.Length))) -ForegroundColor DarkYellow }
        Assert (-not $proc.HasExited) '进程存活'

        Write-Host "== 3. 客户端半边 =="
        $base = [regex]::Match($url, '^(http://127\.0\.0\.1:\d+)/').Groups[1].Value
        $idx = (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20 -SessionVariable sess).Content
        $href = ([regex]::Match($idx, '"/plugins/\?\?@deepseek-ai/dsh-client-ui-knowledge/client\.js[^"]*"').Value.Trim('"') -replace '&amp;', '&')
        Assert ($href.Length -gt 0) '首页模块清单里列出了 ui-knowledge 的 client bundle'
        if ($href) {
            try {
                $r = Invoke-WebRequest -Uri ($base + $href) -UseBasicParsing -TimeoutSec 20 -WebSession $sess
                $size = if ($r.RawContentLength -gt 0) { $r.RawContentLength } else { $r.Content.Length }
                Assert ($r.StatusCode -eq 200) "bundle 取件 HTTP 200（$size 字节）"
                Assert ($r.Content -match 'KnowledgeSection') 'bundle 内容含知识区块实现'
            } catch { Assert $false "bundle 取件失败:$($_.Exception.Message)" }
        }
    }
} finally {
    if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
    Write-Host "(临时日志在 $Tmp)"
}

Write-Host ""
if ($fail -gt 0) { Write-Host "$fail 项失败" -ForegroundColor Red; exit 1 }
Write-Host "全部通过" -ForegroundColor Green
