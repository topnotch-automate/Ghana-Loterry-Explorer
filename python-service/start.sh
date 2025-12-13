#!/bin/bash
# Start Python Prediction Service for Linux/Mac

echo "Starting Lotto Oracle Python Service..."
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    exit 1
fi

# Check if requirements are installed
if ! python3 -c "import flask" &> /dev/null; then
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

# Check if lottOracleV2.py exists
if [ ! -f "lottOracleV2.py" ]; then
    echo "ERROR: lottOracleV2.py not found in python-service directory"
    exit 1
fi

# Start the service
echo "Starting service on port 5001 (default)..."
echo "Press Ctrl+C to stop"
echo ""
python3 app.py

