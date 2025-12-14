# Intelligence Engine Integration

## Overview

The Intelligence Engine is an advanced prediction algorithm that uses machine numbers to predict winning numbers. It implements the sophisticated modeling logic from `pipeline.md` with enhancements from `pipeline.py`.

## Key Features

### 1. Machine → Winning Lag Engine
- **Lag Response Profiles**: For each number, computes P(win | machine at t-1, t-2, t-3)
- **LagSignature(k)**: Weighted maximum of lag probabilities
- Identifies fast converters, slow burners, and non-responders

### 2. Temporal Memory Engine
- **TemporalScore(k)**: Σ exp(-λ · Δt_i)
- Captures momentum, not just presence
- Recent wins weighted more heavily with exponential decay

### 3. Burst Detector
- **BurstIndex(k)**: (recent_win_count) / (mean_gap + ε)
- Identifies cluster-active, dormant, and explosive-return numbers
- Dynamic state tracking

### 4. Relationship Intelligence
- **Pair Gravity**: P(i & j together) / (P(i) · P(j))
- **Family Clusters**: Graph-based clustering of numbers with high pair gravity
- Identifies number families that tend to appear together

### 5. Number State Model
- **5 States**: Dormant, Warming, Active, Overheated, Breakout
- State modifies contribution to ticket score
- Dynamic state determination based on recent activity

### 6. Multi-Persona Ticket Generator
- **Structural Anchor**: High stability, low variance
- **Machine Memory Hunter**: LagSignature dominant
- **Cluster Rider**: Family-heavy tickets
- **Breakout Speculator**: Dormant + trigger-based
- **Balanced Intelligence**: Weighted blend

## Integration Points

### Backend Changes

1. **predictionService.ts**:
   - Updated `convertDrawsToPythonFormat()` to include machine numbers
   - Updated `PredictionRequest` interface to include `machine_draws`
   - Added 'intelligence' to strategy types

2. **routes/predictions.ts**:
   - Updated strategy type to include 'intelligence'
   - Machine numbers automatically included in all requests

### Python Service Changes

1. **intelligenceEngine.py** (NEW):
   - Complete implementation of intelligence engine
   - Deterministic predictions (uses seed)
   - All features from pipeline.md

2. **lottOracleV2.py**:
   - Added `machine_draws` parameter to `generate_predictions()`
   - Integrated intelligence engine into ensemble
   - Added 'intelligence' strategy option

3. **app.py**:
   - Updated to accept `machine_draws` in request
   - Validates machine numbers for intelligence strategy
   - Passes machine numbers to oracle

### Frontend Changes

1. **types/index.ts**:
   - Added 'intelligence' to `PredictionStrategy` type

2. **pages/Predictions.tsx**:
   - Added intelligence strategy card
   - Updated grid layout to accommodate 5 strategies

## Usage

### API Request Format

```json
{
  "draws": [[1, 2, 3, 4, 5], ...],
  "machine_draws": [[6, 7, 8, 9, 10], ...],
  "strategy": "intelligence",
  "n_predictions": 1
}
```

### Strategy Selection

Users can now select from 5 strategies:
- **Ensemble**: Combines all methods (including intelligence if machine numbers available)
- **ML**: Machine learning models
- **Genetic**: Evolutionary algorithm
- **Pattern**: Pattern matching
- **Intelligence**: Advanced intelligence engine (requires machine numbers)

## Deterministic Behavior

The intelligence engine is fully deterministic:
- Uses seed from input data hash
- Same input (winning + machine numbers + strategy) = same output
- All random operations use deterministic seed

## Performance Optimizations

1. **Caching**: Temporal scores, lag signatures, burst indices are cached
2. **Selective Pair Gravity**: Only computes for top numbers (not all pairs)
3. **Efficient Clustering**: Simplified family cluster computation
4. **Deterministic Selection**: No random sampling, all selections are deterministic

## Algorithm Details

### Unified Score Calculation

```
Score(k) = 
  0.3 · TemporalScore(k) +
  0.25 · LagSignature(k) +
  0.2 · BurstIndex(k) +
  0.15 · PairSupport(k) +
  0.1 · FamilySupport(k)
```

All scores normalized to 0-1 range, then weighted and combined.

### Ticket Scoring

```
TicketScore(T) = 
  Σ Score(ki) +
  PairSynergy(T) +
  FamilyCoherence(T) -
  RedundancyPenalty(T) +
  AnchorBonus(T)
```

### Persona Strategies

Each persona uses different selection criteria:
- **Balanced**: Mix of all factors
- **Structural Anchor**: High stability numbers
- **Machine Memory Hunter**: High lag signature numbers
- **Cluster Rider**: Numbers from same family
- **Breakout Speculator**: Dormant numbers with triggers

## Testing

To test the intelligence engine:

1. Ensure you have draws with both winning and machine numbers
2. Select "Intelligence" strategy in the frontend
3. Generate predictions
4. Verify predictions are deterministic (same input = same output)

## Notes

- Intelligence strategy requires machine numbers
- If machine numbers not available, falls back to other strategies
- Ensemble strategy includes intelligence if machine numbers are provided
- All predictions are deterministic and reproducible

