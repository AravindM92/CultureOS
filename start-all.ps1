#!/usr/bin/env pwsh
# ========================================
#    THUNAI CULTURE OS - START ALL (OPTIMIZED)
# ========================================

# Set execution policy for current session
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Get the script directory to make paths relative
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    THUNAI CULTURE OS - START ALL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Project Directory: $scriptDir" -ForegroundColor Gray
Write-Host ""

# Clean up any orphaned PowerShell processes first
Write-Host "🧹 Cleaning up orphaned processes..." -ForegroundColor Blue
$orphanedProcesses = Get-Process powershell -ErrorAction SilentlyContinue | Where-Object { 
    $_.Id -ne $PID -and 
    $_.MainWindowTitle -eq "" -and 
    $_.StartTime -lt (Get-Date).AddMinutes(-5) 
}
if ($orphanedProcesses) {
    $orphanedProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "   Cleaned up $($orphanedProcesses.Count) orphaned processes" -ForegroundColor Gray
} else {
    Write-Host "   No orphaned processes found" -ForegroundColor Gray
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    THUNAI CULTURE OS - START ALL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Project Directory: $scriptDir" -ForegroundColor Gray
Write-Host ""

# Function to find Python executable
function Find-PythonExecutable {
    $pythonPaths = @("python", "python3", "py")
    
    foreach ($pythonCmd in $pythonPaths) {
        try {
            $result = & $pythonCmd --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   Found Python: $pythonCmd ($result)" -ForegroundColor Gray
                return $pythonCmd
            }
        }
        catch {
            # Continue to next option
        }
    }
    
    Write-Host "   ❌ Python not found in PATH. Please install Python or add it to PATH." -ForegroundColor Red
    return $null
}

# Start Python API (thunai-api) in background
Write-Host "Starting Python API (thunai-api)..." -ForegroundColor Green
$apiWorkingDir = "$scriptDir\thunai-api\thunai-api"

if (Test-Path $apiWorkingDir) {
    Write-Host "   Working Directory: $apiWorkingDir" -ForegroundColor Gray
    
    # Find Python executable
    $pythonCmd = Find-PythonExecutable
    
    if ($pythonCmd) {
        # Check if virtual environment exists and try to use it
        $venvActivateScript = "$apiWorkingDir\.venv\Scripts\Activate.ps1"
        
        if (Test-Path $venvActivateScript) {
            Write-Host "   Using virtual environment" -ForegroundColor Gray
            $startCommand = "cd '$apiWorkingDir'; try { & '$venvActivateScript'; $pythonCmd main.py } catch { $pythonCmd main.py }"
        } else {
            Write-Host "   Using global Python installation" -ForegroundColor Gray
            $startCommand = "cd '$apiWorkingDir'; $pythonCmd main.py"
        }
        
        # Start Python API using background job with proper session state
        $pythonJob = Start-Job -Name "PythonAPI" -ScriptBlock {
            param($workDir, $pythonCmd, $useVenv, $venvPath)
            Set-Location $workDir
            
            if ($useVenv -and (Test-Path $venvPath)) {
                try {
                    # Try to activate virtual environment
                    & $venvPath
                    & $pythonCmd main.py
                } catch {
                    # Fallback to global Python
                    & $pythonCmd main.py
                }
            } else {
                & $pythonCmd main.py
            }
        } -ArgumentList $apiWorkingDir, $pythonCmd, (Test-Path $venvActivateScript), $venvActivateScript
        
        $pythonProcess = @{ Id = $pythonJob.Id; Type = "Job" }
        
        Write-Host "   Python API started (Job ID: $($pythonProcess.Id))" -ForegroundColor Green
        
        # Wait a moment for the API to start
        Start-Sleep -Seconds 3
    } else {
        Write-Host "   Cannot start Python API - Python not found" -ForegroundColor Red
    }
} else {
    Write-Host "   Directory not found: $apiWorkingDir" -ForegroundColor Red
}

Write-Host ""

# Function to find Node.js and npm
function Find-NodeExecutables {
    try {
        $nodeVersion = & node --version 2>$null
        $npmVersion = & npm --version 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   Found Node.js: $nodeVersion, npm: $npmVersion" -ForegroundColor Gray
            return $true
        }
    }
    catch {
        # Continue
    }
    
    Write-Host "   ❌ Node.js/npm not found in PATH. Please install Node.js or add it to PATH." -ForegroundColor Red
    return $false
}

# Start Node.js Bot (Culture OS) in background  
Write-Host "Starting Node.js Bot (Culture OS)..." -ForegroundColor Green
$botWorkingDir = "$scriptDir\Culture OS"

if (Test-Path $botWorkingDir) {
    Write-Host "   Working Directory: $botWorkingDir" -ForegroundColor Gray
    
    # Check if Node.js and npm are available
    $nodeAvailable = Find-NodeExecutables
    
    if ($nodeAvailable) {
        # Check if node_modules exists, if not suggest npm install
        $nodeModulesPath = "$botWorkingDir\node_modules"
        if (-not (Test-Path $nodeModulesPath)) {
            Write-Host "   ⚠️ node_modules not found. You may need to run 'npm install' first." -ForegroundColor Yellow
        }
        
            # Start Node.js Bot using background job
            $nodeJob = Start-Job -Name "NodeBot" -ScriptBlock {
                param($workDir)
                Set-Location $workDir
                npm start
            } -ArgumentList $botWorkingDir
            
            $nodeProcess = @{ Id = $nodeJob.Id; Type = "Job" }
            
            Write-Host "   Node.js Bot started (Job ID: $($nodeProcess.Id))" -ForegroundColor Green        # Wait a moment for the bot to start
        Start-Sleep -Seconds 3
    } else {
        Write-Host "   Cannot start Node.js Bot - Node.js/npm not found" -ForegroundColor Red
    }
} else {
    Write-Host "   Directory not found: $botWorkingDir" -ForegroundColor Red
}

Write-Host ""

# Start Teams App Tester (Playground) in background
Write-Host "Starting Teams Playground (teamsapptester)..." -ForegroundColor Green

$playgroundWorkingDir = "$scriptDir\Culture OS\devTools\teamsapptester"
if (Test-Path $playgroundWorkingDir) {
    Write-Host "   Working Directory: $playgroundWorkingDir" -ForegroundColor Gray
    
    # Check if npx is available (comes with npm)
    try {
        $npxVersion = & npx --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   Found npx: $npxVersion" -ForegroundColor Gray
            
            # Start Teams App Tester using background job
            $playgroundJob = Start-Job -Name "TeamsPlayground" -ScriptBlock {
                param($workDir)
                Set-Location $workDir
                npx @microsoft/teams-app-test-tool
            } -ArgumentList $playgroundWorkingDir
            
            $playgroundProcess = @{ Id = $playgroundJob.Id; Type = "Job" }
            
            Write-Host "   Teams Playground started (Job ID: $($playgroundProcess.Id))" -ForegroundColor Green
            
            # Wait a moment for the playground to start
            Start-Sleep -Seconds 3
        } else {
            Write-Host "   ❌ npx not found. Please install Node.js/npm." -ForegroundColor Red
        }
    }
    catch {
        Write-Host "   ❌ npx not found. Please install Node.js/npm." -ForegroundColor Red
    }
} else {
    Write-Host "   Directory not found: $playgroundWorkingDir" -ForegroundColor Red
}

Write-Host ""
Write-Host "All services startup attempted!" -ForegroundColor Green
Write-Host ""
Write-Host "Services should be running on:" -ForegroundColor White
Write-Host "  • Python API: http://localhost:8000" -ForegroundColor Gray
Write-Host "  • Node.js Bot: http://localhost:3978" -ForegroundColor Gray
Write-Host "  • Teams Playground: http://localhost:56150" -ForegroundColor Gray
Write-Host ""
Write-Host "Write-Host "Job IDs:" -ForegroundColor White
if ($pythonProcess) { Write-Host "  • Python API: $($pythonProcess.Id)" -ForegroundColor Gray }
if ($nodeProcess) { Write-Host "  • Node.js Bot: $($nodeProcess.Id)" -ForegroundColor Gray }
if ($playgroundProcess) { Write-Host "  • Teams Playground: $($playgroundProcess.Id)" -ForegroundColor Gray }
Write-Host ""
Write-Host "Check services:" -ForegroundColor Yellow
Write-Host "  • API Health: http://localhost:8000/health" -ForegroundColor Gray
Write-Host "  • API Docs: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "  • Teams Playground: http://localhost:56150" -ForegroundColor Gray
Write-Host ""
Write-Host "Management commands:" -ForegroundColor Yellow
Write-Host "  Get-Job                           # View all background jobs" -ForegroundColor Gray
Write-Host "  Receive-Job -Id [JobId]           # View job output" -ForegroundColor Gray
Write-Host "  Receive-Job -Id [JobId] -Keep     # View output without removing it" -ForegroundColor Gray
Write-Host "  Stop-Job -Id [JobId]              # Stop a specific job" -ForegroundColor Gray
Write-Host "  Remove-Job -Id [JobId]            # Remove completed job" -ForegroundColor Gray
Write-Host "  .\stop-all.ps1                    # Stop all services" -ForegroundColor Gray
Write-Host ""

# Verify services are starting (basic port check after a delay)
Write-Host "Waiting for services to start..." -ForegroundColor Blue
Start-Sleep -Seconds 5

# Check if ports are listening
$apiRunning = Test-NetConnection -ComputerName "localhost" -Port 8000 -WarningAction SilentlyContinue -InformationLevel Quiet
$botRunning = Test-NetConnection -ComputerName "localhost" -Port 3978 -WarningAction SilentlyContinue -InformationLevel Quiet

Write-Host "Service Status:" -ForegroundColor White
if ($apiRunning) {
    Write-Host "  ✅ Python API is responding on port 8000" -ForegroundColor Green
} else {
    Write-Host "  ❌ Python API not responding on port 8000" -ForegroundColor Red
}

if ($botRunning) {
    Write-Host "  ✅ Node.js Bot is responding on port 3978" -ForegroundColor Green
} else {
    Write-Host "  ❌ Node.js Bot not responding on port 3978" -ForegroundColor Red
}

Write-Host ""