# Ghana Lotto Intelligence Engine v2.0 (Prototype)
# Uses the previously formatted CSV: /mnt/data/draws_sunday_aseda.csv

import pandas as pd
import numpy as np
from itertools import combinations

# -------------------------
# Load & normalize data
# -------------------------
path = "/mnt/data/draws_sunday_aseda.csv"
df_raw = pd.read_csv(path)

# Expand winning and machine numbers into columns if needed
def expand_cols(df):
    if 'winning_numbers' in df.columns:
        w = df['winning_numbers'].str.strip('[]').str.split(',', expand=True)
        w.columns = [f'w{i+1}' for i in range(5)]
        df = pd.concat([df.drop(columns=['winning_numbers']), w], axis=1)
    if 'machine_numbers' in df.columns:
        m = df['machine_numbers'].str.strip('[]').str.split(',', expand=True)
        m.columns = [f'm{i+1}' for i in range(5)]
        df = pd.concat([df.drop(columns=['machine_numbers']), m], axis=1)
    return df

df = expand_cols(df_raw.copy())
df = df.apply(pd.to_numeric, errors='ignore')

wcols = [c for c in df.columns if c.startswith('w')]
mcols = [c for c in df.columns if c.startswith('m')]

# -------------------------
# Core parameters
# -------------------------
LAGS = [1,2,3]
w_lag = {1:1.0, 2:0.7, 3:0.4}
lambda_decay = 0.15

# -------------------------
# Helpers
# -------------------------
def temporal_score(k):
    idx = []
    for i,row in df.iterrows():
        if k in row[wcols].values:
            idx.append(len(df)-i)
    return sum(np.exp(-lambda_decay * np.array(idx))) if idx else 0.0

def lag_signature(k):
    sig = 0.0
    for lag in LAGS:
        for i in range(lag, len(df)):
            if k in df.iloc[i-lag][mcols].values and k in df.iloc[i][wcols].values:
                sig += w_lag[lag]
    return sig

def burst_index(k, window=10):
    wins = [i for i,row in df.iterrows() if k in row[wcols].values]
    if len(wins) < 2: return 0.0
    gaps = np.diff(wins)
    recent = [i for i in wins if i >= len(df)-window]
    return (len(recent)+1) / (np.mean(gaps)+1e-6)

# Pair gravity
def pair_gravity(i,j):
    total = len(df)
    pi = sum(i in r[wcols].values for _,r in df.iterrows())/total
    pj = sum(j in r[wcols].values for _,r in df.iterrows())/total
    pij = sum((i in r[wcols].values) and (j in r[wcols].values) for _,r in df.iterrows())/total
    if pi*pj == 0: return 0
    return pij/(pi*pj)

# -------------------------
# Compute scores
# -------------------------
numbers = range(1,91)
scores = {}
for k in numbers:
    scores[k] = (
        0.4*temporal_score(k) +
        0.3*lag_signature(k) +
        0.3*burst_index(k)
    )

score_series = pd.Series(scores).sort_values(ascending=False)

# -------------------------
# Ticket scoring
# -------------------------
def ticket_score(T):
    base = sum(score_series[k] for k in T)
    synergy = sum(pair_gravity(i,j) for i,j in combinations(T,2))
    return base + 0.5*synergy

# Generate candidate tickets from top pool
top_pool = score_series.head(15).index.tolist()
tickets = []
for comb in combinations(top_pool,5):
    tickets.append((comb, ticket_score(comb)))

tickets = sorted(tickets, key=lambda x: x[1], reverse=True)

# -------------------------
# Outputs
# -------------------------
top_numbers = score_series.head(15)
top_tickets = tickets[:5]

top_numbers, top_tickets
