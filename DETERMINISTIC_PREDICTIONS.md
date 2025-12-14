# Deterministic Predictions Implementation

## Problem Solved

1. **Non-deterministic predictions**: Same input (lotto type + strategy + data) was producing different outputs
2. **Similar predictions**: Ensemble and ML were predicting similar numbers because they both used ML probabilities

## Solutions Implemented

### 1. Deterministic Seed Generation
- Created a seed from the hash of input data + strategy
- Same input data + strategy = same seed = same predictions
- Seed is generated at the start of `generate_predictions()`

```python
# Create deterministic seed from input data
data_str = str(sorted([tuple(sorted(d)) for d in self.historical]))
seed = int(hashlib.md5((data_str + strategy).encode()).hexdigest()[:8], 16) % (2**31)
random.seed(seed)
np.random.seed(seed % (2**31))
```

### 2. ML Strategy - Deterministic Selection
- **Before**: Used `random.choices()` with weighted probabilities (non-deterministic)
- **After**: Deterministic selection based on sorted probabilities
  - Top 3 highest probability numbers
  - Next 2 from positions 4-15 for diversity
  - All selections are deterministic (sorted by probability, then by number)

### 3. Genetic Strategy - Pattern-Based Probabilities
- **Before**: Used ML probabilities as base (same as ML strategy)
- **After**: Uses pattern-based probabilities (completely different from ML)
  - Hot numbers: 40% weight
  - Cold numbers: 30% weight (more cold = higher boost)
  - Due numbers: 20% weight (around average skip)
  - Frequency: 10% weight
  - This makes Genetic predictions distinct from ML

### 4. Pattern Strategy - Deterministic Selection
- **Before**: Random sampling from candidate pool (5000 iterations)
- **After**: Deterministic scoring and selection
  - Scores each candidate number
  - Selects top 5 deterministically based on scores
  - No random sampling

### 5. Ensemble Strategy - Weighted Voting
- **Before**: Simple vote counting (could be similar to ML if ML and Genetic were similar)
- **After**: Weighted voting with strategy weights
  - ML: 1.0 weight
  - Genetic: 1.2 weight (more influence)
  - Pattern: 1.1 weight
  - Deterministic selection from weighted votes

## Key Changes

### File: `python-service/lottOracleV2.py`

1. **Added imports**: `hashlib` for deterministic seed generation
2. **`generate_predictions()`**: Added seed generation at start
3. **`_ml_based_prediction()`**: Changed to deterministic selection
4. **`_genetic_optimization()`**: Changed to use pattern-based probabilities instead of ML
5. **`_pattern_based_prediction()`**: Changed to deterministic scoring and selection
6. **`_ensemble_vote()`**: Added weighted voting with deterministic selection

### File: `python-service/app.py`

1. **Improved data comparison**: Uses tuple comparison for more robust caching

## Results

✅ **Deterministic**: Same input (lotto type + strategy + data) = same output
✅ **Distinct Strategies**: 
   - ML: Uses ML probability distribution
   - Genetic: Uses pattern-based probabilities (hot/cold/due numbers)
   - Pattern: Uses pattern matching scores
   - Ensemble: Weighted combination of all three
✅ **No Randomness**: All random operations use deterministic seeds

## Testing

To verify deterministic behavior:

1. Generate predictions for a specific lotto type and strategy
2. Generate again with the same lotto type and strategy (same data)
3. Results should be **identical**

To verify distinct strategies:

1. Generate predictions with ML strategy
2. Generate predictions with Genetic strategy (same data)
3. Results should be **different** (not just similar)

## Notes

- The seed is based on the **sorted** historical data, so order doesn't matter
- Strategy name is included in seed, so different strategies produce different results
- All random operations (genetic algorithm, etc.) use the deterministic seed
- Predictions will only change if:
  - Historical data changes (new draws added)
  - Strategy changes
  - Lotto type changes (different data)

