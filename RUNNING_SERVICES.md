# Running the Services

## Overview

The application requires **two services** to run:

1. **Backend Server** (Node.js/Express) - Port 5000
2. **Python Prediction Service** (Flask) - Port 5001

## Quick Start

### Option 1: Run All Services with npm (Recommended)

**From root directory:**
```bash
npm run dev:all
```

This starts:
- Frontend (port 3000)
- Backend (port 5000)
- Python Service (port 5001)

**Note:** Requires `concurrently` package (already in devDependencies)

### Option 2: Run Services with Scripts

**Windows:**
```bash
start-all.bat
```

**Linux/Mac:**
```bash
chmod +x start-all.sh
./start-all.sh
```

This will start backend and Python service in separate windows/processes.

### Option 3: Run Services Manually (Three Terminals)

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 2 - Backend Server:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Python Service:**
```bash
cd python-service
python app.py
```

**Note:** If you only need predictions to work, you can skip the frontend and just run backend + Python service.

## Service Ports

- **Frontend**: `http://localhost:3000` (Vite dev server)
- **Backend API**: `http://localhost:5000` (Express server)
- **Python Service**: `http://localhost:5001` (Flask server)

## Important Notes

⚠️ **The Python service MUST be running for predictions to work!**

- `npm run dev` (from root) only starts frontend + backend
- `npm run dev` (from backend) only starts backend
- **You must also start the Python service separately** OR use `npm run dev:all`

## Verifying Services

### Check Python Service:
```bash
curl http://localhost:5001/health
```
Should return: `{"status": "healthy", "oracle_initialized": false}`

### Check Backend:
```bash
curl http://localhost:5000/health
```
Should return: `{"status": "ok", ...}`

### Check Predictions Health:
```bash
curl http://localhost:5000/api/predictions/health
```
Should return: `{"success": true, "available": true, ...}`

## Troubleshooting

### "Port already in use"
- Make sure no other services are using ports 5000 or 5001
- Check with: `netstat -ano | findstr :5000` (Windows) or `lsof -i :5000` (Linux/Mac)

### "Python service unavailable"
- Ensure Python service is running on port 5001
- Check Python service logs for errors
- Verify `PYTHON_SERVICE_URL` in `backend/.env` is `http://localhost:5001`

### Services won't start
- Check Python dependencies: `pip install -r python-service/requirements.txt`
- Check Node.js dependencies: `cd backend && npm install`
- Check that `lottOracleV2.py` exists in `python-service/` directory

## Development Workflow

1. **Start Python Service** (keep running)
   ```bash
   cd python-service
   python app.py
   ```

2. **Start Backend** (in another terminal)
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend** (optional, in another terminal)
   ```bash
   cd frontend
   npm run dev
   ```

## Production Deployment

For production, use process managers:

**PM2 (Node.js):**
```bash
pm2 start backend/dist/index.js --name "lottery-backend"
```

**Systemd (Linux) or Windows Service for Python:**
- Create service files to auto-start both services
- Use reverse proxy (nginx) for routing

