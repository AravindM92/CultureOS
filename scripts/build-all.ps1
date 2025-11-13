#!/usr/bin/env pwsh
# ========================================
#    THUNAI CULTURE OS - BUILD ALL
# ========================================

# Get the project root directory (parent of scripts folder)
$scriptDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    THUNAI CULTURE OS - BUILD ALL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Project Directory: $scriptDir" -ForegroundColor Gray
Write-Host ""

# Build Node.js Bot (Culture OS)
Write-Host "Installing Node.js Bot dependencies..." -ForegroundColor Green
$botWorkingDir = "$scriptDir\thunai-bot"

if (Test-Path $botWorkingDir) {
    Write-Host "   Working Directory: $botWorkingDir" -ForegroundColor Gray
    
    Set-Location $botWorkingDir
    Write-Host "   Running npm install..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Node.js Bot dependencies installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "   Failed to install Node.js Bot dependencies!" -ForegroundColor Red
        Set-Location $scriptDir
        exit 1
    }
} else {
    Write-Host "   Directory not found: $botWorkingDir" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Build Python API (thunai-api)
Write-Host "Installing Python API dependencies..." -ForegroundColor Green
$apiWorkingDir = "$scriptDir\thunai-api\thunai-api"

if (Test-Path $apiWorkingDir) {
    Write-Host "   Working Directory: $apiWorkingDir" -ForegroundColor Gray
    
    Set-Location $apiWorkingDir
    Write-Host "   Running pip install..." -ForegroundColor Yellow
    pip install -r requirements.txt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Python API dependencies installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "   Failed to install Python API dependencies!" -ForegroundColor Red
        Set-Location $scriptDir
        exit 1
    }
} else {
    Write-Host "   Directory not found: $apiWorkingDir" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Build WFO Prediction API
Write-Host "Installing WFO Prediction API dependencies..." -ForegroundColor Green
$wfoWorkingDir = "$scriptDir\wfo-prediction-api"

if (Test-Path $wfoWorkingDir) {
    Write-Host "   Working Directory: $wfoWorkingDir" -ForegroundColor Gray
    
    Set-Location $wfoWorkingDir
    Write-Host "   Running pip install..." -ForegroundColor Yellow
    pip install -r requirements.txt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   WFO Prediction API dependencies installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "   Failed to install WFO Prediction API dependencies!" -ForegroundColor Red
        Set-Location $scriptDir
        exit 1
    }
} else {
    Write-Host "   Directory not found: $wfoWorkingDir" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verify Database
Write-Host "Verifying database..." -ForegroundColor Green
$dbPath = "$scriptDir\database\thunai_culture.db"

if (Test-Path $dbPath) {
    $dbSize = (Get-Item $dbPath).Length
    if ($dbSize -gt 0) {
        Write-Host "   Database exists and has data ($([math]::Round($dbSize/1KB, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "   Database file exists but is empty!" -ForegroundColor Yellow
        Write-Host "   Run the database restore if needed" -ForegroundColor Gray
    }
} else {
    Write-Host "   Database file not found: $dbPath" -ForegroundColor Red
}

Set-Location $scriptDir

Write-Host ""
Write-Host "All dependencies installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run:" -ForegroundColor White
Write-Host "  • .\scripts\start-all.bat - Start all services" -ForegroundColor Gray
Write-Host "  • .\scripts\test-all.bat - Test all services" -ForegroundColor Gray
Write-Host "  • .\scripts\stop-all.bat - Stop all services" -ForegroundColor Gray
Write-Host ""