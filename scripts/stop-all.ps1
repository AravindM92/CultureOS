# Thunai Culture OS - PowerShell Stop Script
# Stops all services and background jobs

Write-Host "========================================" -ForegroundColor Red
Write-Host "    STOPPING THUNAI CULTURE OS SERVICES" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Stop PowerShell background jobs
Write-Host "Stopping PowerShell background jobs..." -ForegroundColor Yellow
$jobs = Get-Job
if ($jobs) {
    $jobs | ForEach-Object {
        Write-Host "Stopping job: $($_.Name)" -ForegroundColor Yellow
        Stop-Job -Id $_.Id -ErrorAction SilentlyContinue
        Remove-Job -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
}

# Kill processes by name
Write-Host "Stopping Python processes..." -ForegroundColor Yellow
Stop-Process -Name "python" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "py" -Force -ErrorAction SilentlyContinue

Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Kill processes by port
Write-Host "Stopping processes on specific ports..." -ForegroundColor Yellow

# Stop port 8000 (ThunAI API)
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    $port8000 | ForEach-Object {
        Write-Host "Stopping process on port 8000 ThunAI API (PID: $($_.OwningProcess))" -ForegroundColor Yellow
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Stop port 8001 (WFO API)
$port8001 = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue
if ($port8001) {
    $port8001 | ForEach-Object {
        Write-Host "Stopping process on port 8001 WFO API (PID: $($_.OwningProcess))" -ForegroundColor Yellow
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Stop port 3978 (Bot)
$port3978 = Get-NetTCPConnection -LocalPort 3978 -ErrorAction SilentlyContinue
if ($port3978) {
    $port3978 | ForEach-Object {
        Write-Host "Stopping process on port 3978 (PID: $($_.OwningProcess))" -ForegroundColor Yellow
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Wait a moment for cleanup
Start-Sleep 3

# Verify cleanup
Write-Host ""
Write-Host "Verifying cleanup..." -ForegroundColor Blue

$remainingJobs = Get-Job -ErrorAction SilentlyContinue
if ($remainingJobs) {
    Write-Host "⚠️ Some background jobs still exist:" -ForegroundColor Yellow
    $remainingJobs | Format-Table Name, State -AutoSize
} else {
    Write-Host "✅ All background jobs stopped" -ForegroundColor Green
}

$port8000Active = Test-NetConnection -ComputerName "localhost" -Port 8000 -WarningAction SilentlyContinue
$port8001Active = Test-NetConnection -ComputerName "localhost" -Port 8001 -WarningAction SilentlyContinue
$port3978Active = Test-NetConnection -ComputerName "localhost" -Port 3978 -WarningAction SilentlyContinue

if (-not $port8000Active.TcpTestSucceeded) {
    Write-Host "✅ Port 8000 (ThunAI API) is free" -ForegroundColor Green
} else {
    Write-Host "⚠️ Port 8000 (ThunAI API) still in use" -ForegroundColor Yellow
}

if (-not $port8001Active.TcpTestSucceeded) {
    Write-Host "✅ Port 8001 (WFO API) is free" -ForegroundColor Green
} else {
    Write-Host "⚠️ Port 8001 (WFO API) still in use" -ForegroundColor Yellow
}

if (-not $port3978Active.TcpTestSucceeded) {
    Write-Host "✅ Port 3978 (Bot) is free" -ForegroundColor Green
} else {
    Write-Host "⚠️ Port 3978 (Bot) still in use" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    🛑 SERVICES STOPPED 🛑" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""