# Quick Fix: Python Service Not Running

## The Issue

When you run `npm run dev`, only the **backend server** starts. The **Python service** must be started separately.

## Quick Solution

### Option 1: Start Python Service Manually (Easiest)

Open a **new terminal** and run:

```bash
cd python-service
python app.py
```

Keep this terminal open. You should see:
```
Starting Lotto Oracle Service on port 5001
 * Running on http://0.0.0.0:5001
```

### Option 2: Start All Services Together

From the **root directory**:

```bash
npm run dev:all
```

This starts:
- Frontend (port 3000)
- Backend (port 5000)  
- Python Service (port 5001)

### Option 3: Use Startup Scripts

**Windows:**
```bash
start-all.bat
```

**Linux/Mac:**
```bash
chmod +x start-all.sh
./start-all.sh
```

## Verify It's Working

After starting the Python service, test it:

```bash
curl http://localhost:5001/health
```

Should return: `{"status": "healthy", "oracle_initialized": false}`

Then check the frontend - the "Prediction service unavailable" message should disappear.

## Summary

**You need TWO services running:**
1. ✅ Backend (port 5000) - Started with `npm run dev`
2. ❌ Python Service (port 5001) - **Must start separately!**

The Python service is a separate Flask application and doesn't start automatically with the Node.js backend.

