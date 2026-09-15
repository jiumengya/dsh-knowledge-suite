<#
  dsh-knowledge-suite 共用助手：cordis patch YAML 的按行外科手术
  ============================================================================
  这里只做一件事:在一份 patch YAML 里按 id 摘除整行(含其 config 子树与紧贴其上的
  注释块),以及摘除/追加 [BEGIN..END] 标记块。不依赖 YAML 解析器,按缩进界定区间,
  因此 app 版本升级导致的字段变化不会影响它的正确性。

  为什么不用"精确整段字符串替换":那份文本会随上游版本变化,写死必然在某次升级后
  静默失配。按行 + fail-loud(摘不够就抛错)才是可持续的做法。
#>

# 读文本，容忍不存在。
function Read-TextOrEmpty([string]$Path) {
    if (Test-Path $Path) { return [IO.File]::ReadAllText($Path) }
    return ''
}

# 以 UTF-8(无 BOM) + 平台换行写回。
function Write-TextUtf8([string]$Path, [string]$Text) {
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding($false)))
}

<# 截掉 [BEGIN..END] 段（含尾部多余空行）。 #>
function Remove-MarkedBlock([string]$Text, [string]$Begin, [string]$End) {
    $lines = $Text -split "`r`n|`n"
    $out = New-Object System.Collections.Generic.List[string]
    $skip = $false
    $beginCount = 0
    $endCount = 0
    foreach ($line in $lines) {
        if ($line.Trim() -eq $Begin) {
            if ($skip) { throw "发现重复插件 BEGIN 标记:$Begin" }
            $skip = $true
            $beginCount++
            continue
        }
        if ($skip) {
            if ($line.Trim() -eq $End) { $skip = $false; $endCount++ }
            continue
        }
        if ($line.Trim() -eq $End) { throw "发现没有 BEGIN 的插件 END 标记:$End" }
        $out.Add($line)
    }
    if ($skip -or $beginCount -ne $endCount) { throw "插件标记块不完整:$Begin / $End" }
    while ($out.Count -gt 0 -and $out[$out.Count - 1].Trim() -eq '') { $out.RemoveAt($out.Count - 1) }
    return ($out -join "`r`n") + "`r`n"
}

<#
  按 id 摘除 patch 行。返回 @(新文本, 摘除条数)。
  摘除区间 = 该行本身 + 其后所有缩进更深的行 + 其上空连续的同缩进(或更深)注释行。
#>
function Remove-PatchRows([string]$Text, [string[]]$Ids) {
    $lines = $Text -split "`r`n|`n"
    $out = New-Object System.Collections.Generic.List[string]
    $removed = 0
    $i = 0
    while ($i -lt $lines.Count) {
        $line = $lines[$i]
        $m = [regex]::Match($line, '^(\s*)-\s+id:\s*(\S+)\s*$')
        if ($m.Success -and ($Ids -contains $m.Groups[2].Value)) {
            $indent = $m.Groups[1].Length
            $removed++
            $i++
            while ($i -lt $lines.Count) {
                $l = $lines[$i]
                if ($l.Trim() -eq '') {
                    # 空行可能只是条目分隔:看下一个非空行的缩进再决定
                    $j = $i
                    while ($j -lt $lines.Count -and $lines[$j].Trim() -eq '') { $j++ }
                    if ($j -ge $lines.Count) { break }
                    $nind = ([regex]::Match($lines[$j], '^(\s*)')).Groups[1].Length
                    if ($nind -le $indent) { break }
                    $i++; continue
                }
                $nind = ([regex]::Match($l, '^(\s*)')).Groups[1].Length
                if ($nind -le $indent) { break }
                $i++
            }
            # 清掉紧贴其上的注释块(同缩进或更深、连续、无空行隔断)
            while ($out.Count -gt 0) {
                $prev = $out[$out.Count - 1]
                if ($prev.Trim() -eq '') { break }
                $pm = [regex]::Match($prev, '^(\s*)#')
                if (-not $pm.Success) { break }
                if ($pm.Groups[1].Length -lt $indent) { break }
                $out.RemoveAt($out.Count - 1)
            }
            continue
        }
        $out.Add($line)
        $i++
    }
    $text = ($out -join "`r`n")
    $text = [regex]::Replace($text, "(\r?\n){3,}", "`r`n`r`n")
    return @($text, $removed)
}

<# 统计某个 id 作为 patch 行出现的次数（任意缩进）。 #>
function Count-PatchRow([string]$Text, [string]$Id) {
    $n = 0
    foreach ($line in ($Text -split "`r`n|`n")) {
        if ([regex]::IsMatch($line, "^(\s*)-\s+id:\s+$([regex]::Escape($Id))\s*$")) { $n++ }
    }
    return $n
}

<# 只统计顶格(缩进 0)的 patch 行 —— 用来区分"顶层补丁行"与"insert 块里的行"。 #>
function Count-RootPatchRow([string]$Text, [string]$Id) {
    $n = 0
    foreach ($line in ($Text -split "`r`n|`n")) {
        if ([regex]::IsMatch($line, "^-\s+id:\s+$([regex]::Escape($Id))\s*$")) { $n++ }
    }
    return $n
}
