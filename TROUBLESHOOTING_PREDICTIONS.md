# Troubleshooting: Prediction Service Unavailable

## Problem
Frontend shows: "Prediction service unavailable - The prediction service is currently not available. Please try again later."

## Root Causes

### 1. Python Service Not Running
The most common cause is that the Python Flask service is not running.

**Solution:**
```bash
cd python-service
python app.py
```

The Python service runs on port 5001 by default (backend uses port 5000).

Or with environment variables:
```bash
cd python-service
PORT=5001 python app.py
```

### 2. Wrong Service URL
The backend is trying to connect to the wrong URL.

**Check current URL:**
- Look at backend logs when it starts - it should show: `Python service URL: http://...`
- Default is `http://localhost:5001` if `PYTHON_SERVICE_URL` is not set (Python service uses 5001, backend uses 5000)

**Solution:**
Set the environment variable in `backend/.env` if needed:
```env
PYTHON_SERVICE_URL=http://localhost:5001
```

Or if running on a different machine/IP:
```env
PYTHON_SERVICE_URL=http://172.20.10.14:5001
```

### 3. Port Conflict
Another service might be using port 5000.

**Check:**
```bash
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000
```

**Solution:**
- Python service already uses port 5001 by default (backend uses 5000)
- If you need a different port:
  ```bash
  PORT=5002 python app.py
  ```
- Update backend `.env`:
  ```env
  PYTHON_SERVICE_URL=http://localhost:5002
  ```

### 4. Firewall/Network Issues
The backend can't reach the Python service.

**Solution:**
- Check firewall settings
- Ensure Python service is binding to `0.0.0.0` (not just `127.0.0.1`)
- Check if services are on the same network

### 5. Python Dependencies Missing
The Python service fails to start due to missing packages.

**Solution:**
```bash
cd python-service
pip install -r requirements.txt
```

### 6. Python File Not Found
The `lottOracleV2.py` file is missing.

**Solution:**
Ensure `lottOracleV2.py` is in the `python-service` directory:
```bash
cd python-service
ls lottOracleV2.py  # Should exist
```

## Step-by-Step Diagnosis

### Step 1: Check if Python Service is Running
```bash
curl http://localhost:5001/health
```

Expected response:
```json
{"status": "healthy", "oracle_initialized": false}
```

If you get "Connection refused" → Service is not running
If you get a response → Service is running

### Step 2: Check Backend Logs
Look for:
- `Python service URL: http://...` (shows what URL it's using)
- `Python service health check failed` (shows the error)

### Step 3: Test Backend Health Endpoint
```bash
curl http://localhost:5000/api/predictions/health
```
Note: Backend runs on port 5000, Python service on port 5001

Expected response:
```json
{"success": true, "available": true, "message": "Prediction service is available"}
```

### Step 4: Check Environment Variables
```bash
# In backend directory
cat .env | grep PYTHON_SERVICE_URL
```

## Quick Fix Checklist

- [ ] Python service is running (`python app.py` in `python-service/` directory)
- [ ] Python service responds to `http://localhost:5001/health` (runs on port 5001)
- [ ] Backend is running on port 5000 (default)
- [ ] `PYTHON_SERVICE_URL` is set correctly in `backend/.env` (default: `http://localhost:5001`)
- [ ] Backend server has been restarted after setting environment variable
- [ ] No firewall blocking ports 5000 (backend) and 5001 (Python service)
- [ ] Python dependencies are installed (`pip install -r requirements.txt`)
- [ ] `lottOracleV2.py` exists in `python-service/` directory

## Common Error Messages

### "ECONNREFUSED"
- **Meaning**: Connection refused - service is not running
- **Fix**: Start the Python service

### "ETIMEDOUT"
- **Meaning**: Connection timeout - service is slow or unreachable
- **Fix**: Check network, increase timeout, or check if service is overloaded

### "ModuleNotFoundError: No module named 'lottOracleV2'"
- **Meaning**: Python can't find the oracle file
- **Fix**: Ensure `lottOracleV2.py` is in `python-service/` directory

### "ModuleNotFoundError: No module named 'flask'"
- **Meaning**: Python dependencies not installed
- **Fix**: Run `pip install -r requirements.txt`

## Testing the Full Stack

1. **Start Python Service:**
   ```bash
   cd python-service
   python app.py
   ```
   Should see: `Starting Lotto Oracle Service on port 5001`

2. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   Should see: 
   - `Server running on http://localhost:5000` (backend)
   - `Python service URL: http://localhost:5001` (Python service)

3. **Test Health Check:**
   ```bash
   curl http://localhost:5000/api/predictions/health
   ```

4. **Check Frontend:**
   - Navigate to `/predictions`
   - Should not show "service unavailable" message

## Production Deployment

For production, you'll need to:
1. Run Python service as a systemd service (Linux) or Windows service
2. Use a process manager like PM2 or supervisor
3. Set proper environment variables
4. Configure reverse proxy (nginx) if needed
5. Set up monitoring and auto-restart

