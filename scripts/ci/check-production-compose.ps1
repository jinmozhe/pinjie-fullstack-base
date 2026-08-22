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

function Get-ServiceImage {
    param(
        [string]$Name,
        [string]$ServiceBlock
    )

    $match = [regex]::Match($ServiceBlock, '(?m)^    image:\s*(?<image>.+?)\s*$')
    if (-not $match.Success) {
        $violations.Add("Service '$Name' must declare exactly one image reference.")
        return ""
    }
    return $match.Groups["image"].Value
}

function Test-ImmutableImageReference {
    param([string]$Reference)

    return $Reference -match '^[A-Za-z0-9][A-Za-z0-9._/-]*(?::[A-Za-z0-9][A-Za-z0-9._-]*)?@sha256:[0-9a-f]{64}$'
}

function Confirm-LiteralImage {
    param(
        [string]$Name,
        [string]$ExpectedReference
    )

    $serviceBlock = Get-ServiceBlock -Name $Name
    $reference = Get-ServiceImage -Name $Name -ServiceBlock $serviceBlock
    if (-not (Test-ImmutableImageReference -Reference $reference)) {
        $violations.Add("Service '$Name' must use a complete immutable image digest.")
    } elseif ($reference -ne $ExpectedReference) {
        $violations.Add("Service '$Name' image must match the reviewed reference '$ExpectedReference'.")
    }
}

function Confirm-RequiredImageVariable {
    param(
        [string]$Name,
        [string]$VariableName
    )

    $serviceBlock = Get-ServiceBlock -Name $Name
    $reference = Get-ServiceImage -Name $Name -ServiceBlock $serviceBlock
    $expectedReference = '${' + $VariableName + ':?' + $VariableName + ' must be a complete immutable image digest}'
    if ($reference -ne $expectedReference) {
        $violations.Add("Service '$Name' must require the '$VariableName' immutable image variable.")
    }

    $configuredReference = [Environment]::GetEnvironmentVariable($VariableName)
    if ($null -ne $configuredReference -and -not (Test-ImmutableImageReference -Reference $configuredReference)) {
        $violations.Add("Environment variable '$VariableName' must be a complete immutable image digest when provided.")
    }
}

function Confirm-DockerfileBaseImages {
    param([string]$RelativePath)

    $dockerfilePath = Join-Path $rootPath $RelativePath
    if (-not (Test-Path -LiteralPath $dockerfilePath -PathType Leaf)) {
        $violations.Add("Production Dockerfile is missing: $RelativePath.")
        return
    }

    $dockerfile = [System.IO.File]::ReadAllText($dockerfilePath, [System.Text.Encoding]::UTF8)
    $fromMatches = [regex]::Matches($dockerfile, '(?m)^FROM\s+(?<image>\S+)(?:\s+AS\s+\S+)?\s*$')
    if ($fromMatches.Count -eq 0) {
        $violations.Add("Production Dockerfile '$RelativePath' must declare at least one base image.")
        return
    }

    foreach ($fromMatch in $fromMatches) {
        $reference = $fromMatch.Groups["image"].Value
        if (-not (Test-ImmutableImageReference -Reference $reference)) {
            $violations.Add("Production Dockerfile '$RelativePath' base image '$reference' must use a complete immutable digest.")
        }
    }
}

foreach ($dockerfilePath in @("apps/backend/Dockerfile", "apps/admin/Dockerfile", "apps/web/Dockerfile")) {
    Confirm-DockerfileBaseImages -RelativePath $dockerfilePath
}

Confirm-LiteralImage -Name "postgres" -ExpectedReference "postgres:18.4-alpine@sha256:9a8afca54e7861fd90fab5fdf4c42477a6b1cb7d293595148e674e0a3181de15"
Confirm-LiteralImage -Name "redis" -ExpectedReference "redis:8.10.0-alpine@sha256:978f0e01593e65eed801f2402944efcd936d43b5027e4908a7897baf88ed6241"

Confirm-RequiredImageVariable -Name "backend" -VariableName "BACKEND_IMAGE"
Confirm-RequiredImageVariable -Name "request-log-consumer" -VariableName "BACKEND_IMAGE"
Confirm-RequiredImageVariable -Name "web" -VariableName "WEB_IMAGE"
Confirm-RequiredImageVariable -Name "admin" -VariableName "ADMIN_IMAGE"

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

Write-Host "Production image invariants passed: Dockerfiles, Compose images, PostgreSQL 18 volume, and container logging policy."
