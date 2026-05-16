$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"

$backendVenvLocal = Join-Path $backendDir ".venv\Scripts\Activate.ps1"
$backendVenvRoot = Join-Path $repoRoot ".venv\Scripts\Activate.ps1"

$activateCmd = ""
if (Test-Path $backendVenvLocal) {
    $activateCmd = ". '$backendVenvLocal'; "
} elseif (Test-Path $backendVenvRoot) {
    $activateCmd = ". '$backendVenvRoot'; "
}

$backendCommand = "$activateCmd`$env:DB_ENGINE='sqlite'; Set-Location '$backendDir'; python manage.py runserver 8000"
$frontendCommand = "Set-Location '$frontendDir'; npm run dev"

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $backendCommand
)

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $frontendCommand
)

Start-Process "http://localhost:3000"
