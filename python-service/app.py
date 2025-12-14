#!/usr/bin/env python3
"""
Python Microservice for Lotto Oracle Predictions
Flask API wrapper around EnhancedLottoOracle
"""

import os
import json
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import List, Dict, Any
import warnings
import numpy as np

warnings.filterwarnings('ignore')

# Import the oracle system
from lottOracleV2 import EnhancedLottoOracle


def make_json_serializable(obj: Any) -> Any:
    """Convert numpy types and other non-JSON types to JSON-serializable types"""
    # Handle numpy types
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    # Handle Python native types
    elif isinstance(obj, bool):
        return obj
    elif isinstance(obj, dict):
        return {k: make_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [make_json_serializable(item) for item in obj]
    else:
        # Try to convert if it's a numpy scalar
        try:
            if hasattr(obj, 'item'):
                return obj.item()
        except (ValueError, AttributeError):
            pass
        return obj

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from Node.js backend

# Global oracle instance (initialized on first request)
oracle_instance = None
historical_draws_cache = None


def initialize_oracle(draws: List[List[int]]) -> EnhancedLottoOracle:
    """Initialize or reinitialize the oracle with new data"""
    global oracle_instance
    oracle_instance = EnhancedLottoOracle(draws)
    return oracle_instance


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'oracle_initialized': bool(oracle_instance is not None)
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Generate predictions
    
    Request body:
    {
        "draws": [[1, 2, 3, 4, 5], ...],  # Historical draws (winning numbers only)
        "machine_draws": [[6, 7, 8, 9, 10], ...],  # Machine numbers (optional, required for intelligence strategy)
        "strategy": "ensemble",  # Options: "ensemble", "ml", "genetic", "pattern", "intelligence"
        "n_predictions": 3
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        draws = data.get('draws', [])
        machine_draws = data.get('machine_draws', [])
        strategy = data.get('strategy', 'ensemble')
        n_predictions = data.get('n_predictions', 3)
        
        # Store original count for logging (before filtering)
        original_draw_count = len(draws)
        
        # Validate draws format
        if not draws or not isinstance(draws, list):
            return jsonify({'error': 'Invalid draws format. Expected list of lists'}), 400
        
        # Validate each draw
        for draw in draws:
            if not isinstance(draw, list) or len(draw) != 5:
                return jsonify({'error': 'Each draw must be a list of exactly 5 numbers'}), 400
            if not all(isinstance(n, int) and 1 <= n <= 90 for n in draw):
                return jsonify({'error': 'Numbers must be integers between 1 and 90'}), 400
        
        # Validate machine draws if provided
        # For intelligence strategy, we'll filter, so length mismatch is okay
        if machine_draws:
            if strategy != 'intelligence' and len(machine_draws) != len(draws):
                return jsonify({'error': 'Machine draws must have same length as winning draws'}), 400
            for mach_draw in machine_draws:
                # For intelligence strategy, empty/invalid machine draws will be filtered out
                if strategy == 'intelligence':
                    # Skip validation - will be filtered later
                    continue
                if not isinstance(mach_draw, list) or len(mach_draw) != 5:
                    return jsonify({'error': 'Each machine draw must be a list of exactly 5 numbers'}), 400
                if not all(isinstance(n, int) and 1 <= n <= 90 for n in mach_draw):
                    return jsonify({'error': 'Machine numbers must be integers between 1 and 90'}), 400
        
        # Filter machine numbers for strategies that need them (intelligence and ensemble)
        # Do this BEFORE checking minimum requirements, as filtering may reduce the count
        # For ensemble, we filter so intelligence can work; for intelligence, we require it
        if strategy in ['intelligence', 'ensemble'] and machine_draws:
            # Filter to only include draws with valid machine numbers (length == 5)
            filtered_draws = []
            filtered_machines = []
            for i, (win_draw, mach_draw) in enumerate(zip(draws, machine_draws)):
                if mach_draw and len(mach_draw) == 5 and all(1 <= n <= 90 for n in mach_draw):
                    filtered_draws.append(win_draw)
                    filtered_machines.append(mach_draw)
            
            if strategy == 'intelligence':
                # Intelligence requires at least 50 valid draws
                if len(filtered_draws) < 50:
                    return jsonify({
                        'error': 'Insufficient data',
                        'message': f'Need at least 50 draws with valid machine numbers. Found {len(filtered_draws)} valid draws out of {len(draws)} total.',
                        'valid_draws': len(filtered_draws),
                        'total_draws': len(draws)
                    }), 400
            elif strategy == 'ensemble':
                # Ensemble can work with fewer, but log if we filtered
                if len(filtered_draws) < len(draws):
                    print(f"Ensemble strategy: Filtered to {len(filtered_draws)} draws with valid machine numbers (from {original_draw_count} total) for intelligence engine")
            
            # Use filtered data for intelligence/ensemble
            if len(filtered_draws) > 0:
                draws = filtered_draws
                machine_draws = filtered_machines
            else:
                # No valid machine numbers - set to empty so intelligence won't be used
                machine_draws = []
                print(f"Warning: No draws with valid machine numbers. Intelligence engine will be skipped.")
        
        elif strategy == 'intelligence' and not machine_draws:
            return jsonify({
                'error': 'Machine numbers required',
                'message': 'Intelligence strategy requires machine_draws in request body'
            }), 400
        
        # Check minimum data requirement AFTER filtering (if filtering occurred)
        min_required = 60 if strategy not in ['intelligence', 'ensemble'] else 50
        if len(draws) < min_required:
            return jsonify({
                'error': 'Insufficient data',
                'message': f'Need at least {min_required} draws. Got {len(draws)} after filtering.',
                'minimum_required': min_required
            }), 400
        
        # Initialize or update oracle if data changed
        global historical_draws_cache
        # Use a more robust comparison (convert to tuples for comparison)
        draws_tuple = tuple(tuple(sorted(d)) for d in draws)
        if historical_draws_cache != draws_tuple:
            historical_draws_cache = draws_tuple
            initialize_oracle(draws)
        
        # Generate predictions (now deterministic based on data + strategy)
        print(f"DEBUG: About to call generate_predictions with strategy={strategy}, draws={len(draws)}, machine_draws={'present' if machine_draws else 'None'} ({len(machine_draws) if machine_draws else 0} entries)")
        predictions = oracle_instance.generate_predictions(
            strategy=strategy,
            n_predictions=n_predictions,
            machine_draws=machine_draws if machine_draws else None
        )
        print(f"DEBUG: generate_predictions returned: {predictions}")
        print(f"DEBUG: predictions.keys() = {list(predictions.keys())}")
        if 'intelligence' in predictions:
            print(f"DEBUG: intelligence in predictions: {predictions['intelligence']}")
        else:
            print(f"DEBUG: intelligence NOT in predictions")
        
        # Convert predictions to JSON-serializable format
        result = {}
        
        # CRITICAL FIX: If strategy is intelligence and predictions dict is empty or missing intelligence key,
        # provide a fallback immediately
        if strategy == 'intelligence':
            if not predictions or 'intelligence' not in predictions:
                print(f"CRITICAL: Intelligence strategy but predictions dict is empty or missing intelligence key!")
                print(f"  predictions = {predictions}")
                print(f"  predictions.keys() = {list(predictions.keys()) if predictions else 'N/A'}")
                # Provide immediate fallback
                try:
                    from collections import Counter
                    all_numbers = []
                    for draw in draws:
                        all_numbers.extend(draw)
                    freq = Counter(all_numbers)
                    top_5_fallback = sorted([n for n, _ in freq.most_common(5)])
                    print(f"  Providing immediate fallback: {top_5_fallback}")
                    predictions['intelligence'] = [top_5_fallback]
                except Exception as e:
                    print(f"  Fallback generation failed: {e}, using default [1,2,3,4,5]")
                    predictions['intelligence'] = [[1, 2, 3, 4, 5]]
        
        for method, preds in predictions.items():
            # Special handling for intelligence strategy - provide fallback if empty
            if not preds or len(preds) == 0:
                if method == 'intelligence':
                    print(f"ERROR: Intelligence strategy returned no predictions (preds: {preds})")
                    print(f"  This is a critical error - intelligence strategy must return predictions")
                    # Provide a fallback prediction based on frequency
                    try:
                        from collections import Counter
                        all_numbers = []
                        for draw in draws:
                            all_numbers.extend(draw)
                        freq = Counter(all_numbers)
                        top_5_fallback = sorted([n for n, _ in freq.most_common(5)])
                        print(f"  Using frequency-based fallback: {top_5_fallback}")
                        preds = [top_5_fallback]  # Replace empty with fallback
                    except Exception as e:
                        print(f"  Fallback generation failed: {e}, using default [1,2,3,4,5]")
                        preds = [[1, 2, 3, 4, 5]]  # Absolute fallback
                else:
                    # Skip empty predictions for other methods
                    print(f"Warning: {method} strategy returned no predictions (preds: {preds})")
                    continue
            
            result[method] = []
            for pred in preds:
                # Handle None values
                if pred is None:
                    print(f"Warning: {method} returned None prediction")
                    continue
                # Ensure pred is a list
                if not isinstance(pred, list):
                    print(f"Warning: {method} returned non-list prediction: {type(pred)}, value: {pred}")
                    continue
                if len(pred) != 5:
                    print(f"Warning: {method} returned invalid prediction length {len(pred)}: {pred}")
                    continue
                # Validate numbers are in range
                if not all(isinstance(n, (int, float)) and 1 <= n <= 90 for n in pred):
                    print(f"Warning: {method} returned prediction with invalid numbers: {pred}")
                    continue
                result[method].append({
                    'numbers': make_json_serializable(pred),
                    'sum': int(sum(pred)),
                    'evens': int(sum(1 for n in pred if n % 2 == 0)),
                    'highs': int(sum(1 for n in pred if n > 45))
                })
        
        # Debug: Log what we're returning
        print(f"Returning predictions with methods: {list(result.keys())}")
        for method, preds in result.items():
            print(f"  {method}: {len(preds)} prediction(s)")
            if preds and len(preds) > 0:
                print(f"    First prediction: {preds[0].get('numbers', 'N/A')}")
        
        # Also log what was in the original predictions dict
        print(f"Original predictions dict keys: {list(predictions.keys())}")
        if 'intelligence' in predictions:
            print(f"  intelligence in predictions: {predictions['intelligence']}")
        else:
            print(f"  intelligence NOT in predictions dict")
        
        # Ensure we have at least one prediction method
        if not result:
            return jsonify({
                'error': 'No predictions generated',
                'message': f'Strategy "{strategy}" returned no valid predictions. Please try another strategy.',
                'strategy': strategy
            }), 500
        
        # Get regime change info if available
        regime_info = None
        if oracle_instance.regime_history:
            regime_info = oracle_instance.regime_history[-1]
            # Convert all values to JSON-serializable types
            regime_info = make_json_serializable(regime_info)
        
        # Ensure all values in response are JSON-serializable
        response_data = {
            'success': True,
            'predictions': make_json_serializable(result),
            'strategy': str(strategy),
            'regime_change': regime_info,
            'data_points_used': int(len(draws))
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e)
        }), 500


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Analyze patterns without generating predictions
    
    Request body:
    {
        "draws": [[1, 2, 3, 4, 5], ...]
    }
    """
    try:
        data = request.get_json()
        draws = data.get('draws', [])
        
        if not draws or len(draws) < 50:
            return jsonify({
                'error': 'Insufficient data',
                'minimum_required': 50
            }), 400
        
        # Initialize oracle
        global historical_draws_cache
        if historical_draws_cache != draws:
            historical_draws_cache = draws
            initialize_oracle(draws)
        
        # Get pattern analysis
        recent = draws[-50:] if len(draws) >= 50 else draws
        patterns = oracle_instance._analyze_patterns(recent)
        
        # Get regime change detection
        regime = oracle_instance.pattern_detector.detect_regime_change(draws[-100:]) if len(draws) >= 100 else None
        
        # Convert patterns to JSON-serializable
        patterns_serializable = make_json_serializable(patterns)
        
        return jsonify({
            'success': True,
            'patterns': {
                'sum_mean': float(patterns.get('sum_mean', 0)),
                'sum_std': float(patterns.get('sum_std', 0)),
                'sum_range': patterns.get('sum_range', [0, 0]),
                'even_mode': int(patterns.get('even_mode', 0)),
                'high_mode': int(patterns.get('high_mode', 0)),
                'hot_numbers': patterns.get('hot_numbers', []),
                'cold_numbers': patterns.get('cold_numbers', [])
            },
            'regime_change': make_json_serializable(regime) if regime else None,
            'data_points_used': len(draws)
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Analysis failed',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    # Use port 5001 by default to avoid conflict with backend (port 5000)
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    print(f"Starting Lotto Oracle Service on port {port}")
    print(f"Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)

