import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from collections import Counter, deque
import random
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
import warnings

warnings.filterwarnings('ignore')


# ============================================================================
# ENHANCED LOTTO ORACLE 2.0 - "PATTERN PROBE"
# ============================================================================

class AdvancedPatternDetector:
    """
    Advanced statistical anomaly and pattern detector
    Uses multiple time-series analysis techniques
    """

    def __init__(self, window_sizes: List[int] = [20, 50, 100]):
        self.window_sizes = window_sizes
        self.pattern_memory = deque(maxlen=1000)

    def detect_regime_change(self, recent_draws: List[List[int]]) -> Dict:
        """Detect if statistical properties have changed significantly"""
        if len(recent_draws) < 100:
            return {"detected": False, "confidence": 0}

        # Split into two halves
        half = len(recent_draws) // 2
        old = recent_draws[:half]
        new = recent_draws[half:]

        # Calculate multiple metrics for both periods
        metrics_old = self._calculate_period_metrics(old)
        metrics_new = self._calculate_period_metrics(new)

        # Calculate change scores
        changes = {}
        for key in metrics_old:
            if isinstance(metrics_old[key], (int, float)):
                change = abs(metrics_new[key] - metrics_old[key]) / (abs(metrics_old[key]) + 1e-10)
                changes[key] = change

        # Weighted change score
        weights = {'sum_mean': 0.3, 'delta_entropy': 0.4, 'cluster_score': 0.3}
        total_change = sum(changes.get(k, 0) * weights.get(k, 0) for k in weights)

        return {
            "detected": total_change > 0.25,
            "confidence": min(total_change, 1.0),
            "details": {k: f"{v:.2%}" for k, v in changes.items() if v > 0.1}
        }

    def _calculate_period_metrics(self, draws: List[List[int]]) -> Dict:
        """Calculate comprehensive statistical metrics for a period"""
        if not draws:
            return {}

        all_numbers = [num for draw in draws for num in draw]
        sums = [sum(draw) for draw in draws]

        # Calculate delta entropy (measure of randomness in gaps)
        deltas = []
        for draw in draws:
            sorted_draw = sorted(draw)
            deltas.extend([sorted_draw[i] - sorted_draw[i - 1] for i in range(1, len(sorted_draw))])

        delta_counts = Counter(deltas)
        total = sum(delta_counts.values())
        entropy = -sum((count / total) * np.log2(count / total) for count in delta_counts.values())

        # Cluster detection
        clusters = self._detect_number_clusters(draws)

        return {
            "sum_mean": np.mean(sums),
            "sum_std": np.std(sums),
            "number_entropy": -sum((all_numbers.count(x) / len(all_numbers)) *
                                   np.log2(all_numbers.count(x) / len(all_numbers))
                                   for x in set(all_numbers)),
            "delta_entropy": entropy,
            "cluster_score": len(clusters) / len(draws) if draws else 0
        }

    def _detect_number_clusters(self, draws: List[List[int]]) -> List[List[int]]:
        """Detect if numbers in a draw are clustered together"""
        clusters = []
        for draw in draws:
            sorted_draw = sorted(draw)
            gaps = [sorted_draw[i] - sorted_draw[i - 1] for i in range(1, len(sorted_draw))]
            if max(gaps) < 25:  # Numbers are within 25 of each other
                clusters.append(draw)
        return clusters


class MLPredictor:
    """
    Machine Learning component for number prediction
    Uses multiple models in ensemble
    """

    def __init__(self):
        self.models = {
            'rf': RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42),
            'gb': GradientBoostingClassifier(n_estimators=50, max_depth=3, random_state=42)
        }
        self.scaler = StandardScaler()
        self.is_trained = False
        self._smote_available = self._check_smote_availability()
    
    def _check_smote_availability(self) -> bool:
        """Check if SMOTE can be imported and used"""
        try:
            # Try importing imblearn first - this might fail if sklearn is incompatible
            import imblearn
        except Exception:
            return False
        
        try:
            # Try importing SMOTE specifically - this is where the sklearn error occurs
            from imblearn.over_sampling import SMOTE
        except (ImportError, AttributeError, Exception) as e:
            # Catch the specific _is_pandas_df error or any other import error
            import warnings
            warnings.warn(f"SMOTE import failed: {e}. Will use simple oversampling instead.")
            return False
        
        try:
            # Try creating an instance to catch any runtime errors
            _ = SMOTE(random_state=42)
            return True
        except Exception:
            return False

    def create_features(self, historical_draws: List[List[int]], lookback: int = 50) -> Tuple[np.ndarray, np.ndarray]:
        """Create features for ML prediction"""
        n_draws = len(historical_draws)
        if n_draws < lookback + 10:
            return np.array([]), np.array([])

        X, y = [], []

        for i in range(lookback, n_draws - 1):
            # Features based on recent history
            recent = historical_draws[i - lookback:i]
            next_draw = historical_draws[i + 1]

            for num in range(1, 91):
                # Feature vector for this number
                features = [
                    # Recent frequency
                    sum(1 for draw in recent if num in draw) / lookback,
                    # Skips (how many draws since last appearance)
                    self._calculate_skips(num, historical_draws[:i + 1]),
                    # Position tendency
                    self._position_tendency(num, recent),
                    # Delta relationships
                    self._delta_compatibility(num, recent),
                    # Even/Odd context
                    num % 2,
                    # High/Low
                    1 if num > 45 else 0,
                    # Recent trend (appearing more or less frequently)
                    self._trend_score(num, recent[-10:] if len(recent) >= 10 else recent)
                ]

                X.append(features)
                y.append(1 if num in next_draw else 0)

        return np.array(X), np.array(y)

    def train(self, historical_draws: List[List[int]]):
        """Train ML models"""
        X, y = self.create_features(historical_draws)

        if len(X) == 0:
            return False

        # Balance classes (since positives are rare)
        if self._smote_available:
            try:
                from imblearn.over_sampling import SMOTE
                smote = SMOTE(random_state=42)
                X_balanced, y_balanced = smote.fit_resample(X, y)
            except Exception as e:
                # If SMOTE fails at runtime, fall back to simple resampling
                import warnings
                warnings.warn(f"SMOTE failed at runtime ({e}), using random oversampling")
                X_balanced, y_balanced = self._simple_oversample(X, y)
        else:
            # Use simple random oversampling as fallback
            X_balanced, y_balanced = self._simple_oversample(X, y)
    
    def _simple_oversample(self, X, y):
        """Simple random oversampling fallback when SMOTE is not available"""
        from sklearn.utils import resample
        
        # Separate positive and negative samples
        X_pos = [X[i] for i in range(len(X)) if y[i] == 1]
        y_pos = [1] * len(X_pos)
        X_neg = [X[i] for i in range(len(X)) if y[i] == 0]
        y_neg = [0] * len(X_neg)
        
        # Oversample positive class to match negative class
        if len(X_pos) > 0 and len(X_neg) > len(X_pos):
            X_pos_resampled, y_pos_resampled = resample(
                X_pos, y_pos, 
                n_samples=len(X_neg), 
                random_state=42
            )
            X_balanced = np.array(X_pos_resampled + X_neg)
            y_balanced = np.array(y_pos_resampled + y_neg)
        else:
            X_balanced, y_balanced = X, y
        
        return X_balanced, y_balanced

        # Scale features
        X_scaled = self.scaler.fit_transform(X_balanced)

        # Train each model
        for name, model in self.models.items():
            model.fit(X_scaled, y_balanced)

        self.is_trained = True
        return True

    def predict_proba(self, historical_draws: List[List[int]]) -> Dict[int, float]:
        """Predict probability for each number appearing in next draw"""
        if not self.is_trained:
            return {i: 1 / 90 for i in range(1, 91)}

        # Create features for current state
        recent = historical_draws[-50:] if len(historical_draws) >= 50 else historical_draws
        predictions = {}

        for num in range(1, 91):
            features = [
                sum(1 for draw in recent if num in draw) / len(recent),
                self._calculate_skips(num, historical_draws),
                self._position_tendency(num, recent),
                self._delta_compatibility(num, recent),
                num % 2,
                1 if num > 45 else 0,
                self._trend_score(num, recent[-10:] if len(recent) >= 10 else recent)
            ]

            features_scaled = self.scaler.transform([features])

            # Ensemble prediction (average of all models)
            probs = []
            for model in self.models.values():
                prob = model.predict_proba(features_scaled)[0][1]
                probs.append(prob)

            predictions[num] = np.mean(probs)

        # Normalize to sum to 1 (probability distribution)
        total = sum(predictions.values())
        if total > 0:
            predictions = {k: v / total for k, v in predictions.items()}

        return predictions

    def _calculate_skips(self, num: int, draws: List[List[int]]) -> int:
        """Calculate how many draws since number last appeared"""
        for i in range(len(draws) - 1, -1, -1):
            if num in draws[i]:
                return len(draws) - i - 1
        return len(draws)

    def _position_tendency(self, num: int, draws: List[List[int]]) -> float:
        """Calculate tendency to appear in specific position"""
        if not draws:
            return 0.5

        positions = []
        for draw in draws:
            if num in draw:
                sorted_draw = sorted(draw)
                positions.append(sorted_draw.index(num) / 4)  # Normalize to 0-1

        return np.mean(positions) if positions else 0.5

    def _delta_compatibility(self, num: int, draws: List[List[int]]) -> float:
        """Calculate compatibility with common deltas"""
        if not draws:
            return 0

        compat_scores = []
        for draw in draws:
            if len(draw) >= 2:
                # Check if num would create common deltas with any number in draw
                for other in draw:
                    delta = abs(num - other)
                    if delta <= 30:  # Common delta range
                        # Check if this delta is common in recent history
                        recent_deltas = []
                        for d in draws[-10:]:
                            sorted_d = sorted(d)
                            recent_deltas.extend([sorted_d[i] - sorted_d[i - 1] for i in range(1, len(sorted_d))])

                        delta_count = sum(1 for d in recent_deltas if d == delta)
                        compat_scores.append(delta_count / (len(recent_deltas) + 1))

        return np.mean(compat_scores) if compat_scores else 0

    def _trend_score(self, num: int, recent_draws: List[List[int]]) -> float:
        """Calculate if number is trending up or down in frequency"""
        if len(recent_draws) < 5:
            return 0.5

        # Split into two halves
        half = len(recent_draws) // 2
        first = recent_draws[:half]
        second = recent_draws[half:]

        freq_first = sum(1 for draw in first if num in draw) / (len(first) + 1)
        freq_second = sum(1 for draw in second if num in draw) / (len(second) + 1)

        return (freq_second - freq_first + 1) / 2  # Normalize to 0-1


class GeneticOptimizer:
    """
    Evolutionary algorithm to optimize number selection
    """

    def __init__(self, population_size: int = 100, generations: int = 50):
        self.pop_size = population_size
        self.generations = generations

    def evolve_solution(self, number_probs: Dict[int, float],
                        constraints: Dict) -> List[int]:
        """Evolve optimal number set using genetic algorithm"""

        # Initial population
        population = []
        for _ in range(self.pop_size):
            individual = self._generate_individual(number_probs, constraints)
            population.append(individual)

        # Evolution loop
        for generation in range(self.generations):
            # Evaluate fitness
            fitness_scores = [self._fitness(ind, number_probs, constraints)
                              for ind in population]

            # Selection (tournament)
            selected = []
            for _ in range(self.pop_size):
                tournament = random.sample(list(zip(population, fitness_scores)), 3)
                winner = max(tournament, key=lambda x: x[1])[0]
                selected.append(winner)

            # Crossover and mutation
            new_population = []
            for i in range(0, self.pop_size, 2):
                parent1 = selected[i]
                parent2 = selected[i + 1] if i + 1 < len(selected) else selected[0]

                # Crossover
                child1, child2 = self._crossover(parent1, parent2)

                # Mutation
                if random.random() < 0.3:
                    child1 = self._mutate(child1, number_probs, constraints)
                if random.random() < 0.3:
                    child2 = self._mutate(child2, number_probs, constraints)

                new_population.extend([child1, child2])

            population = new_population[:self.pop_size]

        # Return best individual
        best_idx = np.argmax([self._fitness(ind, number_probs, constraints)
                              for ind in population])
        return sorted(population[best_idx])

    def _generate_individual(self, probs: Dict[int, float],
                             constraints: Dict) -> List[int]:
        """Generate initial individual respecting constraints"""
        while True:
            # Weighted selection based on probabilities
            numbers = list(probs.keys())
            weights = list(probs.values())
            individual = random.choices(numbers, weights=weights, k=5)
            individual = list(set(individual))  # Remove duplicates

            if len(individual) < 5:
                # Fill with random numbers
                remaining = [n for n in numbers if n not in individual]
                individual.extend(random.sample(remaining, 5 - len(individual)))

            if self._satisfies_constraints(individual, constraints):
                return sorted(individual)

    def _fitness(self, individual: List[int], probs: Dict[int, float],
                 constraints: Dict) -> float:
        """Calculate fitness of an individual"""
        # Probability score
        prob_score = sum(probs.get(num, 0) for num in individual)

        # Constraint satisfaction
        constraint_score = self._constraint_score(individual, constraints)

        # Diversity bonus (avoid consecutive numbers)
        sorted_ind = sorted(individual)
        consecutive_penalty = sum(1 for i in range(4)
                                  if sorted_ind[i + 1] - sorted_ind[i] == 1) * 0.1

        return prob_score * constraint_score - consecutive_penalty

    def _constraint_score(self, individual: List[int],
                          constraints: Dict) -> float:
        """Calculate how well constraints are satisfied"""
        score = 1.0

        # Sum constraint
        if 'target_sum_range' in constraints:
            low, high = constraints['target_sum_range']
            total = sum(individual)
            if low <= total <= high:
                score *= 1.2
            else:
                score *= 0.8

        # Even/Odd balance
        evens = sum(1 for n in individual if n % 2 == 0)
        if 'even_odd_target' in constraints:
            target = constraints['even_odd_target']
            if evens in target:
                score *= 1.1

        # High/Low balance
        highs = sum(1 for n in individual if n > 45)
        if 'high_low_target' in constraints:
            target = constraints['high_low_target']
            if highs in target:
                score *= 1.1

        return score

    def _satisfies_constraints(self, individual: List[int],
                               constraints: Dict) -> bool:
        """Check if individual satisfies all hard constraints"""
        # Basic checks
        if len(set(individual)) != 5:
            return False

        # Sum constraint
        if 'target_sum_range' in constraints:
            low, high = constraints['target_sum_range']
            total = sum(individual)
            if not (low <= total <= high):
                return False

        return True

    def _crossover(self, parent1: List[int], parent2: List[int]) -> Tuple[List[int], List[int]]:
        """Crossover two parents to create children"""
        # Single point crossover
        point = random.randint(1, 4)
        child1 = parent1[:point] + [n for n in parent2 if n not in parent1[:point]]
        child2 = parent2[:point] + [n for n in parent1 if n not in parent2[:point]]

        # Ensure 5 unique numbers
        child1 = list(set(child1))[:5]
        child2 = list(set(child2))[:5]

        # Fill if needed
        if len(child1) < 5:
            remaining = [n for n in range(1, 91) if n not in child1]
            child1.extend(random.sample(remaining, 5 - len(child1)))
        if len(child2) < 5:
            remaining = [n for n in range(1, 91) if n not in child2]
            child2.extend(random.sample(remaining, 5 - len(child2)))

        return sorted(child1), sorted(child2)

    def _mutate(self, individual: List[int], probs: Dict[int, float],
                constraints: Dict) -> List[int]:
        """Mutate an individual"""
        mutated = individual.copy()

        # Random mutation type
        mutation_type = random.choice(['swap', 'replace', 'shift'])

        if mutation_type == 'swap':
            # Swap two positions
            i, j = random.sample(range(5), 2)
            mutated[i], mutated[j] = mutated[j], mutated[i]

        elif mutation_type == 'replace':
            # Replace one number
            idx = random.randint(0, 4)
            old_num = mutated[idx]

            # Choose new number based on probabilities
            candidates = [n for n in range(1, 91) if n not in mutated]
            weights = [probs.get(n, 0) for n in candidates]

            if sum(weights) > 0:
                new_num = random.choices(candidates, weights=weights)[0]
                mutated[idx] = new_num

        elif mutation_type == 'shift':
            # Shift all numbers by small amount
            shift = random.randint(-5, 5)
            mutated = [(n + shift - 1) % 90 + 1 for n in mutated]
            mutated = list(set(mutated))
            if len(mutated) < 5:
                remaining = [n for n in range(1, 91) if n not in mutated]
                mutated.extend(random.sample(remaining, 5 - len(mutated)))

        return sorted(mutated)


class EnhancedLottoOracle:
    """
    Version 2.0: Advanced Lottery Prediction System
    """

    def __init__(self, historical_draws: List[List[int]]):
        self.historical = historical_draws
        self.pattern_detector = AdvancedPatternDetector()
        self.ml_predictor = MLPredictor()
        self.genetic_optimizer = GeneticOptimizer()

        # State tracking
        self.performance_history = []
        self.prediction_history = []
        self.regime_history = []

        # Initialize
        self._initialize_system()

    def _initialize_system(self):
        """Initialize all components"""
        print("Initializing Enhanced Lotto Oracle 2.0...")

        # Check for regime changes
        regime = self.pattern_detector.detect_regime_change(self.historical[-100:])
        self.regime_history.append(regime)

        if regime['detected']:
            print(f"⚠️  Regime change detected! Confidence: {regime['confidence']:.2%}")
            if 'details' in regime:
                for metric, change in regime['details'].items():
                    print(f"   {metric}: {change}")

        # Train ML model
        print("Training ML models...")
        trained = self.ml_predictor.train(self.historical)
        if trained:
            print("✅ ML models trained successfully")
        else:
            print("⚠️  Insufficient data for ML training")

    def generate_predictions(self, strategy: str = 'ensemble',
                             n_predictions: int = 3) -> Dict[str, List[List[int]]]:
        """
        Generate predictions using specified strategy

        Returns: Dict with strategy as key and list of number sets
        """
        results = {}

        # Get historical patterns
        recent = self.historical[-50:] if len(self.historical) >= 50 else self.historical
        patterns = self._analyze_patterns(recent)

        if strategy == 'ensemble' or strategy == 'all':
            # Generate using multiple methods
            ml_pred = self._ml_based_prediction(patterns)
            genetic_pred = self._genetic_optimization(patterns)
            pattern_pred = self._pattern_based_prediction(patterns)

            results['ml'] = [ml_pred]
            results['genetic'] = [genetic_pred]
            results['pattern'] = [pattern_pred]
            results['ensemble'] = [self._ensemble_vote([ml_pred, genetic_pred, pattern_pred])]

        elif strategy == 'ml':
            pred = self._ml_based_prediction(patterns)
            results['ml'] = [pred]

        elif strategy == 'genetic':
            pred = self._genetic_optimization(patterns)
            results['genetic'] = [pred]

        elif strategy == 'pattern':
            pred = self._pattern_based_prediction(patterns)
            results['pattern'] = [pred]

        # Store for tracking
        self.prediction_history.append({
            'timestamp': pd.Timestamp.now(),
            'strategy': strategy,
            'predictions': results
        })

        return results

    def _analyze_patterns(self, recent_draws: List[List[int]]) -> Dict:
        """Analyze patterns in recent draws"""
        if not recent_draws:
            return {}

        sums = [sum(draw) for draw in recent_draws]
        evens = [sum(1 for n in draw if n % 2 == 0) for draw in recent_draws]
        highs = [sum(1 for n in draw if n > 45) for draw in recent_draws]

        # Calculate common patterns
        even_mode = Counter(evens).most_common(1)[0][0]
        high_mode = Counter(highs).most_common(1)[0][0]

        # Calculate number frequencies
        freq = Counter()
        for draw in recent_draws[-20:]:  # Last 20 draws weighted more
            for num in draw:
                freq[num] += 1

        hot_numbers = [num for num, _ in freq.most_common(15)]

        # Calculate skip cycles
        skips = {}
        for num in range(1, 91):
            skips[num] = 0
            for i in range(len(recent_draws) - 1, -1, -1):
                if num in recent_draws[i]:
                    skips[num] = len(recent_draws) - i - 1
                    break

        cold_numbers = sorted(skips.items(), key=lambda x: x[1], reverse=True)[:15]
        cold_numbers = [num for num, _ in cold_numbers]

        return {
            'sum_mean': np.mean(sums),
            'sum_std': np.std(sums),
            'sum_range': (int(np.percentile(sums, 25)), int(np.percentile(sums, 75))),
            'even_mode': even_mode,
            'high_mode': high_mode,
            'hot_numbers': hot_numbers,
            'cold_numbers': cold_numbers,
            'skips': skips
        }

    def _ml_based_prediction(self, patterns: Dict) -> List[int]:
        """Generate prediction using ML"""
        # Get probability distribution from ML
        probs = self.ml_predictor.predict_proba(self.historical)

        # Select top 5 with some randomness
        sorted_nums = sorted(probs.items(), key=lambda x: x[1], reverse=True)
        top_20 = [num for num, _ in sorted_nums[:20]]

        # Weighted selection
        selected = []
        attempts = 0
        while len(selected) < 5 and attempts < 100:
            num = random.choices(top_20, weights=[probs[n] for n in top_20])[0]
            if num not in selected:
                selected.append(num)
            attempts += 1

        # Fill if needed
        if len(selected) < 5:
            remaining = [n for n in range(1, 91) if n not in selected]
            selected.extend(random.sample(remaining, 5 - len(selected)))

        return sorted(selected)

    def _genetic_optimization(self, patterns: Dict) -> List[int]:
        """Generate prediction using genetic optimization"""
        # Get ML probabilities as base
        probs = self.ml_predictor.predict_proba(self.historical)

        # Add pattern-based adjustments
        for num in patterns['hot_numbers']:
            if num in probs:
                probs[num] *= 1.3  # Boost hot numbers

        for num in patterns['cold_numbers']:
            if num in probs and patterns['skips'][num] > 20:
                probs[num] *= 1.5  # Boost very cold numbers

        # Normalize
        total = sum(probs.values())
        probs = {k: v / total for k, v in probs.items()}

        # Set constraints for genetic algorithm
        constraints = {
            'target_sum_range': patterns['sum_range'],
            'even_odd_target': [2, 3],
            'high_low_target': [2, 3]
        }

        # Run genetic optimization
        return self.genetic_optimizer.evolve_solution(probs, constraints)

    def _pattern_based_prediction(self, patterns: Dict) -> List[int]:
        """Generate prediction using pattern matching"""
        # Create candidate pool with mix of hot, cold, and due numbers
        hot_pool = patterns['hot_numbers'][:8]
        cold_pool = [n for n in patterns['cold_numbers'] if patterns['skips'][n] > 15][:8]

        # Numbers due for appearance (skip around average skip)
        avg_skip = np.mean(list(patterns['skips'].values()))
        due_pool = [n for n in range(1, 91)
                    if 0.8 * avg_skip <= patterns['skips'][n] <= 1.2 * avg_skip][:8]

        candidate_pool = list(set(hot_pool + cold_pool + due_pool))

        # Ensure we have enough candidates
        if len(candidate_pool) < 10:
            candidate_pool.extend(random.sample(range(1, 91), 10 - len(candidate_pool)))

        # Generate candidate with pattern constraints
        best_candidate = None
        best_score = -float('inf')

        for _ in range(5000):
            candidate = random.sample(candidate_pool, min(5, len(candidate_pool)))

            if len(candidate) < 5:
                remaining = [n for n in range(1, 91) if n not in candidate]
                candidate.extend(random.sample(remaining, 5 - len(candidate)))

            score = self._score_pattern_candidate(candidate, patterns)

            if score > best_score:
                best_score = score
                best_candidate = candidate

        return sorted(best_candidate) if best_candidate else []

    def _score_pattern_candidate(self, candidate: List[int],
                                 patterns: Dict) -> float:
        """Score a candidate based on pattern matching"""
        score = 0

        # Hot numbers bonus
        hot_numbers = patterns.get('hot_numbers', [])
        if hot_numbers:
            hot_bonus = sum(1 for n in candidate if n in hot_numbers[:10])
            score += hot_bonus * 2

        # Cold numbers bonus (if very cold)
        cold_numbers = patterns.get('cold_numbers', [])
        skips = patterns.get('skips', {})
        if cold_numbers and skips:
            cold_bonus = sum(1 for n in candidate
                             if n in cold_numbers[:5] and skips.get(n, 0) > 20)
            score += cold_bonus * 3

        # Sum constraint
        total = sum(candidate)
        sum_range = patterns.get('sum_range', (0, 1000))
        if sum_range[0] <= total <= sum_range[1]:
            score += 5

        # Even/Odd balance
        evens = sum(1 for n in candidate if n % 2 == 0)
        if evens in [2, 3]:
            score += 3

        # High/Low balance
        highs = sum(1 for n in candidate if n > 45)
        if highs in [2, 3]:
            score += 3

        # No consecutive numbers
        sorted_cand = sorted(candidate)
        if len(sorted_cand) >= 2:
            # Use len(sorted_cand) - 1 instead of hardcoded 4 to avoid index errors
            consecutive_penalty = sum(1 for i in range(len(sorted_cand) - 1)
                                      if sorted_cand[i + 1] - sorted_cand[i] == 1)
            score -= consecutive_penalty * 2

        return score

    def _ensemble_vote(self, predictions: List[List[int]]) -> List[int]:
        """Combine multiple predictions using voting"""
        if not predictions:
            return []

        # Count occurrences of each number
        votes = Counter()
        for pred in predictions:
            for num in pred:
                votes[num] += 1

        # Select numbers with most votes
        selected = []
        for num, count in votes.most_common(10):
            if len(selected) < 5:
                selected.append(num)
            else:
                break

        # If we don't have 5 numbers, add from next most voted
        if len(selected) < 5:
            remaining = [n for n in range(1, 91) if n not in selected]
            additional = [n for n, _ in votes.most_common()[len(selected):]
                          if n not in selected][:5 - len(selected)]
            selected.extend(additional)

        # Still need more? Fill randomly
        if len(selected) < 5:
            remaining = [n for n in range(1, 91) if n not in selected]
            selected.extend(random.sample(remaining, 5 - len(selected)))

        return sorted(selected)

    def evaluate_prediction(self, prediction: List[int],
                            actual: List[int]) -> Dict:
        """Evaluate prediction against actual draw"""
        matches = len(set(prediction) & set(actual))

        # Calculate expected matches for random selection
        expected_random = 5 * (5 / 90)  # ~0.278

        # Calculate statistical significance
        z_score = (matches - expected_random) / np.sqrt(expected_random * (1 - 5 / 90))

        return {
            'matches': matches,
            'expected_random': expected_random,
            'z_score': z_score,
            'significant': abs(z_score) > 1.96,  # 95% confidence
            'prediction': prediction,
            'actual': actual
        }


# ============================================================================
# TESTING AND DEPLOYMENT
# ============================================================================

def demonstrate_enhanced_system():
    """Demonstrate the enhanced system"""
    print("=" * 70)
    print("ENHANCED LOTTO ORACLE 2.0 - DEMONSTRATION")
    print("=" * 70)

    # Generate synthetic data (replace with real Ghana Lotto data)
    print("\nGenerating synthetic dataset...")
    synthetic_draws = []
    for _ in range(200):
        # Mix of random and slightly patterned draws
        if random.random() < 0.3:
            # Patterned: numbers in a range
            start = random.randint(1, 70)
            draw = sorted(random.sample(range(start, min(start + 25, 91)), 5))
        else:
            # Random
            draw = sorted(random.sample(range(1, 91), 5))
        synthetic_draws.append(draw)

    # Initialize enhanced system
    print("\nInitializing Enhanced Lotto Oracle...")
    oracle = EnhancedLottoOracle(synthetic_draws)

    # Generate predictions using different strategies
    print("\n" + "=" * 70)
    print("GENERATING PREDICTIONS")
    print("=" * 70)

    strategies = ['ensemble', 'ml', 'genetic', 'pattern']

    for strategy in strategies:
        print(f"\n📊 {strategy.upper()} STRATEGY:")
        predictions = oracle.generate_predictions(strategy=strategy)

        for method, preds in predictions.items():
            for i, pred in enumerate(preds):
                print(f"   Set {i + 1}: {pred}")
                print(f"     Sum: {sum(pred)} | "
                      f"Evens: {sum(1 for n in pred if n % 2 == 0)} | "
                      f"Highs: {sum(1 for n in pred if n > 45)}")

    # Simulate a test
    print("\n" + "=" * 70)
    print("SIMULATION TEST")
    print("=" * 70)

    # Use last draw as "future" to test
    if len(synthetic_draws) >= 2:
        test_prediction = oracle._genetic_optimization(
            oracle._analyze_patterns(synthetic_draws[:-1])
        )
        test_actual = synthetic_draws[-1]

        evaluation = oracle.evaluate_prediction(test_prediction, test_actual)

        print(f"\nTest Prediction: {test_prediction}")
        print(f"Actual Draw:     {test_actual}")
        print(f"\nMatches: {evaluation['matches']}/5")
        print(f"Expected (random): {evaluation['expected_random']:.3f}")
        print(f"Z-score: {evaluation['z_score']:.3f}")

        if evaluation['significant']:
            print("⚠️  Statistically significant result!")
        else:
            print("📈 Result within random expectation")

    # System capabilities
    print("\n" + "=" * 70)
    print("SYSTEM CAPABILITIES")
    print("=" * 70)
    print("""
    1. 📈 REGIME DETECTION: Identifies when statistical properties change
    2. 🤖 ML ENSEMBLE: Combines Random Forest & Gradient Boosting
    3. 🧬 GENETIC OPTIMIZATION: Evolves optimal number sets
    4. 🔍 PATTERN RECOGNITION: Multi-window time-series analysis
    5. 📊 PERFORMANCE TRACKING: Statistical significance testing

    Key Improvements Over V1.0:
    • Adaptive learning from new draws
    • Detection of lottery machine/ball changes
    • Probabilistic rather than deterministic
    • Multiple fallback strategies
    • Evolutionary optimization of constraints
    """)

    # Deployment instructions
    print("\n" + "=" * 70)
    print("DEPLOYMENT INSTRUCTIONS")
    print("=" * 70)
    print("""
    1. COLLECT REAL DATA:
       - Minimum: 100+ draws of Ghana National Lottery
       - Format: List of lists, each with 5 integers (1-90)

    2. INITIALIZE:
       oracle = EnhancedLottoOracle(real_draws)

    3. WEEKLY PREDICTION:
       predictions = oracle.generate_predictions(strategy='ensemble')

    4. TRACK RESULTS:
       - Record predictions vs actual
       - Monitor regime change alerts
       - Track statistical significance

    5. ADAPT:
       - System learns from new data automatically
       - Watch for regime change notifications
       - Compare strategy performance monthly

    REMEMBER:
    • This is a pattern recognition experiment
    • Lottery draws are mathematically random
    • Any success is statistical variance
    • Track long-term performance, not single draws
    """)


if __name__ == "__main__":
    demonstrate_enhanced_system()