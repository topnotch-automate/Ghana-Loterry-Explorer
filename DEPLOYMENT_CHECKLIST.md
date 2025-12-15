# 🚀 Deployment Checklist

Use this checklist to ensure a smooth deployment to Render.

## Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] All tests pass locally
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Build commands verified locally

## Step 1: PostgreSQL Database

- [ ] Created PostgreSQL database on Render
- [ ] Saved Internal Database URL
- [ ] Database is running and accessible

## Step 2: Backend Service

- [ ] Created Web Service for backend
- [ ] Set root directory to `backend`
- [ ] Set build command: `npm install && npm run build`
- [ ] Set start command: `npm start`
- [ ] Added all environment variables:
  - [ ] `DATABASE_URL` (Internal Database URL)
  - [ ] `PORT=5000`
  - [ ] `NODE_ENV=production`
  - [ ] `CORS_ORIGIN` (will update after frontend)
  - [ ] `JWT_SECRET` (strong random secret)
  - [ ] `JWT_EXPIRES_IN=7d`
  - [ ] `PYTHON_SERVICE_URL` (will update after Python service)
- [ ] Service deployed successfully
- [ ] Health endpoint working: `/health`
- [ ] Backend URL saved

## Step 3: Python Service

- [ ] Created Web Service for Python
- [ ] Set root directory to `python-service`
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120 --workers 2`
- [ ] Added environment variables:
  - [ ] `PORT=5001`
  - [ ] `FLASK_ENV=production`
  - [ ] `GUNICORN_TIMEOUT=120`
- [ ] Service deployed successfully
- [ ] Health endpoint working: `/health`
- [ ] Python service URL saved
- [ ] Updated backend `PYTHON_SERVICE_URL` environment variable

## Step 4: Frontend Service

- [ ] Created Static Site for frontend
- [ ] Set root directory to `frontend`
- [ ] Set build command: `npm install && npm run build`
- [ ] Set publish directory: `dist`
- [ ] Added environment variables:
  - [ ] `VITE_API_URL` (backend URL)
- [ ] Service deployed successfully
- [ ] Frontend URL saved
- [ ] Updated backend `CORS_ORIGIN` environment variable

## Step 5: Database Setup

- [ ] Connected to database (via Render Shell or external tool)
- [ ] Ran migration: `001_update_cooccurrence_to_triplets.sql`
- [ ] Ran migration: `002_add_users_and_subscriptions.sql`
- [ ] Ran migration: `003_create_lotto_type_tables.sql`
- [ ] Ran migration: `004_enhance_prediction_history.sql`
- [ ] Verified tables created successfully

## Step 6: Initial Data

- [ ] Connected to backend via Render Shell
- [ ] Ran: `npm run scrape` (or via admin endpoint)
- [ ] Ran: `npm run populate` (or via admin endpoint)
- [ ] Verified data in database

## Step 7: Final Configuration

- [ ] Updated backend `PYTHON_SERVICE_URL` to Python service URL
- [ ] Updated backend `CORS_ORIGIN` to frontend URL
- [ ] Updated frontend `VITE_API_URL` to backend URL
- [ ] All services restarted with new environment variables

## Step 8: Testing

- [ ] Frontend loads without errors
- [ ] Can view latest draws
- [ ] Can search draws
- [ ] Analytics page works
- [ ] Can register/login
- [ ] Can generate predictions (Pro users)
- [ ] All API endpoints responding
- [ ] No CORS errors in browser console
- [ ] No network errors

## Step 9: Production Hardening

- [ ] Strong `JWT_SECRET` set (not default)
- [ ] Database backups configured
- [ ] Error logging configured
- [ ] Monitoring set up (optional)
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS verified (automatic on Render)

## Troubleshooting

If something doesn't work:

1. **Check Logs**: View service logs in Render dashboard
2. **Verify Environment Variables**: Ensure all are set correctly
3. **Test Health Endpoints**: `/health` for backend, `/health` for Python
4. **Check Database Connection**: Verify `DATABASE_URL` is correct
5. **Verify Service URLs**: Ensure all URLs use HTTPS
6. **Check CORS**: Ensure `CORS_ORIGIN` matches frontend URL exactly

## Quick Commands

### Connect to Backend Shell
```bash
# Via Render Dashboard → Backend Service → Shell
cd backend
npm run check-db  # Check database connection
npm run migrate    # Run migrations
npm run scrape     # Scrape data
npm run populate   # Populate database
```

### Connect to Database
```bash
# Via Render Dashboard → Database → Connect
# Or use external tool with External Database URL
```

## Support Resources

- Render Docs: https://render.com/docs
- Render Status: https://status.render.com
- Your Service Logs: Render Dashboard → Service → Logs

---

**✅ Deployment Complete!**
