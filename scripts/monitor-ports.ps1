# PowerShell script to monitor service ports and alert if unavailable
$ports = @(8000, 8001, 3978)
$interval = 10 # seconds

function Test-Port {
    param (
        [int]$Port
    )
    $tcp = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $tcp -ne $null
}

while ($true) {
    foreach ($port in $ports) {
        if (-not (Test-Port -Port $port)) {
            Write-Host "ALERT: Port $port is not active!" -ForegroundColor Red
        } else {
            Write-Host "Port $port is active." -ForegroundColor Green
        }
    }
    Start-Sleep -Seconds $interval
}
