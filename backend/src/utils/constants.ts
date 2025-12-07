// Domain constants
export const LOTTERY = {
  MIN_NUMBER: 1,
  MAX_NUMBER: 90,
  WINNING_NUMBERS_COUNT: 5,
  MACHINE_NUMBERS_COUNT: 5,
  TOTAL_NUMBERS_PER_DRAW: 10,
} as const;

// API constants
export const API = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 1000,
  DEFAULT_OFFSET: 0,
} as const;

// Search modes
export const SEARCH_MODES = {
  EXACT: 'exact',
  PARTIAL: 'partial',
  WINNING_ONLY: 'winning-only',
  MACHINE_ONLY: 'machine-only',
  GROUP: 'group',
} as const;

// Analytics timeframes
export const ANALYTICS_TIMEFRAMES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

