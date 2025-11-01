@echo off
echo ========================================
echo    THUNAI CULTURE OS - BUILD ALL
echo ========================================
echo.

:: Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

:: Run the PowerShell build script from the same directory
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%build-all.ps1"

echo.
echo Build completed. You can now start services with ".\start-all.bat"