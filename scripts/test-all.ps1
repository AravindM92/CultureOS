# Thunai Culture OS - Comprehensive Test Suite

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    THUNAI CULTURE OS - TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: ThunAI API Health Check
Write-Host "🔍 Test 1: ThunAI API Health Check" -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method GET
    Write-Host "✅ ThunAI API Health: $($response.status)" -ForegroundColor Green
    Write-Host "   Database: $($response.database)" -ForegroundColor White
} catch {
    Write-Host "❌ ThunAI API Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 1b: WFO API Health Check
Write-Host "🔍 Test 1b: WFO API Health Check" -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8001/health" -Method GET
    Write-Host "✅ WFO API Health: $($response.status)" -ForegroundColor Green
    Write-Host "   Database: $($response.database)" -ForegroundColor White
} catch {
    Write-Host "❌ WFO API Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: ThunAI API Endpoints
Write-Host "🔍 Test 2: ThunAI API Endpoints" -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Gray
$endpoints = @(
    @{Name="Users"; Url="http://127.0.0.1:8000/users/"},
    @{Name="Moments"; Url="http://127.0.0.1:8000/moments/"},
    @{Name="Greetings"; Url="http://127.0.0.1:8000/greetings/"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri $endpoint.Url -Method GET
        Write-Host "✅ $($endpoint.Name): OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($endpoint.Name): FAILED" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2b: WFO API Endpoints
Write-Host "🔍 Test 2b: WFO API Endpoints" -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Gray
$wfoEndpoints = @(
    @{Name="WFO Availability Health"; Url="http://127.0.0.1:8001/api/v1/availability/health"},
    @{Name="WFO Predictions Health"; Url="http://127.0.0.1:8001/api/v1/predictions/health"}
)

foreach ($endpoint in $wfoEndpoints) {
    try {
        $response = Invoke-RestMethod -Uri $endpoint.Url -Method GET
        Write-Host "✅ $($endpoint.Name): OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($endpoint.Name): FAILED" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Bot Connection
Write-Host "🔍 Test 3: Bot Connection" -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $botTest = Test-NetConnection -ComputerName "localhost" -Port 3978 -WarningAction SilentlyContinue
    if ($botTest.TcpTestSucceeded) {
        Write-Host "✅ Bot Port 3978: ACCESSIBLE" -ForegroundColor Green
    } else {
        Write-Host "❌ Bot Port 3978: NOT ACCESSIBLE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Bot Connection Test Failed" -ForegroundColor Red
}
Write-Host ""

# Test 4: Groq API Test
Write-Host "🔍 Test 4: Groq API Test" -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $scriptDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
    Set-Location "$scriptDir\thunai-bot\tests"
    $groqResult = node test-groq.js 2>&1
    if ($groqResult -like "*SUCCESS*") {
        Write-Host "✅ Groq API: WORKING" -ForegroundColor Green
    } else {
        Write-Host "❌ Groq API: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($groqResult -join ' ')" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Groq API Test: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: API Client Integration
Write-Host "🔍 Test 5: API Client Integration" -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $apiClientResult = node test-api-client.js 2>&1
    if ($apiClientResult -like "*SUCCESS*") {
        Write-Host "✅ API Client: WORKING" -ForegroundColor Green
    } else {
        Write-Host "❌ API Client: FAILED" -ForegroundColor Red
        Write-Host "   Details: $($apiClientResult -join ' ')" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ API Client Test: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Moments Workflow
Write-Host "🔍 Test 6: Moments Workflow" -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $momentData = @{
        celebrant_name = "Test User"
        event_type = "birthday"
        event_date = "2024-12-25"
        description = "Test moment for system validation"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/moments/" -Method POST -Body $momentData -ContentType "application/json"
    Write-Host "✅ Moment Creation: SUCCESS" -ForegroundColor Green
    Write-Host "   Created moment ID: $($response.id)" -ForegroundColor White
} catch {
    Write-Host "❌ Moment Creation: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: WFO Workflow Integration
Write-Host "🔍 Test 7: WFO Workflow Integration" -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Gray

# Test 7a: WFO Check Endpoint
Write-Host "  7a: Testing WFO Data Check..." -ForegroundColor Cyan
try {
    $checkResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8001/api/v1/availability/check/test_user?week_start_date=2025-11-11" -Method GET
    Write-Host "✅ WFO Check: SUCCESS" -ForegroundColor Green
    Write-Host "   Collection needed: $($checkResponse.collection_needed)" -ForegroundColor White
    Write-Host "   Office days: $($checkResponse.office_days_count)/$($checkResponse.min_required)" -ForegroundColor White
} catch {
    Write-Host "❌ WFO Check: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7b: WFO Response Processing
Write-Host "  7b: Testing WFO Response Processing..." -ForegroundColor Cyan
try {
    $processBody = @{
        message = "Monday and Tuesday I will be in office"
        user_id = "test_user"
        week_start_date = "2025-11-11"
    } | ConvertTo-Json

    $processResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8001/api/v1/availability/process" -Method POST -Body $processBody -ContentType "application/json"
    Write-Host "✅ WFO Processing: SUCCESS" -ForegroundColor Green
    Write-Host "   Office days extracted: $($processResponse.extracted_data.office_days_count)" -ForegroundColor White
    Write-Host "   Compliance: $($processResponse.extracted_data.is_compliant)" -ForegroundColor White
} catch {
    Write-Host "❌ WFO Processing: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7c: WFO Data Persistence
Write-Host "  7c: Testing WFO Data Persistence..." -ForegroundColor Cyan
try {
    $saveBody = @{
        user_id = "test_user"
        week_start_date = "2025-11-11"
        monday_status = "office"
        tuesday_status = "office"
        wednesday_status = $null
        thursday_status = $null
        friday_status = $null
        office_days_count = 2
        is_compliant = $false
        collection_method = "daily"
    } | ConvertTo-Json

    $saveResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8001/api/v1/availability/save" -Method POST -Body $saveBody -ContentType "application/json"
    Write-Host "✅ WFO Save: SUCCESS" -ForegroundColor Green
    Write-Host "   Saved record ID: $($saveResponse.id)" -ForegroundColor White
} catch {
    Write-Host "❌ WFO Save: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Database Connectivity
Write-Host "🔍 Test 8: Database Connectivity" -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Gray
$scriptDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dbPath = "$scriptDir\database\thunai_culture.db"
if (Test-Path $dbPath) {
    Write-Host "✅ Database File: EXISTS" -ForegroundColor Green
    $dbSize = (Get-Item $dbPath).Length
    Write-Host "   Size: $([math]::Round($dbSize/1KB, 2)) KB" -ForegroundColor White
} else {
    Write-Host "❌ Database File: NOT FOUND" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=========================================" -ForegroundColor Green
Write-Host "    🧪 TEST SUMMARY" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

$totalTests = 8
$passedTests = 0

# Count passed tests (simplified - you could make this more sophisticated)
Write-Host "Total Tests Run: $totalTests" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test Interface Available: http://localhost:8080/test-interface.html" -ForegroundColor Cyan
Write-Host "📚 ThunAI API Documentation: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "📚 WFO API Documentation: http://127.0.0.1:8001/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "For interactive testing, use the test interface or Teams playground." -ForegroundColor Yellow
Write-Host ""