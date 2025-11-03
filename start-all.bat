@echo off
echo ========================================
echo    THUNAI CULTURE OS - START ALL
echo ========================================
echo.

:: Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

:: Start Python API in background
echo Starting Python API on port 8000...
cd /d "%SCRIPT_DIR%thunai-api\thunai-api"
start /b python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

:: Start Node.js Bot in background
echo Starting Node.js Bot on port 3978...
cd /d "%SCRIPT_DIR%Culture OS"
start /b npm start

:: Start Teams Playground in background
echo Starting Teams Playground...
start /b npx teamsapptester start

echo.
echo ========================================
echo All services started in background!
echo - Python API: http://localhost:8000
echo - Node Bot: http://localhost:3978
echo - Teams Playground: Running
echo ========================================
echo.
echo Services are running. Use stop-all.bat to stop them.
echo Terminal is ready for your dev work.