# Lotto Oracle Python Service

Flask microservice wrapper for the Enhanced Lotto Oracle prediction system.

## Setup

### Windows Users (Important!)

If you get "Unknown compiler" errors, use pre-built wheels:

```bash
# Step 1: Upgrade pip
python -m pip install --upgrade pip setuptools wheel

# Step 2: Install with pre-built wheels only
pip install --only-binary :all: -r requirements.txt
```

See `INSTALL_WINDOWS.md` for detailed Windows installation instructions.

### Linux/Mac Users

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy `lottOracleV2.py` to this directory (or ensure it's in Python path)

3. Run the service:
```bash
python app.py
```

The service runs on port 5001 by default (to avoid conflict with backend on port 5000).

Or with environment variables:
```bash
PORT=5001 DEBUG=true python app.py
```

## API Endpoints

### POST /predict
Generate predictions using the oracle system.

**Request:**
```json
{
  "draws": [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], ...],
  "strategy": "ensemble",
  "n_predictions": 3
}
```

**Response:**
```json
{
  "success": true,
  "predictions": {
    "ml": [{"numbers": [1, 2, 3, 4, 5], "sum": 15, "evens": 2, "highs": 1}],
    "genetic": [...],
    "pattern": [...],
    "ensemble": [...]
  },
  "strategy": "ensemble",
  "regime_change": {...},
  "data_points_used": 200
}
```

### POST /analyze
Analyze patterns without generating predictions.

**Request:**
```json
{
  "draws": [[1, 2, 3, 4, 5], ...]
}
```

### GET /health
Health check endpoint.

## Integration with Node.js

The Node.js backend will call this service via HTTP:

```typescript
const response = await axios.post('http://localhost:5000/predict', {
  draws: historicalDraws,
  strategy: 'ensemble'
});
```

