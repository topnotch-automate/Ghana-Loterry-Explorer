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
        "strategy": "ensemble",  # Options: "ensemble", "ml", "genetic", "pattern"
        "n_predictions": 3
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        draws = data.get('draws', [])
        strategy = data.get('strategy', 'ensemble')
        n_predictions = data.get('n_predictions', 3)
        
        # Validate draws format
        if not draws or not isinstance(draws, list):
            return jsonify({'error': 'Invalid draws format. Expected list of lists'}), 400
        
        # Validate each draw
        for draw in draws:
            if not isinstance(draw, list) or len(draw) != 5:
                return jsonify({'error': 'Each draw must be a list of exactly 5 numbers'}), 400
            if not all(isinstance(n, int) and 1 <= n <= 90 for n in draw):
                return jsonify({'error': 'Numbers must be integers between 1 and 90'}), 400
        
        # Check minimum data requirement
        if len(draws) < 60:
            return jsonify({
                'error': 'Insufficient data',
                'message': f'Need at least 60 draws for ML training. Got {len(draws)}',
                'minimum_required': 60
            }), 400
        
        # Initialize or update oracle if data changed
        global historical_draws_cache
        if historical_draws_cache != draws:
            historical_draws_cache = draws
            initialize_oracle(draws)
        
        # Generate predictions
        predictions = oracle_instance.generate_predictions(
            strategy=strategy,
            n_predictions=n_predictions
        )
        
        # Convert predictions to JSON-serializable format
        result = {}
        for method, preds in predictions.items():
            result[method] = []
            for pred in preds:
                result[method].append({
                    'numbers': make_json_serializable(pred),
                    'sum': int(sum(pred)),
                    'evens': int(sum(1 for n in pred if n % 2 == 0)),
                    'highs': int(sum(1 for n in pred if n > 45))
                })
        
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

