@echo off
echo ========================================
echo    STOPPING THUNAI CULTURE OS SERVICES
echo ========================================
echo.

echo Stopping Python API (uvicorn)...
taskkill /f /im python.exe 2>nul
taskkill /f /im uvicorn.exe 2>nul

echo Stopping Node.js Bot...
taskkill /f /im node.exe 2>nul

echo Stopping Teams App Tester...
taskkill /f /im teamsapptester.exe 2>nul

echo Closing service windows...
taskkill /f /fi "WindowTitle eq Python API*" 2>nul
taskkill /f /fi "WindowTitle eq Node Bot*" 2>nul
taskkill /f /fi "WindowTitle eq Teams Playground*" 2>nul

echo.
echo ========================================
echo All services stopped successfully!
echo ========================================
echo.
echo Press any key to continue...
pause >nul