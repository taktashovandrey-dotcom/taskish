<#
Run dev server helper for Taskish project.
Usage: double-click start.bat or run this script in PowerShell:
  powershell -ExecutionPolicy Bypass -File .\run-dev.ps1
#>

Set-StrictMode -Version Latest
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "Project folder: $root"

function Check-Tool($name) {
  $exe = Get-Command $name -ErrorAction SilentlyContinue
  return $null -ne $exe
}

if (-not (Check-Tool node)) {
  Write-Host "Node.js не найден. Пожалуйста установите Node.js LTS: https://nodejs.org/" -ForegroundColor Yellow
  Pause
  exit 1
}
if (-not (Check-Tool npm)) {
  Write-Host "npm не найден. Убедитесь, что Node.js установлен корректно." -ForegroundColor Yellow
  Pause
  exit 1
}

Push-Location $root
try {
  Write-Host "Устанавливаю зависимости (npm install)..." -ForegroundColor Cyan
  & npm install
} catch {
  Write-Host "Ошибка npm install: $_" -ForegroundColor Red
  Pause
  Pop-Location
  exit 1
}

Write-Host "Запускаю dev-сервер в новом окне..." -ForegroundColor Cyan
# Use explicit FilePath and safely pass a single command block to avoid argument parsing issues
$psArgs = @(
  '-NoExit',
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-Command', "& { Set-Location -LiteralPath '$root'; npm run dev }"
)
Start-Process -FilePath "powershell.exe" -ArgumentList $psArgs -WorkingDirectory $root

# Open browser after short delay
Start-Sleep -Seconds 1
try {
  Start-Process "http://localhost:5173/"
} catch {
  Write-Host "Не удалось автоматически открыть браузер. Открой http://localhost:5173/ вручную." -ForegroundColor Yellow
}

Pop-Location