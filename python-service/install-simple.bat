@echo off
REM Simple installation script for Windows

echo ========================================
echo Installing Python Dependencies
echo ========================================
echo.

REM Check Python
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Step 1: Upgrading pip...
python -m pip install --upgrade pip setuptools wheel

echo.
echo Step 2: Installing packages (using pre-built wheels)...
echo Note: imbalanced-learn is optional - code works without it
pip install --only-binary :all: numpy pandas scikit-learn flask flask-cors python-dotenv

REM Try to install imbalanced-learn (optional)
echo.
echo Step 2b: Installing imbalanced-learn (optional, may fail due to version conflicts)...
pip install --only-binary :all: imbalanced-learn 2>nul
if errorlevel 1 (
    echo   (imbalanced-learn installation failed - this is OK, code will use fallback)
    pip uninstall imbalanced-learn -y 2>nul
)

if errorlevel 1 (
    echo.
    echo Installation failed. Trying without --only-binary flag...
    pip install numpy pandas scikit-learn flask flask-cors python-dotenv
)

echo.
echo Step 3: Verifying installation...
python -c "import numpy; import pandas; import sklearn; import flask; print('✓ Core packages installed successfully')"
python -c "try:
    import imblearn
    print('✓ imbalanced-learn also available (SMOTE will be used)')
except:
    print('  (imbalanced-learn not available - code will use fallback, this is OK)')"

if errorlevel 1 (
    echo.
    echo ERROR: Some packages failed to import
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
pause

