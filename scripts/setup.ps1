#!/usr/bin/env pwsh
# ========================================
#    THUNAI CULTURE OS - SETUP
# ========================================

param(
    [string]$GroqApiKey
)

$scriptDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    THUNAI CULTURE OS - SETUP" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $GroqApiKey) {
    Write-Host "Usage: .\setup.ps1 -GroqApiKey 'your-api-key-here'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or you can:" -ForegroundColor White
    Write-Host "1. Get your Groq API key from: https://console.groq.com/keys" -ForegroundColor Gray
    Write-Host "2. Edit Culture OS\src\config.js and replace 'your-groq-api-key-here'" -ForegroundColor Gray
    Write-Host "3. Or set environment variable: `$env:GROQ_API_KEY='your-key'" -ForegroundColor Gray
    exit 1
}

# Update the config.js file with the provided API key
$configPath = "$scriptDir\Culture OS\src\config.js"
$configContent = Get-Content $configPath -Raw

$updatedContent = $configContent -replace 'groqApiKey: process\.env\.GROQ_API_KEY \|\| "your-groq-api-key-here"', "groqApiKey: process.env.GROQ_API_KEY || `"$GroqApiKey`""

Set-Content -Path $configPath -Value $updatedContent

Write-Host "✅ Groq API key configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run: .\start-all.bat" -ForegroundColor Yellow
Write-Host ""