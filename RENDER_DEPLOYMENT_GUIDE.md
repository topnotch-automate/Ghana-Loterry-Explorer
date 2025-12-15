# 🚀 Render Deployment Guide

Complete guide to deploy Ghana Lottery Explorer on Render.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Step 1: PostgreSQL Database](#step-1-postgresql-database)
4. [Step 2: Backend Service](#step-2-backend-service)
5. [Step 3: Python Service](#step-3-python-service)
6. [Step 4: Frontend Service](#step-4-frontend-service)
7. [Environment Variables](#environment-variables)
8. [Database Migrations](#database-migrations)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Render account (sign up at [render.com](https://render.com))
- GitHub repository with your code
- Basic understanding of environment variables

---

## Architecture Overview

Your application consists of 4 services:

1. **PostgreSQL Database** - Stores lottery data, users, predictions
2. **Backend Service** (Node.js/Express) - API server on port 5000
3. **Python Service** (Flask) - Prediction engine on port 5001
4. **Frontend Service** (React/Vite) - Static site

**Important**: Render services can communicate via internal URLs. Use environment variables for service discovery.

---

## Step 1: PostgreSQL Database

### 1.1 Create Database

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Configure:
   - **Name**: `ghana-lottery-db`
   - **Database**: `ghanalottery` (or your preferred name)
   - **User**: `ghanalottery` (or your preferred name)
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: 15 or 16
   - **Plan**: Free tier (or paid for production)

3. Click **Create Database**

### 1.2 Get Connection String

After creation, you'll see:
- **Internal Database URL**: `postgresql://user:password@host:5432/dbname`
- **External Database URL**: (for local development)

**Save the Internal Database URL** - you'll need it for backend service.

---

## Step 2: Backend Service

### 2.1 Create Web Service

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:

   **Basic Settings:**
   - **Name**: `ghana-lottery-backend`
   - **Region**: Same as database
   - **Branch**: `main` (or your deployment branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

   **Advanced Settings:**
   - **Auto-Deploy**: `Yes` (deploys on git push)

### 2.2 Environment Variables

Add these in the **Environment** section:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
# (Use the Internal Database URL from Step 1.2)

# Server
PORT=5000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://your-frontend.onrender.com
# (Update after deploying frontend)

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Python Service
PYTHON_SERVICE_URL=http://localhost:5001
# (For local testing, will be updated after Python service deployment)
```

**Important**: 
- Generate a strong `JWT_SECRET` (use `openssl rand -hex 32` or similar)
- Update `PYTHON_SERVICE_URL` after deploying Python service
- Update `CORS_ORIGIN` after deploying frontend

### 2.3 Build Configuration

Create `backend/render.yaml` (optional, for infrastructure as code):

```yaml
services:
  - type: web
    name: ghana-lottery-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: PORT
        value: 5000
      - key: NODE_ENV
        value: production
```

### 2.4 Verify Deployment

After deployment:
- Check logs for "Server running on port 5000"
- Test health endpoint: `https://your-backend.onrender.com/api/health`
- Note the service URL (e.g., `https://ghana-lottery-backend.onrender.com`)

---

## Step 3: Python Service

### 3.1 Create Web Service

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:

   **Basic Settings:**
   - **Name**: `ghana-lottery-python`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `python-service`
   - **Runtime**: `Python 3**
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`

   **Advanced Settings:**
   - **Auto-Deploy**: `Yes`

### 3.2 Environment Variables

Add these in the **Environment** section:

```bash
# Server
PORT=5001
FLASK_ENV=production

# Optional: Increase timeout for prediction requests
GUNICORN_TIMEOUT=120
```

### 3.3 Verify requirements.txt

The `requirements.txt` should include `gunicorn` (already added):

```txt
numpy
pandas
scikit-learn
flask
flask-cors
python-dotenv
gunicorn
```

**Note**: `gunicorn` is required for production deployment. The file has been updated.

### 3.4 Create Procfile (Alternative)

Alternatively, create `python-service/Procfile`:

```
web: gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120 --workers 2
```

### 3.5 Update Backend Environment

After Python service deploys, update backend environment:

```bash
PYTHON_SERVICE_URL=https://ghana-lottery-python.onrender.com
```

**Important**: Use the **public URL** of the Python service, not localhost.

### 3.6 Verify Deployment

- Check logs for "Running on http://0.0.0.0:5001"
- Test health endpoint: `https://your-python-service.onrender.com/health`
- Note the service URL

---

## Step 4: Frontend Service

### 4.1 Create Static Site

1. Go to Render Dashboard → **New** → **Static Site**
2. Connect your GitHub repository
3. Configure:

   **Basic Settings:**
   - **Name**: `ghana-lottery-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

   **Advanced Settings:**
   - **Auto-Deploy**: `Yes`

### 4.2 Environment Variables

Add these in the **Environment** section:

```bash
# API URL (Backend service)
VITE_API_URL=https://ghana-lottery-backend.onrender.com
```

### 4.3 Update Backend CORS

Update backend environment variable:

```bash
CORS_ORIGIN=https://ghana-lottery-frontend.onrender.com
```

### 4.4 Verify Deployment

- Visit your frontend URL
- Check browser console for errors
- Test API connectivity

---

## Environment Variables Summary

### Backend Service

```bash
DATABASE_URL=postgresql://...          # From PostgreSQL service
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.onrender.com
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PYTHON_SERVICE_URL=https://your-python-service.onrender.com
```

### Python Service

```bash
PORT=5001
FLASK_ENV=production
GUNICORN_TIMEOUT=120
```

### Frontend Service

```bash
VITE_API_URL=https://your-backend.onrender.com
```

---

## Database Migrations

### Option 1: Manual Migration (Recommended for First Deploy)

1. **Connect to database** using Render's database dashboard or external tool
2. **Run migrations** manually:

```sql
-- Run all migration files in order:
-- 001_initial_schema.sql
-- 002_add_machine_numbers.sql
-- 003_create_type_specific_tables.sql
-- 004_enhance_prediction_history.sql
```

### Option 2: Automated Migration

Add to backend `package.json`:

```json
{
  "scripts": {
    "migrate": "tsx src/scripts/migrate.ts",
    "postdeploy": "npm run migrate"
  }
}
```

**Note**: Render doesn't automatically run post-deploy scripts. You may need to:
- Run migrations manually via Render Shell
- Or create a migration endpoint (protected) and call it after deployment

### Option 3: Migration Endpoint (For Production)

Create a protected migration endpoint in backend:

```typescript
// backend/src/routes/admin.ts
router.post('/migrate', requireAuth, requirePro, async (req, res) => {
  // Only allow specific admin users
  if (req.user?.email !== 'admin@example.com') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Run migrations
  await runMigrations();
  res.json({ success: true, message: 'Migrations completed' });
});
```

---

## Initial Data Population

After deployment, populate the database:

### Option 1: Via Render Shell

1. Go to Backend Service → **Shell**
2. Run:

```bash
cd backend
npm run scrape
npm run populate
```

### Option 2: Via API Endpoint

Create a protected admin endpoint to trigger scraping (similar to migration endpoint).

---

## Service URLs Configuration

After all services are deployed, update environment variables:

### Backend → Python Service
```bash
PYTHON_SERVICE_URL=https://ghana-lottery-python.onrender.com
```

### Backend → Frontend (CORS)
```bash
CORS_ORIGIN=https://ghana-lottery-frontend.onrender.com
```

### Frontend → Backend
```bash
VITE_API_URL=https://ghana-lottery-backend.onrender.com
```

---

## Troubleshooting

### Backend Can't Connect to Database

**Symptoms**: `ECONNREFUSED` or `Connection timeout`

**Solutions**:
1. Verify `DATABASE_URL` uses **Internal Database URL** (not external)
2. Check database is running in Render dashboard
3. Verify network access (should be automatic on Render)

### Backend Can't Connect to Python Service

**Symptoms**: `ECONNREFUSED` or timeout errors

**Solutions**:
1. Verify `PYTHON_SERVICE_URL` uses **public HTTPS URL** (not localhost)
2. Check Python service is running
3. Verify Python service health endpoint works
4. Increase timeout in backend if needed

### Frontend Can't Connect to Backend

**Symptoms**: CORS errors or network errors

**Solutions**:
1. Verify `VITE_API_URL` is set correctly
2. Check `CORS_ORIGIN` in backend matches frontend URL
3. Check browser console for specific errors
4. Verify backend is running

### Python Service Timeout

**Symptoms**: Prediction requests timeout

**Solutions**:
1. Increase `GUNICORN_TIMEOUT` in Python service
2. Increase timeout in backend `predictionService.ts`
3. Consider using background jobs for long-running predictions

### Build Failures

**Symptoms**: Deployment fails during build

**Solutions**:
1. Check build logs for specific errors
2. Verify all dependencies are in `package.json` / `requirements.txt`
3. Check Node/Python version compatibility
4. Verify build commands are correct

### Database Migration Issues

**Symptoms**: Tables missing or errors

**Solutions**:
1. Run migrations manually via Render Shell
2. Check migration files are in correct order
3. Verify database connection string is correct
4. Check migration logs for specific errors

---

## Production Checklist

- [ ] All environment variables set correctly
- [ ] Database migrations run successfully
- [ ] Backend connects to database
- [ ] Backend connects to Python service
- [ ] Frontend connects to backend
- [ ] CORS configured correctly
- [ ] JWT_SECRET is strong and unique
- [ ] Initial data populated (scraped)
- [ ] All services auto-deploy on git push
- [ ] Health endpoints working
- [ ] SSL/HTTPS enabled (automatic on Render)
- [ ] Error logging configured
- [ ] Monitoring set up (optional)

---

## Cost Estimation (Free Tier)

- **PostgreSQL**: Free (limited to 90 days, then $7/month)
- **Backend Web Service**: Free (spins down after 15 min inactivity)
- **Python Web Service**: Free (spins down after 15 min inactivity)
- **Frontend Static Site**: Free (always on)

**Total**: Free for development, ~$14/month for production (with persistent database)

---

## Next Steps

1. **Set up monitoring** (optional): Use Render's built-in metrics
2. **Set up backups**: Configure PostgreSQL backups in Render
3. **Custom domain**: Add your domain in Render settings
4. **CI/CD**: Already configured with auto-deploy
5. **Scaling**: Upgrade to paid plans for better performance

---

## Support

- Render Docs: https://render.com/docs
- Render Status: https://status.render.com
- Render Community: https://community.render.com

---

## Quick Reference

### Service URLs Pattern

```
PostgreSQL: postgresql://user:pass@host:5432/db (Internal)
Backend:    https://ghana-lottery-backend.onrender.com
Python:     https://ghana-lottery-python.onrender.com
Frontend:   https://ghana-lottery-frontend.onrender.com
```

### Environment Variables Quick Copy

**Backend:**
```bash
DATABASE_URL=<internal-db-url>
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://ghana-lottery-frontend.onrender.com
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=7d
PYTHON_SERVICE_URL=https://ghana-lottery-python.onrender.com
```

**Python:**
```bash
PORT=5001
FLASK_ENV=production
GUNICORN_TIMEOUT=120
```

**Frontend:**
```bash
VITE_API_URL=https://ghana-lottery-backend.onrender.com
```

---

**🎉 You're all set! Your application should now be live on Render.**

