@echo off
echo ========================================
echo    THUNAI CULTURE OS - TEST SUITE
echo ========================================
echo.
echo Running comprehensive tests...
echo.

:: Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

:: Run the PowerShell test script from the same directory
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%test-all.ps1"

echo.
echo Testing completed. Terminal is ready for new commands.