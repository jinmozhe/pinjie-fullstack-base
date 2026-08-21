param(
    [string]$Root = (Resolve-Path (Join-Path (Join-Path $PSScriptRoot "..") ".."))
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$rootPath = (Resolve-Path -LiteralPath $Root).Path
$composePath = Join-Path $rootPath "compose.prod.yml"
if (-not (Test-Path -LiteralPath $composePath -PathType Leaf)) {
    throw "Production Compose file is missing: $composePath"
}

$compose = [System.IO.File]::ReadAllText($composePath, [System.Text.Encoding]::UTF8)
$violations = [System.Collections.Generic.List[string]]::new()

function Get-ServiceBlock {
    param([string]$Name)

    $pattern = "(?ms)^  " + [regex]::Escape($Name) + ":\r?\n(?<body>.*?)(?=^  [A-Za-z0-9_-]+:\r?$|^volumes:\r?$)"
    $match = [regex]::Match($compose, $pattern)
    if (-not $match.Success) {
        $violations.Add("Service '$Name' is missing from compose.prod.yml.")
        return ""
    }
    return $match.Groups["body"].Value
}

$postgresBlock = Get-ServiceBlock -Name "postgres"
if ($postgresBlock -notmatch '(?m)^      - postgres_data:/var/lib/postgresql\s*$') {
    $violations.Add("PostgreSQL 18 must mount postgres_data at /var/lib/postgresql.")
}
if ($postgresBlock -match '/var/lib/postgresql/data') {
    $violations.Add("PostgreSQL 18 must not mount a volume at the pre-18 /var/lib/postgresql/data path.")
}

foreach ($serviceName in @("backend", "request-log-consumer")) {
    $serviceBlock = Get-ServiceBlock -Name $serviceName
    if ($serviceBlock -notmatch '(?m)^      LOG_FILE_ENABLED: "false"\s*$') {
        $violations.Add("Service '$serviceName' must explicitly disable file logging unless a writable log volume is configured.")
    }
}

if ($violations.Count -gt 0) {
    foreach ($violation in $violations) {
        Write-Error $violation
    }
    exit 1
}

Write-Host "Production Compose invariants passed: PostgreSQL 18 volume and container logging policy."
