@echo off
REM Start both Backend and Python services for Windows

echo ========================================
echo Starting Ghana Lottery Explorer Services
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

echo Starting Python Prediction Service...
start "Python Service" cmd /k "cd python-service && python app.py"

timeout /t 3 /nobreak >nul

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo Both services are starting...
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Python Service: http://localhost:5001
echo.
echo Check the separate windows for service status
echo Press any key to exit (services will continue running)
pause >nul

