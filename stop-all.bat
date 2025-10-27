@echo off@echo off

echo ========================================echo ========================================

echo    STOPPING THUNAI CULTURE OS SERVICESecho    STOPPING THUNAI CULTURE OS SERVICES

echo ========================================echo ========================================

echo.echo.

echo Launching PowerShell stop script...

:: Run the PowerShell stop scriptecho.

powershell -ExecutionPolicy Bypass -File "stop-all.ps1"

:: Run the PowerShell stop script

echo.powershell -ExecutionPolicy Bypass -File "stop-all.ps1"

pause
echo.
echo Stop script completed.
pause