# DevOps & Configuration Implementation - CultureOS

## Overview
Complete DevOps setup for CultureOS including automation scripts, environment configuration, Teams app manifest, deployment configurations, and operational procedures.

## 🏗️ **Project Structure & Configuration**

### **Root Level Files**
```
CultureOS/
├── package.json              # Root package management
├── .env.template            # Environment variables template
├── .gitignore              # Git ignore patterns
├── README.md               # Project documentation
├── database_complete.sql   # Database schema
├── scripts/               # PowerShell automation scripts
│   ├── setup.ps1         # Initial environment setup
│   ├── start-all.ps1     # Start all services
│   ├── stop-all.ps1      # Stop all services  
│   ├── test-all.ps1      # Run all tests
│   ├── build-all.ps1     # Build all components
│   └── deploy.ps1        # Deployment script
├── Culture OS/            # Teams Bot (Node.js)
└── thunai-api/           # FastAPI Backend (Python)
```

## 🔧 **Configuration Files**

### **1. Root Package.json**
```json
{
  "name": "cultureos",
  "version": "1.0.0",
  "description": "Microsoft Teams culture management bot with AI-powered moment detection",
  "main": "index.js",
  "scripts": {
    "setup": "powershell -ExecutionPolicy Bypass -File scripts/setup.ps1",
    "start": "powershell -ExecutionPolicy Bypass -File scripts/start-all.ps1",
    "stop": "powershell -ExecutionPolicy Bypass -File scripts/stop-all.ps1",
    "test": "powershell -ExecutionPolicy Bypass -File scripts/test-all.ps1",
    "build": "powershell -ExecutionPolicy Bypass -File scripts/build-all.ps1",
    "deploy": "powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1",
    "bot": "cd \"Culture OS\" && npm start",
    "api": "cd thunai-api/thunai-api && python -m uvicorn main:app --reload --port 8000",
    "db:init": "sqlite3 thunai_culture.db < database_complete.sql",
    "db:check": "python scripts/check_db.py",
    "logs": "powershell -ExecutionPolicy Bypass -File scripts/view-logs.ps1"
  },
  "keywords": [
    "microsoft-teams",
    "bot",
    "culture",
    "celebrations",
    "ai",
    "groq",
    "fastapi",
    "sqlite"
  ],
  "author": "CultureOS Team",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0",
    "python": ">=3.9"
  }
}
```

### **2. Environment Template (.env.template)**
```bash
# ==========================================
# CULTUREOS ENVIRONMENT CONFIGURATION
# ==========================================

# ==========================================
# TEAMS BOT CONFIGURATION
# ==========================================
CLIENT_ID=your-microsoft-app-id-here
CLIENT_SECRET=your-microsoft-app-secret-here  
TENANT_ID=your-tenant-id-here
BOT_TYPE=UserAssignedMsi

# Bot Configuration
PORT=3978
EMAIL_DOMAIN=company.com
ADMIN_TEAMS_ID=admin-teams-user-id-here
NODE_ENV=development
LOG_LEVEL=info

# ==========================================
# GROQ AI CONFIGURATION  
# ==========================================
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL_NAME=llama-3.1-8b-instant

# ==========================================
# FASTAPI BACKEND CONFIGURATION
# ==========================================
API_BASE_URL=http://127.0.0.1:8000/api/v1
API_HEALTH_URL=http://127.0.0.1:8000/health
DATABASE_URL=sqlite:///./thunai_culture.db

# API Configuration
APP_NAME=Thunai Culture OS API
ALLOWED_ORIGINS=["*"]
ENABLE_DEBUG_LOGS=true
HOST=0.0.0.0
API_PORT=8000

# ==========================================
# DEVELOPMENT CONFIGURATION
# ==========================================
DEVELOPMENT_MODE=true
ENABLE_MOCK_RESPONSES=false
DEBUG_STORAGE=false
VERBOSE_LOGGING=true

# ==========================================
# PRODUCTION CONFIGURATION (Optional)
# ==========================================
# PRODUCTION_BOT_ENDPOINT=https://your-production-domain.com
# PRODUCTION_API_ENDPOINT=https://api.your-production-domain.com
# SSL_CERT_PATH=/path/to/ssl/cert
# SSL_KEY_PATH=/path/to/ssl/key
```

### **3. Git Ignore (.gitignore)**
```gitignore
# ==========================================
# CULTUREOS GITIGNORE
# ==========================================

# Environment variables
.env
.env.local
.env.production
.env.staging

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Dependencies
node_modules/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
pip-log.txt
pip-delete-this-directory.txt

# Database
*.db
*.sqlite
*.sqlite3
thunai_culture.db*
database_backup_*.sql

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
desktop.ini

# Build outputs
dist/
build/
*.tsbuildinfo

# Package files
*.tgz
*.tar.gz

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Temporary folders
tmp/
temp/
.tmp/

# Teams app packages
*.zip
appPackage/build/

# Python virtual environments
venv/
env/
ENV/
.venv/
.env/

# FastAPI
.pytest_cache/
.coverage
htmlcov/

# PowerShell
*.ps1xml
```

## ⚙️ **PowerShell Automation Scripts**

### **1. Setup Script (scripts/setup.ps1)**
```powershell
#!/usr/bin/env pwsh
# ==========================================
# CULTUREOS SETUP SCRIPT
# ==========================================

param(
    [switch]$Force,
    [switch]$SkipDependencies,
    [switch]$Verbose
)

Write-Host "🚀 CultureOS Environment Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Set error handling
$ErrorActionPreference = "Stop"

function Write-Status {
    param([string]$Message, [string]$Color = "Green")
    Write-Host "✅ $Message" -ForegroundColor $Color
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

try {
    # Check prerequisites
    Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
    
    # Check Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    }
    $nodeVersion = node --version
    Write-Status "Node.js version: $nodeVersion"
    
    # Check Python
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        throw "Python is not installed. Please install Python 3.9+ from https://python.org/"
    }
    $pythonVersion = python --version
    Write-Status "Python version: $pythonVersion"
    
    # Check SQLite
    if (-not (Get-Command sqlite3 -ErrorAction SilentlyContinue)) {
        Write-Host "⚠️  SQLite3 not found in PATH. Installing via PowerShell..." -ForegroundColor Yellow
        # Note: In production, might need manual SQLite installation
    }
    
    # Create directory structure if missing
    Write-Host "📁 Setting up directory structure..." -ForegroundColor Yellow
    
    $directories = @(
        "scripts",
        "logs", 
        "backup",
        "Culture OS/src/app",
        "Culture OS/appPackage",
        "thunai-api/thunai-api/app"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Status "Created directory: $dir"
        }
    }
    
    # Copy environment template
    Write-Host "🔧 Setting up environment configuration..." -ForegroundColor Yellow
    
    if (-not (Test-Path ".env") -or $Force) {
        if (Test-Path ".env.template") {
            Copy-Item ".env.template" ".env"
            Write-Status "Created .env file from template"
            Write-Host "⚠️  Please edit .env file with your configuration values!" -ForegroundColor Yellow
        }
    }
    
    # Install Node.js dependencies
    if (-not $SkipDependencies) {
        Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
        
        Push-Location "Culture OS"
        try {
            npm install
            Write-Status "Node.js dependencies installed"
        }
        finally {
            Pop-Location
        }
        
        # Install Python dependencies
        Write-Host "🐍 Installing Python dependencies..." -ForegroundColor Yellow
        
        Push-Location "thunai-api/thunai-api"
        try {
            pip install -r requirements.txt
            Write-Status "Python dependencies installed"
        }
        finally {
            Pop-Location
        }
    }
    
    # Initialize database
    Write-Host "🗄️ Initializing database..." -ForegroundColor Yellow
    
    if (Test-Path "database_complete.sql") {
        if (Test-Path "thunai_culture.db") {
            if ($Force) {
                Remove-Item "thunai_culture.db" -Force
                Write-Status "Removed existing database"
            } else {
                Write-Host "⚠️  Database already exists. Use -Force to recreate." -ForegroundColor Yellow
            }
        }
        
        if (-not (Test-Path "thunai_culture.db")) {
            sqlite3 thunai_culture.db ".read database_complete.sql"
            Write-Status "Database initialized with schema and sample data"
        }
    }
    
    # Create log directory
    if (-not (Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" -Force | Out-Null
        Write-Status "Created logs directory"
    }
    
    Write-Host "`n🎉 Setup completed successfully!" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Edit .env file with your configuration" -ForegroundColor White
    Write-Host "2. Run 'npm start' to start all services" -ForegroundColor White
    Write-Host "3. Test the bot in Teams or Bot Emulator" -ForegroundColor White
    
} catch {
    Write-Error "Setup failed: $($_.Exception.Message)"
    exit 1
}
```

### **2. Start All Services (scripts/start-all.ps1)**
```powershell
#!/usr/bin/env pwsh
# ==========================================
# CULTUREOS START ALL SERVICES
# ==========================================

param(
    [switch]$Background,
    [switch]$Verbose
)

Write-Host "🚀 Starting CultureOS Services" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Set error handling
$ErrorActionPreference = "Continue"

function Write-Status {
    param([string]$Message, [string]$Color = "Green")
    Write-Host "✅ $Message" -ForegroundColor $Color
}

function Start-ServiceJob {
    param(
        [string]$Name,
        [string]$Command,
        [string]$WorkingDirectory,
        [string]$LogFile
    )
    
    try {
        $job = Start-Job -Name $Name -ScriptBlock {
            param($cmd, $workDir, $logFile)
            Set-Location $workDir
            Invoke-Expression $cmd 2>&1 | Tee-Object -FilePath $logFile
        } -ArgumentList $Command, $WorkingDirectory, $LogFile
        
        Write-Status "$Name started (Job ID: $($job.Id))"
        return $job
    }
    catch {
        Write-Host "❌ Failed to start $Name`: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

try {
    # Create logs directory
    if (-not (Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" -Force | Out-Null
    }
    
    # Check if services are already running
    Write-Host "🔍 Checking for existing services..." -ForegroundColor Yellow
    
    $existingJobs = Get-Job | Where-Object { $_.Name -like "*CultureOS*" -or $_.Name -like "*API*" -or $_.Name -like "*Bot*" }
    if ($existingJobs) {
        Write-Host "⚠️  Found existing service jobs. Stopping them first..." -ForegroundColor Yellow
        $existingJobs | Stop-Job -PassThru | Remove-Job
    }
    
    # Check if ports are available
    $botPort = 3978
    $apiPort = 8000
    
    $portCheck = @(
        @{Port = $botPort; Service = "Teams Bot"},
        @{Port = $apiPort; Service = "FastAPI"}
    )
    
    foreach ($check in $portCheck) {
        $connection = Test-NetConnection -ComputerName localhost -Port $check.Port -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($connection) {
            Write-Host "⚠️  Port $($check.Port) is already in use ($($check.Service))" -ForegroundColor Yellow
        }
    }
    
    # Start FastAPI backend
    Write-Host "🐍 Starting FastAPI backend..." -ForegroundColor Yellow
    
    $apiJob = Start-ServiceJob -Name "CultureOS-API" -Command "python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0" -WorkingDirectory "thunai-api/thunai-api" -LogFile "logs/api.log"
    
    if ($apiJob) {
        # Wait a moment for API to start
        Start-Sleep -Seconds 3
        
        # Check API health
        try {
            $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method GET -TimeoutSec 5
            if ($health.status -eq "healthy") {
                Write-Status "FastAPI backend is healthy"
            }
        }
        catch {
            Write-Host "⚠️  API health check failed, but service may still be starting..." -ForegroundColor Yellow
        }
    }
    
    # Start Teams Bot
    Write-Host "🤖 Starting Teams Bot..." -ForegroundColor Yellow
    
    $botJob = Start-ServiceJob -Name "CultureOS-Bot" -Command "npm start" -WorkingDirectory "Culture OS" -LogFile "logs/bot.log"
    
    if ($botJob) {
        Start-Sleep -Seconds 2
        Write-Status "Teams Bot started"
    }
    
    # Display service status
    Write-Host "`n📊 Service Status:" -ForegroundColor Cyan
    
    $jobs = Get-Job | Where-Object { $_.Name -like "*CultureOS*" }
    foreach ($job in $jobs) {
        $status = if ($job.State -eq "Running") { "✅ Running" } else { "❌ $($job.State)" }
        Write-Host "  $($job.Name): $status" -ForegroundColor $(if ($job.State -eq "Running") { "Green" } else { "Red" })
    }
    
    # Service URLs
    Write-Host "`n🌐 Service URLs:" -ForegroundColor Cyan
    Write-Host "  Teams Bot: http://localhost:3978" -ForegroundColor White
    Write-Host "  FastAPI Docs: http://localhost:8000/docs" -ForegroundColor White
    Write-Host "  API Health: http://localhost:8000/health" -ForegroundColor White
    
    # Log file locations
    Write-Host "`n📝 Log Files:" -ForegroundColor Cyan
    Write-Host "  Bot Logs: logs/bot.log" -ForegroundColor White
    Write-Host "  API Logs: logs/api.log" -ForegroundColor White
    
    if (-not $Background) {
        Write-Host "`n🎯 Services are running. Press Ctrl+C to stop all services." -ForegroundColor Yellow
        Write-Host "Or run 'npm run stop' to stop services from another terminal." -ForegroundColor White
        
        try {
            # Keep script running and monitor jobs
            while ($true) {
                Start-Sleep -Seconds 5
                $runningJobs = Get-Job | Where-Object { $_.Name -like "*CultureOS*" -and $_.State -eq "Running" }
                if ($runningJobs.Count -eq 0) {
                    Write-Host "`n⚠️  All services have stopped." -ForegroundColor Yellow
                    break
                }
            }
        }
        catch {
            Write-Host "`n🛑 Stopping all services..." -ForegroundColor Yellow
            & "scripts/stop-all.ps1"
        }
    } else {
        Write-Host "`n✅ All services started in background mode." -ForegroundColor Green
        Write-Host "Use 'Get-Job' to monitor services or 'npm run stop' to stop them." -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Failed to start services: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
```

### **3. Stop All Services (scripts/stop-all.ps1)**
```powershell
#!/usr/bin/env pwsh
# ==========================================
# CULTUREOS STOP ALL SERVICES
# ==========================================

Write-Host "🛑 Stopping CultureOS Services" -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow

try {
    # Stop PowerShell jobs
    Write-Host "Stopping PowerShell jobs..." -ForegroundColor Gray
    
    $jobs = Get-Job | Where-Object { 
        $_.Name -like "*CultureOS*" -or 
        $_.Name -like "*API*" -or 
        $_.Name -like "*Bot*" 
    }
    
    if ($jobs) {
        foreach ($job in $jobs) {
            Write-Host "  Stopping job: $($job.Name)" -ForegroundColor White
            Stop-Job $job -PassThru | Remove-Job
        }
        Write-Host "✅ PowerShell jobs stopped" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  No PowerShell jobs found" -ForegroundColor Cyan
    }
    
    # Stop processes by port
    Write-Host "Checking for processes on known ports..." -ForegroundColor Gray
    
    $ports = @(3978, 8000)
    foreach ($port in $ports) {
        $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
                   Select-Object -First 1 | 
                   ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
        
        if ($process) {
            Write-Host "  Stopping process on port $port`: $($process.ProcessName)" -ForegroundColor White
            Stop-Process -Id $process.Id -Force
            Write-Host "✅ Stopped process on port $port" -ForegroundColor Green
        }
    }
    
    # Stop Node.js processes
    Write-Host "Stopping Node.js processes..." -ForegroundColor Gray
    
    $nodeProcesses = Get-Process | Where-Object { 
        $_.ProcessName -eq "node" -and 
        $_.CommandLine -like "*Culture*" 
    }
    
    foreach ($proc in $nodeProcesses) {
        Write-Host "  Stopping Node.js process: $($proc.Id)" -ForegroundColor White
        Stop-Process -Id $proc.Id -Force
    }
    
    # Stop Python processes  
    Write-Host "Stopping Python processes..." -ForegroundColor Gray
    
    $pythonProcesses = Get-Process | Where-Object { 
        $_.ProcessName -eq "python" -and 
        $_.CommandLine -like "*uvicorn*" 
    }
    
    foreach ($proc in $pythonProcesses) {
        Write-Host "  Stopping Python process: $($proc.Id)" -ForegroundColor White
        Stop-Process -Id $proc.Id -Force
    }
    
    Write-Host "`n✅ All CultureOS services stopped successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error stopping services: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to manually stop processes using Task Manager." -ForegroundColor Yellow
}
```

### **4. Test All Script (scripts/test-all.ps1)**
```powershell
#!/usr/bin/env pwsh
# ==========================================
# CULTUREOS COMPREHENSIVE TEST SUITE
# ==========================================

Write-Host "🧪 CultureOS Test Suite" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

$global:testResults = @()

function Test-Component {
    param(
        [string]$Name,
        [scriptblock]$TestBlock
    )
    
    Write-Host "`n🔍 Testing $Name..." -ForegroundColor Yellow
    
    try {
        $result = & $TestBlock
        if ($result) {
            Write-Host "✅ $Name - PASSED" -ForegroundColor Green
            $global:testResults += @{Name = $Name; Status = "PASSED"; Error = $null}
        } else {
            Write-Host "❌ $Name - FAILED" -ForegroundColor Red
            $global:testResults += @{Name = $Name; Status = "FAILED"; Error = "Test returned false"}
        }
    }
    catch {
        Write-Host "❌ $Name - ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $global:testResults += @{Name = $Name; Status = "ERROR"; Error = $_.Exception.Message}
    }
}

try {
    # Test 1: Database Connectivity
    Test-Component "Database Connectivity" {
        if (-not (Test-Path "thunai_culture.db")) {
            throw "Database file not found"
        }
        
        $result = sqlite3 thunai_culture.db "SELECT COUNT(*) FROM users;"
        $userCount = [int]$result
        
        if ($userCount -gt 0) {
            Write-Host "    Database has $userCount users" -ForegroundColor Gray
            return $true
        }
        return $false
    }
    
    # Test 2: FastAPI Health
    Test-Component "FastAPI Backend" {
        try {
            $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method GET -TimeoutSec 10
            if ($health.status -eq "healthy") {
                Write-Host "    API Status: $($health.status)" -ForegroundColor Gray
                return $true
            }
        }
        catch {
            # Try to start API if not running
            Write-Host "    API not running, attempting to start..." -ForegroundColor Gray
            Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd 'thunai-api/thunai-api'; python -m uvicorn main:app --port 8000" -NoNewWindow
            Start-Sleep -Seconds 5
            
            $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method GET -TimeoutSec 5
            return $health.status -eq "healthy"
        }
        return $false
    }
    
    # Test 3: API Endpoints
    Test-Component "API Endpoints" {
        $endpoints = @(
            @{Url = "http://127.0.0.1:8000/api/v1/users"; Method = "GET"},
            @{Url = "http://127.0.0.1:8000/api/v1/moments"; Method = "GET"},
            @{Url = "http://127.0.0.1:8000/api/v1/greetings"; Method = "GET"}
        )
        
        $allPassed = $true
        foreach ($endpoint in $endpoints) {
            try {
                $response = Invoke-RestMethod -Uri $endpoint.Url -Method $endpoint.Method -TimeoutSec 5
                Write-Host "    $($endpoint.Url) - OK" -ForegroundColor Gray
            }
            catch {
                Write-Host "    $($endpoint.Url) - FAILED" -ForegroundColor Gray
                $allPassed = $false
            }
        }
        return $allPassed
    }
    
    # Test 4: Node.js Dependencies
    Test-Component "Node.js Dependencies" {
        Push-Location "Culture OS"
        try {
            $packageCheck = npm list --depth=0 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    All Node.js packages installed" -ForegroundColor Gray
                return $true
            }
            return $false
        }
        finally {
            Pop-Location
        }
    }
    
    # Test 5: Python Dependencies
    Test-Component "Python Dependencies" {
        Push-Location "thunai-api/thunai-api"
        try {
            $requirements = Get-Content "requirements.txt" | ForEach-Object { $_.Split('==')[0] }
            $allInstalled = $true
            
            foreach ($package in $requirements) {
                try {
                    python -c "import $package" 2>$null
                    if ($LASTEXITCODE -ne 0) {
                        $allInstalled = $false
                        break
                    }
                }
                catch {
                    $allInstalled = $false
                    break
                }
            }
            
            if ($allInstalled) {
                Write-Host "    All Python packages available" -ForegroundColor Gray
            }
            return $allInstalled
        }
        finally {
            Pop-Location
        }
    }
    
    # Test 6: Environment Configuration
    Test-Component "Environment Configuration" {
        if (-not (Test-Path ".env")) {
            throw ".env file not found"
        }
        
        $envContent = Get-Content ".env" -Raw
        $requiredVars = @("CLIENT_ID", "GROQ_API_KEY", "API_BASE_URL")
        $allPresent = $true
        
        foreach ($var in $requiredVars) {
            if ($envContent -notmatch "$var=") {
                Write-Host "    Missing: $var" -ForegroundColor Gray
                $allPresent = $false
            }
        }
        
        if ($allPresent) {
            Write-Host "    Required environment variables present" -ForegroundColor Gray
        }
        return $allPresent
    }
    
    # Test 7: Teams Bot Configuration  
    Test-Component "Teams Bot Configuration" {
        $manifestPath = "Culture OS/appPackage/manifest.json"
        if (Test-Path $manifestPath) {
            $manifest = Get-Content $manifestPath | ConvertFrom-Json
            if ($manifest.bots -and $manifest.bots.Count -gt 0) {
                Write-Host "    Teams manifest configured with bot" -ForegroundColor Gray
                return $true
            }
        }
        
        Write-Host "    Teams manifest not found or incomplete" -ForegroundColor Gray
        return $false
    }
    
    # Display results summary
    Write-Host "`n📊 Test Results Summary:" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Cyan
    
    $passed = ($global:testResults | Where-Object { $_.Status -eq "PASSED" }).Count
    $failed = ($global:testResults | Where-Object { $_.Status -eq "FAILED" }).Count  
    $errors = ($global:testResults | Where-Object { $_.Status -eq "ERROR" }).Count
    $total = $global:testResults.Count
    
    foreach ($result in $global:testResults) {
        $icon = switch ($result.Status) {
            "PASSED" { "✅" }
            "FAILED" { "❌" }
            "ERROR"  { "⚠️" }
        }
        $color = switch ($result.Status) {
            "PASSED" { "Green" }
            "FAILED" { "Red" }
            "ERROR"  { "Yellow" }
        }
        Write-Host "$icon $($result.Name): $($result.Status)" -ForegroundColor $color
        if ($result.Error) {
            Write-Host "    Error: $($result.Error)" -ForegroundColor Gray
        }
    }
    
    Write-Host "`nTest Summary: $passed passed, $failed failed, $errors errors out of $total total" -ForegroundColor Cyan
    
    if ($failed -eq 0 -and $errors -eq 0) {
        Write-Host "`n🎉 All tests passed! CultureOS is ready to use." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "`n⚠️  Some tests failed. Please check the configuration and try again." -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host "❌ Test suite failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
```

## 📱 **Teams App Manifest**

### **Teams App Package (Culture OS/appPackage/manifest.json)**
```json
{
    "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
    "manifestVersion": "1.16",
    "version": "1.0.0",
    "id": "{{TEAMS_APP_ID}}",
    "packageName": "com.cultureos.teamsbot",
    "developer": {
        "name": "CultureOS Team",
        "websiteUrl": "https://cultureos.com",
        "privacyUrl": "https://cultureos.com/privacy",
        "termsOfUseUrl": "https://cultureos.com/terms"
    },
    "icons": {
        "color": "color.png",
        "outline": "outline.png"
    },
    "name": {
        "short": "CultureOS",
        "full": "CultureOS - Team Culture Management Bot"
    },
    "description": {
        "short": "AI-powered bot that detects celebration moments and manages team culture",
        "full": "CultureOS automatically detects birthdays, work anniversaries, and achievements from team conversations, then orchestrates greeting collection workflows to strengthen team culture and engagement."
    },
    "accentColor": "#FFFFFF",
    "bots": [
        {
            "botId": "{{BOT_ID}}",
            "scopes": [
                "personal",
                "team",
                "groupchat"
            ],
            "supportsFiles": false,
            "isNotificationOnly": false
        }
    ],
    "permissions": [
        "identity",
        "messageTeamMembers"
    ],
    "validDomains": [
        "{{BOT_DOMAIN}}"
    ],
    "webApplicationInfo": {
        "id": "{{TEAMS_APP_ID}}",
        "resource": "https://RscBasedStoreApp"
    }
}
```

## 🚀 **Deployment Configurations**

### **Docker Support (Optional)**
```dockerfile
# Dockerfile.bot
FROM node:18-alpine
WORKDIR /app
COPY Culture\ OS/package*.json ./
RUN npm install
COPY Culture\ OS/ .
EXPOSE 3978
CMD ["npm", "start"]
```

```dockerfile
# Dockerfile.api  
FROM python:3.9-slim
WORKDIR /app
COPY thunai-api/thunai-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY thunai-api/thunai-api/ .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **Docker Compose (docker-compose.yml)**
```yaml
version: '3.8'

services:
  cultureos-bot:
    build:
      context: .
      dockerfile: Dockerfile.bot
    ports:
      - "3978:3978"
    environment:
      - CLIENT_ID=${CLIENT_ID}
      - CLIENT_SECRET=${CLIENT_SECRET}
      - TENANT_ID=${TENANT_ID}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - API_BASE_URL=http://cultureos-api:8000/api/v1
    depends_on:
      - cultureos-api
    networks:
      - cultureos-network

  cultureos-api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./thunai_culture.db
      - ALLOWED_ORIGINS=["*"]
    volumes:
      - ./thunai_culture.db:/app/thunai_culture.db
    networks:
      - cultureos-network

networks:
  cultureos-network:
    driver: bridge
```

---
**Implementation Complete**: You now have comprehensive prompts for building the entire CultureOS system from scratch, including all components, configurations, and automation scripts.