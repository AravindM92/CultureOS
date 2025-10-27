@echo off
echo ========================================
echo    THUNAI CULTURE OS - TEST SUITE
echo ========================================
echo.
echo Running comprehensive tests...
echo.

:: Run the PowerShell test script
powershell -ExecutionPolicy Bypass -File "test-all.ps1"

echo.
echo Testing completed.
pause