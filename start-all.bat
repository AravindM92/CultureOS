@echo off
echo ========================================
echo    THUNAI CULTURE OS - START ALL
echo ========================================
echo.

:: Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

:: Run the PowerShell start script from the same directory
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%start-all.ps1"

echo.
echo Services started in background. You can continue using the terminal.
echo Use "Get-Job" to check service status.
echo Use ".\stop-all.bat" to stop all services.