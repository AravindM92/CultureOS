#!/usr/bin/env pwsh
# ========================================
#    THUNAI CULTURE OS - START ALL
# ========================================

# Get the script directory to make paths relative
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    THUNAI CULTURE OS - START ALL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Project Directory: $scriptDir" -ForegroundColor Gray
Write-Host ""

# Start Python API (thunai-api) in background
Write-Host "Starting Python API (thunai-api)..." -ForegroundColor Green
$apiWorkingDir = "$scriptDir\thunai-api\thunai-api"

if (Test-Path $apiWorkingDir) {
    Write-Host "   Working Directory: $apiWorkingDir" -ForegroundColor Gray
    
    # Start Python API in background
    $pythonJob = Start-Job -ScriptBlock {
        param($workDir)
        Set-Location $workDir
        python main.py
    } -ArgumentList $apiWorkingDir
    
    Write-Host "   Python API started (Job ID: $($pythonJob.Id))" -ForegroundColor Green
} else {
    Write-Host "   Directory not found: $apiWorkingDir" -ForegroundColor Red
}

Write-Host ""

# Start Node.js Bot (Culture OS) in background  
Write-Host "Starting Node.js Bot (Culture OS)..." -ForegroundColor Green
$botWorkingDir = "$scriptDir\Culture OS"

if (Test-Path $botWorkingDir) {
    Write-Host "   Working Directory: $botWorkingDir" -ForegroundColor Gray
    
    # Start Node.js Bot in background
    $nodeJob = Start-Job -ScriptBlock {
        param($workDir)
        Set-Location $workDir
        npm start
    } -ArgumentList $botWorkingDir
    
    Write-Host "   Node.js Bot started (Job ID: $($nodeJob.Id))" -ForegroundColor Green
} else {
    Write-Host "   Directory not found: $botWorkingDir" -ForegroundColor Red
}

Write-Host ""

# Start Teams App Tester (Playground) in background
Write-Host "Starting Teams Playground (teamsapptester)..." -ForegroundColor Green

$playgroundWorkingDir = "$scriptDir\Culture OS\devTools\teamsapptester"
if (Test-Path $playgroundWorkingDir) {
    Write-Host "   Working Directory: $playgroundWorkingDir" -ForegroundColor Gray
    
    # Start Teams App Tester in background
    $playgroundJob = Start-Job -ScriptBlock {
        param($workDir)
        Set-Location $workDir
        npx @microsoft/teams-app-test-tool
    } -ArgumentList $playgroundWorkingDir
    
    Write-Host "   Teams Playground started (Job ID: $($playgroundJob.Id))" -ForegroundColor Green
} else {
    Write-Host "   Directory not found: $playgroundWorkingDir" -ForegroundColor Red
}

Write-Host ""
Write-Host "All services started in background!" -ForegroundColor Green
Write-Host ""
Write-Host "Services should be running on:" -ForegroundColor White
Write-Host "  • Python API: http://localhost:8000" -ForegroundColor Gray
Write-Host "  • Node.js Bot: http://localhost:3978" -ForegroundColor Gray
Write-Host "  • Teams Playground: http://localhost:56150" -ForegroundColor Gray
Write-Host ""
Write-Host "Use 'Get-Job' to check job status" -ForegroundColor Yellow
Write-Host "Use 'Receive-Job -Id [JobId]' to see output" -ForegroundColor Yellow
Write-Host "Use '.\stop-all.ps1' to stop all services" -ForegroundColor Yellow
Write-Host ""