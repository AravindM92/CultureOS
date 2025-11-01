@echo off
echo ========================================
echo    STOPPING THUNAI CULTURE OS SERVICES
echo ========================================
echo.

echo Launching PowerShell stop script...
echo.

:: Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

:: Run the PowerShell stop script from the same directory
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%stop-all.ps1"

echo.
echo Stop script completed.
echo All services stopped. Terminal is ready for new commands.