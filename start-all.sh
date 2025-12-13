#!/bin/bash
# Start both Backend and Python services for Linux/Mac

echo "========================================"
echo "Starting Ghana Lottery Explorer Services"
echo "========================================"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    exit 1
fi

# Start Python service in background
echo "Starting Python Prediction Service..."
cd python-service
python3 app.py &
PYTHON_PID=$!
cd ..

# Wait a moment for Python service to start
sleep 3

# Start Backend server
echo "Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "Both services are running..."
echo "========================================"
echo ""
echo "Backend: http://localhost:5000"
echo "Python Service: http://localhost:5001"
echo ""
echo "Process IDs:"
echo "  Python Service: $PYTHON_PID"
echo "  Backend Server: $BACKEND_PID"
echo ""
echo "To stop services, press Ctrl+C or run:"
echo "  kill $PYTHON_PID $BACKEND_PID"
echo ""

# Wait for user interrupt
trap "kill $PYTHON_PID $BACKEND_PID 2>/dev/null; exit" INT TERM
wait

