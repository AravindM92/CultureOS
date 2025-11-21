# Get project root directory (parent of scripts folder)
$scriptDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "Starting CultureOS Services..." -ForegroundColor Green

# Start Python API (ThunAI) with venv activation
Write-Host "Starting ThunAI API (8000)..." -ForegroundColor Yellow
$apiJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location "$dir\thunai-api\thunai-api"
    & .\venv\Scripts\Activate.ps1
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
} -ArgumentList $scriptDir -Name "ThunaiAPI"

# Start WFO Prediction API
Write-Host "Starting WFO Prediction API (8001)..." -ForegroundColor Yellow
$wfoJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location "$dir\wfo-prediction-api"
    python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
} -ArgumentList $scriptDir -Name "WFOAPI"

# Start Node.js Bot
Write-Host "Starting Node.js Bot..." -ForegroundColor Yellow
$botJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location "$dir\thunai-bot"
    npm start
} -ArgumentList $scriptDir -Name "NodeBot"

# Start Teams Playground
Write-Host "Starting Teams Playground..." -ForegroundColor Yellow
$playgroundJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location "$dir\thunai-bot"
    npx teamsapptester start
} -ArgumentList $scriptDir -Name "TeamsPlayground"

Write-Host "All services started!" -ForegroundColor Green
Write-Host "Job IDs: ThunAI=$($apiJob.Id), WFO=$($wfoJob.Id), Bot=$($botJob.Id), Playground=$($playgroundJob.Id)" -ForegroundColor Gray

Start-Sleep -Seconds 3
Write-Host "Service Status:" -ForegroundColor White

# Check ThunAI API
try {
    $api = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($api.StatusCode -eq 200) { Write-Host "   ThunAI API (8000)" -ForegroundColor Green }
} catch { Write-Host "   ThunAI API (8000)" -ForegroundColor Red }

# Check WFO API
try {
    $wfo = Invoke-WebRequest -Uri "http://localhost:8001/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($wfo.StatusCode -eq 200) { Write-Host "   WFO API (8001)" -ForegroundColor Green }
} catch { Write-Host "   WFO API (8001)" -ForegroundColor Red }

# Check Bot
try {
    $bot = Invoke-WebRequest -Uri "http://localhost:3978/api/messages" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($bot.StatusCode -in @(200, 405)) { Write-Host "   Bot (3978)" -ForegroundColor Green }
} catch { Write-Host "   Bot (3978)" -ForegroundColor Red }
