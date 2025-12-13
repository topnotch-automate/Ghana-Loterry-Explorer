# Quick Start: Getting Predictions Working

## The Problem
Frontend shows "Prediction service unavailable" because the Python service isn't running or isn't accessible.

## Quick Fix (3 Steps)

### Step 1: Start Python Service

**Windows:**
```bash
cd python-service
start.bat
```

**Linux/Mac:**
```bash
cd python-service
chmod +x start.sh
./start.sh
```

**Or manually:**
```bash
cd python-service
python app.py
```

You should see:
```
Starting Lotto Oracle Service on port 5001
 * Running on http://0.0.0.0:5001
```

Note: Python service uses port 5001 (backend uses port 5000 to avoid conflict)

### Step 2: Verify Service is Running

Open a new terminal and test:
```bash
curl http://localhost:5001/health
```

Should return:
```json
{"status": "healthy", "oracle_initialized": false}
```

### Step 3: Restart Backend (if needed)

If you changed the `PYTHON_SERVICE_URL` in `.env`, restart the backend:
```bash
cd backend
npm run dev
```

Check the logs - you should see:
```
Python service URL: http://localhost:5000
```

## Configuration

### Default Settings
- Backend runs on: `http://localhost:5000`
- Python service runs on: `http://localhost:5001` (default)
- Backend expects Python service at: `http://localhost:5001` (default)

### Custom Configuration

If Python service runs on a different port/IP, set in `backend/.env`:
```env
PYTHON_SERVICE_URL=http://localhost:5001
```

Or for remote server:
```env
PYTHON_SERVICE_URL=http://172.20.10.14:5001
```

## Troubleshooting

### "Connection refused"
→ Python service is not running. Start it with `python app.py`

### "Module not found"
→ Install dependencies: `pip install -r requirements.txt`

### "Port already in use"
→ Python service already uses port 5001 by default. If you need a different port: `PORT=5002 python app.py` and update `.env`

### Still not working?
See `TROUBLESHOOTING_PREDICTIONS.md` for detailed diagnosis.

