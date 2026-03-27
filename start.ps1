# Price-Compare Dev Server Startup Script
# Usage: Right-click -> Run with PowerShell, or execute in PowerShell terminal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Price-Compare Dev Server Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill existing Node processes
Write-Host "[1/3] Stopping existing Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "  -> Stopped $($nodeProcesses.Count) Node process(es)" -ForegroundColor Green
} else {
    Write-Host "  -> No Node processes found" -ForegroundColor Gray
}

# Step 2: Clear Vite cache
Write-Host "[2/3] Clearing Vite cache..." -ForegroundColor Yellow
$viteCachePath = Join-Path $PSScriptRoot "node_modules\.vite"
if (Test-Path $viteCachePath) {
    Remove-Item -Path $viteCachePath -Recurse -Force
    Write-Host "  -> Vite cache cleared" -ForegroundColor Green
} else {
    Write-Host "  -> No Vite cache found" -ForegroundColor Gray
}

# Step 3: Start dev server
Write-Host "[3/3] Starting dev server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host ""

Set-Location $PSScriptRoot
npx vite --host --force
