param(
    [string]$GuardScript = (Join-Path $PSScriptRoot "check-production-compose.ps1")
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$fixtureRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("pinjie-production-compose-guard-" + [guid]::NewGuid().ToString("N"))
$composePath = Join-Path $fixtureRoot "compose.prod.yml"
$backendDockerfilePath = Join-Path $fixtureRoot "apps/backend/Dockerfile"
$adminDockerfilePath = Join-Path $fixtureRoot "apps/admin/Dockerfile"
$webDockerfilePath = Join-Path $fixtureRoot "apps/web/Dockerfile"
$utf8 = [System.Text.UTF8Encoding]::new($false)
$powerShellExecutable = (Get-Process -Id $PID).Path

function Write-Compose {
    param([string]$Content)
    [System.IO.File]::WriteAllText($composePath, $Content, $utf8)
}

function Write-Dockerfiles {
    [System.IO.File]::WriteAllText(
        $backendDockerfilePath,
        "FROM python:3.14.7-slim-trixie@sha256:ce40764625a4ff50df3548277632e7f96c4e77fe75fa848aae9885476e7df5a4 AS runtime`n",
        $utf8
    )
    [System.IO.File]::WriteAllText(
        $adminDockerfilePath,
        "FROM nginx:1.29-alpine@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b198d9b830de AS runtime`n",
        $utf8
    )
    [System.IO.File]::WriteAllText(
        $webDockerfilePath,
        "FROM node:24-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS runtime`n",
        $utf8
    )
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
    image: postgres:18.4-alpine@sha256:9a8afca54e7861fd90fab5fdf4c42477a6b1cb7d293595148e674e0a3181de15
    volumes:
      - postgres_data:/var/lib/postgresql
  redis:
    image: redis:8.10.0-alpine@sha256:978f0e01593e65eed801f2402944efcd936d43b5027e4908a7897baf88ed6241
  backend:
    image: ${BACKEND_IMAGE:?BACKEND_IMAGE must be a complete immutable image digest}
    environment:
      LOG_FILE_ENABLED: "false"
  request-log-consumer:
    image: ${BACKEND_IMAGE:?BACKEND_IMAGE must be a complete immutable image digest}
    environment:
      LOG_FILE_ENABLED: "false"
  web:
    image: ${WEB_IMAGE:?WEB_IMAGE must be a complete immutable image digest}
  admin:
    image: ${ADMIN_IMAGE:?ADMIN_IMAGE must be a complete immutable image digest}
volumes:
  postgres_data:
'@

try {
    [void](New-Item -ItemType Directory -Path (Split-Path $backendDockerfilePath) -Force)
    [void](New-Item -ItemType Directory -Path (Split-Path $adminDockerfilePath) -Force)
    [void](New-Item -ItemType Directory -Path (Split-Path $webDockerfilePath) -Force)
    Write-Dockerfiles
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

    Write-Compose -Content $validCompose.Replace(
        "postgres:18.4-alpine@sha256:9a8afca54e7861fd90fab5fdf4c42477a6b1cb7d293595148e674e0a3181de15",
        "postgres:18.4-alpine"
    )
    if ((Invoke-Guard).ExitCode -eq 0) {
        throw "Expected a mutable infrastructure image tag to fail."
    }

    Write-Compose -Content $validCompose.Replace(
        "redis:8.10.0-alpine@sha256:978f0e01593e65eed801f2402944efcd936d43b5027e4908a7897baf88ed6241",
        "redis:8.10.0-alpine@sha256:978f0e"
    )
    if ((Invoke-Guard).ExitCode -eq 0) {
        throw "Expected a short infrastructure image digest to fail."
    }

    Write-Compose -Content $validCompose.Replace(
        '${WEB_IMAGE:?WEB_IMAGE must be a complete immutable image digest}',
        '${WEB_IMAGE}'
    )
    if ((Invoke-Guard).ExitCode -eq 0) {
        throw "Expected a non-required application image variable to fail."
    }

    $previousBackendImage = [Environment]::GetEnvironmentVariable("BACKEND_IMAGE")
    try {
        [Environment]::SetEnvironmentVariable("BACKEND_IMAGE", "ghcr.io/example/backend:latest")
        Write-Compose -Content $validCompose
        if ((Invoke-Guard).ExitCode -eq 0) {
            throw "Expected a mutable configured application image to fail."
        }
    } finally {
        [Environment]::SetEnvironmentVariable("BACKEND_IMAGE", $previousBackendImage)
    }

    [System.IO.File]::WriteAllText($webDockerfilePath, "FROM node:24-alpine AS runtime`n", $utf8)
    Write-Compose -Content $validCompose
    if ((Invoke-Guard).ExitCode -eq 0) {
        throw "Expected a mutable Dockerfile base image to fail."
    }

    Write-Host "Production image guard fixtures passed: valid and all Dockerfile, Compose, volume, and logging negatives."
} finally {
    if (Test-Path -LiteralPath $fixtureRoot -PathType Container) {
        Remove-Item -LiteralPath $fixtureRoot -Recurse -Force
    }
}

exit 0
