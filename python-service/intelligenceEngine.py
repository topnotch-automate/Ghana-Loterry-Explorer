"""
Ghana Lotto Intelligence Engine v2.0
Implements the advanced prediction system from pipeline.md with machine number influence
"""

import numpy as np
from typing import List, Dict, Tuple
from collections import Counter, defaultdict
from itertools import combinations
import hashlib
import random

# Configuration
N_NUMBERS = 90
WIN_COUNT = 5
MACHINE_COUNT = 5
LAGS = [1, 2, 3]
LAG_WEIGHTS = {1: 1.0, 2: 0.7, 3: 0.4}
LAMBDA_DECAY = 0.15
BURST_WINDOW = 10


class IntelligenceEngine:
    """
    Advanced Intelligence Engine for Ghana Lotto predictions
    Uses machine numbers to predict winning numbers with sophisticated pattern analysis
    """
    
    def __init__(self, historical_draws: List[List[int]], machine_draws: List[List[int]], seed: int = None):
        """
        Initialize with historical data
        
        Args:
            historical_draws: List of winning number sets (each is 5 numbers)
            machine_draws: List of machine number sets (each is 5 numbers)
            seed: Optional seed for deterministic behavior
        """
        if not historical_draws or not machine_draws:
            raise ValueError("Historical and machine draws cannot be empty")
        
        if len(historical_draws) != len(machine_draws):
            raise ValueError(f"Historical and machine draws must have same length. Got {len(historical_draws)} historical and {len(machine_draws)} machine draws")
        
        # Validate that all draws have valid length
        for i, draw in enumerate(historical_draws):
            if not draw or len(draw) != 5:
                raise ValueError(f"Historical draw {i} has invalid length: {len(draw) if draw else 0} (expected 5)")
        
        for i, draw in enumerate(machine_draws):
            if not draw or len(draw) != 5:
                raise ValueError(f"Machine draw {i} has invalid length: {len(draw) if draw else 0} (expected 5)")
        
        self.historical = historical_draws
        self.machines = machine_draws
        self.T = len(historical_draws)
        
        # Set seed for deterministic behavior
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed % (2**31))
        
        # Cache computed features
        self._temporal_scores = None
        self._lag_signatures = None
        self._burst_indices = None
        self._pair_gravities = None
        self._family_clusters = None
        self._number_states = None
        
    def compute_temporal_score(self, k: int) -> float:
        """
        Temporal Memory Engine: Recency + Decay
        TemporalScore(k) = Σ exp(-λ · Δt_i)
        """
        score = 0.0
        for i, draw in enumerate(self.historical):
            if k in draw:
                # Δt_i = distance from this win to now (in draws)
                delta_t = self.T - i - 1
                score += np.exp(-LAMBDA_DECAY * delta_t)
        return score
    
    def compute_lag_signature(self, k: int) -> float:
        """
        Machine → Winning Lag Engine
        LagSignature(k) = max( w1·L1(k), w2·L2(k), w3·L3(k) )
        """
        lag_probs = {}
        
        for lag in LAGS:
            count_machine = 0
            count_machine_then_win = 0
            
            for i in range(lag, self.T):
                # Check bounds before accessing
                if i - lag < 0 or i - lag >= len(self.machines) or i >= len(self.historical):
                    continue
                # Check if k was in machine at t-lag - with bounds checking
                if 0 <= i - lag < len(self.machines):
                    if k in self.machines[i - lag]:
                        count_machine += 1
                        # Check if k appears in winning at t - with bounds checking
                        if i < len(self.historical) and k in self.historical[i]:
                            count_machine_then_win += 1
            
            if count_machine > 0:
                lag_probs[lag] = count_machine_then_win / count_machine
            else:
                lag_probs[lag] = 0.0
        
        # Weighted maximum
        weighted_lags = [LAG_WEIGHTS[lag] * lag_probs[lag] for lag in LAGS if lag in lag_probs]
        return max(weighted_lags) if weighted_lags else 0.0
    
    def compute_burst_index(self, k: int) -> float:
        """
        Winning Density & Burst Detector
        BurstIndex(k) = (recent_win_count) / (mean_gap + ε)
        """
        # Find all indices where k appeared in winning
        win_indices = [i for i, draw in enumerate(self.historical) if k in draw]
        
        if len(win_indices) < 2:
            return 0.0
        
        # Calculate gaps between wins
        gaps = np.diff(win_indices)
        mean_gap = np.mean(gaps) if len(gaps) > 0 else self.T
        
        # Recent wins (within burst window)
        recent_wins = [i for i in win_indices if i >= self.T - BURST_WINDOW]
        recent_count = len(recent_wins)
        
        return (recent_count + 1) / (mean_gap + 1e-6)
    
    def compute_pair_gravity(self, i: int, j: int) -> float:
        """
        Relationship Intelligence: Pair Gravity
        PairGravity(i,j) = P(i & j win together) / (P(i win) · P(j win))
        """
        total = self.T
        pi = sum(1 for draw in self.historical if i in draw) / total
        pj = sum(1 for draw in self.historical if j in draw) / total
        pij = sum(1 for draw in self.historical if i in draw and j in draw) / total
        
        if pi * pj == 0:
            return 0.0
        
        return pij / (pi * pj)
    
    def compute_family_clusters(self, min_gravity: float = 1.2) -> Dict[int, List[int]]:
        """
        Family Clusters: Group numbers with high pair gravity
        Returns dict mapping cluster_id -> list of numbers
        """
        # Build graph of pair gravities
        pair_gravities = {}
        for i in range(1, N_NUMBERS + 1):
            for j in range(i + 1, N_NUMBERS + 1):
                gravity = self.compute_pair_gravity(i, j)
                if gravity >= min_gravity:
                    pair_gravities[(i, j)] = gravity
        
        # Simple clustering: numbers that share high-gravity pairs
        clusters = []
        used = set()
        
        for (i, j), gravity in sorted(pair_gravities.items(), key=lambda x: x[1], reverse=True):
            if i in used and j in used:
                continue
            
            # Find or create cluster
            cluster = None
            for c in clusters:
                if i in c or j in c:
                    cluster = c
                    break
            
            if cluster is None:
                cluster = []
                clusters.append(cluster)
            
            if i not in cluster:
                cluster.append(i)
                used.add(i)
            if j not in cluster:
                cluster.append(j)
                used.add(j)
        
        # Map cluster index to numbers
        return {idx: cluster for idx, cluster in enumerate(clusters)}
    
    def get_number_state(self, k: int) -> str:
        """
        Number State Model: Determine state of number k
        States: Dormant, Warming, Active, Overheated, Breakout
        """
        # Recent activity - with bounds checking
        recent_wins = sum(1 for i in range(max(0, self.T - 10), min(self.T, len(self.historical))) 
                         if i < len(self.historical) and k in self.historical[i])
        recent_machines = sum(1 for i in range(max(0, self.T - 10), min(self.T, len(self.machines))) 
                             if i < len(self.machines) and k in self.machines[i])
        
        # Time since last win - with bounds checking
        last_win_idx = None
        for i in range(min(self.T - 1, len(self.historical) - 1), -1, -1):
            if 0 <= i < len(self.historical) and k in self.historical[i]:
                last_win_idx = i
                break
        
        time_since_win = self.T - last_win_idx - 1 if last_win_idx is not None else self.T
        
        # Burst index
        burst = self.compute_burst_index(k)
        
        # Lag signature (machine influence)
        lag_sig = self.compute_lag_signature(k)
        
        # Determine state
        if recent_wins >= 3:
            return 'Overheated'
        elif recent_wins >= 1 or (recent_machines >= 2 and lag_sig > 0.3):
            return 'Active'
        elif recent_machines >= 1 or lag_sig > 0.2:
            return 'Warming'
        elif time_since_win > 30 and burst < 0.1:
            return 'Dormant'
        elif time_since_win > 20 and lag_sig > 0.15:
            return 'Breakout'
        else:
            return 'Dormant'
    
    def compute_unified_score(self, k: int, weights: Dict[str, float] = None) -> float:
        """
        Master Scoring Function
        Score(k) = α·TemporalScore(k) + β·LagSignature(k) + γ·BurstIndex(k) 
                  + δ·PairSupport(k) + ε·FamilySupport(k)
        """
        if weights is None:
            weights = {
                'temporal': 0.3,
                'lag': 0.25,
                'burst': 0.2,
                'pair': 0.15,
                'family': 0.1
            }
        
        # Compute base scores (cache for efficiency)
        if self._temporal_scores is None:
            self._temporal_scores = {k: self.compute_temporal_score(k) for k in range(1, N_NUMBERS + 1)}
        if self._lag_signatures is None:
            self._lag_signatures = {k: self.compute_lag_signature(k) for k in range(1, N_NUMBERS + 1)}
        if self._burst_indices is None:
            self._burst_indices = {k: self.compute_burst_index(k) for k in range(1, N_NUMBERS + 1)}
        
        temporal = self._temporal_scores.get(k, 0.0)
        lag = self._lag_signatures.get(k, 0.0)
        burst = self._burst_indices.get(k, 0.0)
        
        # Normalize scores (0-1 range)
        max_temporal = max(self._temporal_scores.values()) if self._temporal_scores else 1.0
        max_lag = max(self._lag_signatures.values()) if self._lag_signatures else 1.0
        max_burst = max(self._burst_indices.values()) if self._burst_indices else 1.0
        
        temporal_norm = temporal / (max_temporal + 1e-6)
        lag_norm = lag / (max_lag + 1e-6)
        burst_norm = burst / (max_burst + 1e-6)
        
        # Pair support (average gravity with top numbers) - optimized
        pair_support = 0.0
        top_15 = sorted(self._temporal_scores.items(), key=lambda x: x[1], reverse=True)[:15]
        top_nums = [n for n, _ in top_15 if n != k]
        
        # Sample top 5 for pair gravity to avoid O(n²) computation
        sample_size = min(5, len(top_nums))
        sampled = top_nums[:sample_size]
        
        for other_num in sampled:
            gravity = self.compute_pair_gravity(k, other_num)
            pair_support += gravity
        
        pair_support = pair_support / max(sample_size, 1)
        pair_norm = min(pair_support / 2.0, 1.0)  # Normalize (gravity > 2 is rare)
        
        # Family support
        if self._family_clusters is None:
            self._family_clusters = self.compute_family_clusters()
        
        family_support = 0.0
        for cluster in self._family_clusters.values():
            if k in cluster:
                # Boost if in cluster with other high-scoring numbers
                cluster_scores = [self._temporal_scores.get(n, 0.0) for n in cluster if n != k]
                if cluster_scores:
                    family_support = max(cluster_scores) / (max_temporal + 1e-6)
                break
        
        # State modifier
        state = self.get_number_state(k)
        state_modifiers = {
            'Active': 1.2,
            'Warming': 1.1,
            'Breakout': 1.15,
            'Overheated': 0.8,  # Penalty for just appeared
            'Dormant': 0.7
        }
        state_mod = state_modifiers.get(state, 1.0)
        
        # Compute unified score
        score = (
            weights['temporal'] * temporal_norm +
            weights['lag'] * lag_norm +
            weights['burst'] * burst_norm +
            weights['pair'] * pair_norm +
            weights['family'] * family_support
        ) * state_mod
        
        return score
    
    def score_ticket(self, ticket: List[int]) -> float:
        """
        Set (Ticket) Intelligence Engine
        TicketScore(T) = Σ Score(ki) + PairSynergy(T) + FamilyCoherence(T) - RedundancyPenalty(T)
        """
        if len(ticket) != 5:
            return 0.0
        
        # Ensure caches are initialized
        if self._temporal_scores is None:
            _ = self.compute_unified_score(1)  # Initialize caches
        
        # Base score sum
        base_score = sum(self.compute_unified_score(k) for k in ticket)
        
        # Pair synergy
        pair_synergy = 0.0
        for i, j in combinations(ticket, 2):
            gravity = self.compute_pair_gravity(i, j)
            if gravity > 1.0:
                pair_synergy += (gravity - 1.0) * 0.5
        
        # Family coherence
        family_coherence = 0.0
        if self._family_clusters is None:
            self._family_clusters = self.compute_family_clusters()
        
        for cluster in self._family_clusters.values():
            ticket_in_cluster = [n for n in ticket if n in cluster]
            if len(ticket_in_cluster) >= 2:
                family_coherence += len(ticket_in_cluster) * 0.3
        
        # Redundancy penalty (too many from same state)
        states = [self.get_number_state(k) for k in ticket]
        state_counts = Counter(states)
        redundancy_penalty = 0.0
        if state_counts.get('Overheated', 0) > 1:
            redundancy_penalty += 0.5
        if state_counts.get('Active', 0) > 3:
            redundancy_penalty += 0.3
        
        # Ensure at least one anchor (high stability number)
        if self._temporal_scores:
            top_anchors = sorted(self._temporal_scores.items(), key=lambda x: x[1], reverse=True)[:10]
            anchor_nums = {n for n, _ in top_anchors}
            has_anchor = any(n in anchor_nums for n in ticket)
            anchor_bonus = 0.2 if has_anchor else -0.3
        else:
            anchor_bonus = 0.0
        
        return base_score + pair_synergy + family_coherence - redundancy_penalty + anchor_bonus
    
    def generate_persona_tickets(self, persona: str = 'balanced') -> List[List[int]]:
        """
        Multi-Persona Ticket Generator
        Generates tickets based on different personas
        """
        # Compute all unified scores
        all_scores = {k: self.compute_unified_score(k) for k in range(1, N_NUMBERS + 1)}
        sorted_numbers = sorted(all_scores.items(), key=lambda x: x[1], reverse=True)
        
        tickets = []
        
        if persona == 'structural_anchor':
            # High stability, low variance
            anchors = [n for n, _ in sorted_numbers[:15] if self.get_number_state(n) in ['Active', 'Warming']]
            # Select top 5 anchors deterministically
            ticket = sorted(anchors[:5]) if len(anchors) >= 5 else sorted([n for n, _ in sorted_numbers[:5]])
            if len(ticket) == 5:
                tickets.append(ticket)
            else:
                # Fallback to top 5
                tickets.append(sorted([n for n, _ in sorted_numbers[:5]]))
        
        elif persona == 'machine_memory_hunter':
            # LagSignature dominant
            if self._lag_signatures is None:
                # Initialize caches if needed
                for k in range(1, N_NUMBERS + 1):
                    _ = self.compute_lag_signature(k)
            
            if self._lag_signatures:
                lag_sorted = sorted(self._lag_signatures.items(), key=lambda x: x[1], reverse=True)
                top_lag = [n for n, _ in lag_sorted[:20]] if lag_sorted else []
                # Select deterministically: top 3 lag + 2 from high scores
                top_lag_slice = top_lag[:3] if len(top_lag) >= 3 else top_lag
                other_nums = [n for n, _ in sorted_numbers[:15] if n not in top_lag_slice][:2]
                ticket = sorted(top_lag_slice + other_nums)
                if len(ticket) < 5:
                    # Pad with top numbers if needed
                    for n, _ in sorted_numbers:
                        if n not in ticket and len(ticket) < 5:
                            ticket.append(n)
                    ticket = sorted(ticket[:5])
            else:
                # Fallback if lag signatures not available
                ticket = sorted([n for n, _ in sorted_numbers[:5]])
            
            if len(ticket) == 5:
                tickets.append(ticket)
            else:
                # Ensure 5 numbers
                while len(ticket) < 5:
                    for n, _ in sorted_numbers:
                        if n not in ticket:
                            ticket.append(n)
                            if len(ticket) >= 5:
                                break
                tickets.append(sorted(ticket[:5]))
        
        elif persona == 'cluster_rider':
            # Family-heavy
            if self._family_clusters is None:
                self._family_clusters = self.compute_family_clusters()
            
            # Find the largest family
            largest_family = max(self._family_clusters.values(), key=len) if self._family_clusters else []
            if len(largest_family) >= 3:
                # Take 3 from family, 2 from top scores
                family_nums = sorted(largest_family[:3])
                other_nums = [n for n, _ in sorted_numbers[:15] if n not in family_nums][:2]
                ticket = sorted(family_nums + other_nums)
                if len(ticket) == 5:
                    tickets.append(ticket)
        
        elif persona == 'breakout_speculator':
            # Dormant + trigger-based
            dormant = [n for n in range(1, N_NUMBERS + 1) if self.get_number_state(n) == 'Breakout']
            if len(dormant) >= 2:
                breakout_nums = sorted(dormant[:2])
                # Add high lag signature numbers
                if self._lag_signatures is None:
                    for k in range(1, N_NUMBERS + 1):
                        _ = self.compute_lag_signature(k)
                
                if self._lag_signatures:
                    lag_sorted = sorted(self._lag_signatures.items(), key=lambda x: x[1], reverse=True)
                    lag_nums = [n for n, _ in lag_sorted[:10] if n not in breakout_nums][:3] if lag_sorted else []
                else:
                    lag_nums = [n for n, _ in sorted_numbers[:10] if n not in breakout_nums][:3] if sorted_numbers else []
                
                ticket = sorted(breakout_nums + lag_nums)
                if len(ticket) == 5:
                    tickets.append(ticket)
                else:
                    # Fill to 5
                    while len(ticket) < 5:
                        for n, _ in sorted_numbers:
                            if n not in ticket:
                                ticket.append(n)
                                if len(ticket) >= 5:
                                    break
                    tickets.append(sorted(ticket[:5]))
            else:
                # Not enough dormant numbers, use fallback
                tickets.append(sorted([n for n, _ in sorted_numbers[:5]]))
        
        else:  # balanced
            # Weighted blend - deterministic selection
            top_20 = [n for n, _ in sorted_numbers[:20]]
            # Select: 2 top scores, 1 high lag, 1 high burst, 1 from family
            ticket = []
            if len(top_20) >= 2:
                ticket.append(top_20[0])  # Top score
                ticket.append(top_20[1])  # Second top
            elif len(top_20) >= 1:
                ticket.append(top_20[0])  # At least one
            else:
                # If top_20 is empty, use top 2 from sorted_numbers
                if len(sorted_numbers) >= 2:
                    ticket.append(sorted_numbers[0][0])
                    ticket.append(sorted_numbers[1][0])
                elif len(sorted_numbers) >= 1:
                    ticket.append(sorted_numbers[0][0])
            
            # High lag (ensure we have lag signatures)
            if self._lag_signatures is None:
                for k in range(1, N_NUMBERS + 1):
                    _ = self.compute_lag_signature(k)
            
            if self._lag_signatures:
                lag_sorted = sorted(self._lag_signatures.items(), key=lambda x: x[1], reverse=True)
                for n, _ in lag_sorted[:10]:
                    if n not in ticket:
                        ticket.append(n)
                        break
            
            # High burst (ensure we have burst indices)
            if self._burst_indices is None:
                for k in range(1, N_NUMBERS + 1):
                    _ = self.compute_burst_index(k)
            
            if self._burst_indices:
                burst_sorted = sorted(self._burst_indices.items(), key=lambda x: x[1], reverse=True)
                for n, _ in burst_sorted[:10]:
                    if n not in ticket:
                        ticket.append(n)
                        break
            
            # From family
            if self._family_clusters is None:
                self._family_clusters = self.compute_family_clusters()
            for cluster in self._family_clusters.values():
                for n in cluster:
                    if n not in ticket and n in top_20:
                        ticket.append(n)
                        break
                if len(ticket) >= 5:
                    break
            
            # Fill if needed from top_20
            if len(ticket) < 5:
                for n in top_20:
                    if n not in ticket:
                        ticket.append(n)
                        if len(ticket) >= 5:
                            break
            
            # Ensure we have exactly 5 numbers
            if len(ticket) < 5:
                # Fill from sorted_numbers if needed
                for n, _ in sorted_numbers:
                    if n not in ticket:
                        ticket.append(n)
                        if len(ticket) >= 5:
                            break
            
            # Always add the ticket (should have 5 numbers by now)
            if len(ticket) >= 5:
                tickets.append(sorted(ticket[:5]))  # Take first 5 and sort
            else:
                # Last resort: use top 5 from sorted_numbers
                fallback_ticket = sorted([n for n, _ in sorted_numbers[:5]])
                tickets.append(fallback_ticket)
        
        # Score and return best ticket(s)
        if tickets:
            scored = [(t, self.score_ticket(t)) for t in tickets]
            scored.sort(key=lambda x: x[1], reverse=True)
            result = [t for t, _ in scored]
            print(f"DEBUG: generate_persona_tickets('{persona}') returning {len(result)} ticket(s)")
            return result
        
        # Fallback: deterministic top 5 (should always have this)
        fallback = [sorted([n for n, _ in sorted_numbers[:5]])]
        print(f"DEBUG: generate_persona_tickets('{persona}') using fallback: {fallback}")
        return fallback
    
    def predict(self, strategy: str = 'balanced') -> List[int]:
        """
        Generate prediction using intelligence engine
        Returns single best ticket
        """
        try:
            ticket = self.generate_persona_tickets(strategy)
            print(f"DEBUG: generate_persona_tickets('{strategy}') returned: {ticket}, type: {type(ticket)}, len: {len(ticket) if ticket else 'N/A'}")
            
            if ticket and len(ticket) > 0:
                first_ticket = ticket[0]
                print(f"DEBUG: First ticket: {first_ticket}, type: {type(first_ticket)}, len: {len(first_ticket) if isinstance(first_ticket, list) else 'N/A'}")
                
                if isinstance(first_ticket, list) and len(first_ticket) == 5:
                    result = sorted(first_ticket)
                    print(f"DEBUG: Returning valid ticket: {result}")
                    return result
                else:
                    print(f"WARNING: First ticket invalid: {first_ticket}")
        except Exception as e:
            print(f"ERROR in predict(): {e}")
            import traceback
            traceback.print_exc()
        
        # Fallback: ensure we always return a valid ticket
        # Use top 5 by unified score
        print("DEBUG: Using fallback - computing unified scores for all numbers")
        all_scores = {k: self.compute_unified_score(k) for k in range(1, N_NUMBERS + 1)}
        sorted_numbers = sorted(all_scores.items(), key=lambda x: x[1], reverse=True)
        fallback_result = sorted([n for n, _ in sorted_numbers[:5]])
        print(f"DEBUG: Fallback result: {fallback_result}")
        return fallback_result

