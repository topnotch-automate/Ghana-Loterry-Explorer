@echo off
REM Start Python Prediction Service for Windows

echo Starting Lotto Oracle Python Service...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if requirements are installed
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo Installing Python dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if lottOracleV2.py exists
if not exist "lottOracleV2.py" (
    echo ERROR: lottOracleV2.py not found in python-service directory
    pause
    exit /b 1
)

REM Start the service
echo Starting service on port 5001 (default)...
echo Press Ctrl+C to stop
echo.
python app.py

pause

