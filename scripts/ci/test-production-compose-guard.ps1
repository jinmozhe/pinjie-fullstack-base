param(
    [string]$GuardScript = (Join-Path $PSScriptRoot "check-production-compose.ps1")
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$fixtureRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("pinjie-production-compose-guard-" + [guid]::NewGuid().ToString("N"))
$composePath = Join-Path $fixtureRoot "compose.prod.yml"
$utf8 = [System.Text.UTF8Encoding]::new($false)
$powerShellExecutable = (Get-Process -Id $PID).Path

function Write-Compose {
    param([string]$Content)
    [System.IO.File]::WriteAllText($composePath, $Content, $utf8)
}

function Invoke-Guard {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = & $powerShellExecutable -NoLogo -NoProfile -ExecutionPolicy Bypass -File $GuardScript -Root $fixtureRoot *>&1
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    return [pscustomobject]@{ ExitCode = $exitCode; Output = ($output | Out-String) }
}

$validCompose = @'
services:
  postgres:
    image: postgres:18.4-alpine
    volumes:
      - postgres_data:/var/lib/postgresql
  backend:
    image: backend
    environment:
      LOG_FILE_ENABLED: "false"
  request-log-consumer:
    image: backend
    environment:
      LOG_FILE_ENABLED: "false"
volumes:
  postgres_data:
'@

try {
    [void](New-Item -ItemType Directory -Path $fixtureRoot -Force)
    Write-Compose -Content $validCompose
    $validResult = Invoke-Guard
    if ($validResult.ExitCode -ne 0) {
        throw "Expected the valid production Compose fixture to pass. Output: $($validResult.Output)"
    }

    Write-Compose -Content $validCompose.Replace("/var/lib/postgresql", "/var/lib/postgresql/data")
    if ((Invoke-Guard).ExitCode -eq 0) {
        throw "Expected the PostgreSQL 17 volume path to fail."
    }

    Write-Compose -Content $validCompose.Replace('      LOG_FILE_ENABLED: "false"', "")
    if ((Invoke-Guard).ExitCode -eq 0) {
        throw "Expected missing production file-log overrides to fail."
    }

    Write-Host "Production Compose guard fixtures passed: valid, legacy PostgreSQL path, and missing log policy."
} finally {
    if (Test-Path -LiteralPath $fixtureRoot -PathType Container) {
        Remove-Item -LiteralPath $fixtureRoot -Recurse -Force
    }
}

exit 0
