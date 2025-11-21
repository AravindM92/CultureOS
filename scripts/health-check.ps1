# Health check script for CultureOS services

$services = @(
    @{ Name = "ThunAI API"; Url = "http://localhost:8000/" },
    @{ Name = "WFO Prediction API"; Url = "http://localhost:8001/" },
    @{ Name = "Node.js Bot"; Url = "http://localhost:3978/" },
    @{ Name = "Teams Playground"; Url = "http://localhost:56150/" }
)

foreach ($service in $services) {
    Write-Host "Checking $($service.Name) at $($service.Url)..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $service.Url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "$($service.Name) is UP" -ForegroundColor Green
        } else {
            Write-Host "$($service.Name) returned status $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "$($service.Name) is DOWN or unreachable" -ForegroundColor Red
    }
}
