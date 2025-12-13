#!/bin/bash
# Simple installation script for Linux/Mac

echo "========================================"
echo "Installing Python Dependencies"
echo "========================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    exit 1
fi

echo "Step 1: Upgrading pip..."
python3 -m pip install --upgrade pip setuptools wheel

echo ""
echo "Step 2: Installing packages..."
echo "Note: imbalanced-learn is optional - code works without it"
pip3 install numpy pandas scikit-learn flask flask-cors python-dotenv

echo ""
echo "Step 2b: Installing imbalanced-learn (optional)..."
pip3 install imbalanced-learn 2>/dev/null || echo "  (imbalanced-learn installation failed - this is OK, code will use fallback)"

if [ $? -ne 0 ]; then
    echo ""
    echo "Installation failed. Please check the error messages above."
    exit 1
fi

echo ""
echo "Step 3: Verifying installation..."
python3 -c "import numpy; import pandas; import sklearn; import flask; print('✓ Core packages installed successfully')"
python3 -c "try:
    import imblearn
    print('✓ imbalanced-learn also available (SMOTE will be used)')
except:
    print('  (imbalanced-learn not available - code will use fallback, this is OK)')"

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Some packages failed to import"
    exit 1
fi

echo ""
echo "========================================"
echo "Installation Complete!"
echo "========================================"

