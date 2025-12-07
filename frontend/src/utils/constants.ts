// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  TIMEOUT: 30000,
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Ghana Lottery Explorer',
} as const;

// Domain Constants
export const LOTTERY = {
  MIN_NUMBER: 1,
  MAX_NUMBER: 90,
  WINNING_NUMBERS_COUNT: 5,
  MACHINE_NUMBERS_COUNT: 5,
  TOTAL_NUMBERS_PER_DRAW: 10,
} as const;

// UI Constants
export const UI = {
  DEBOUNCE_DELAY: 300,
  ITEMS_PER_PAGE: 20,
  MAX_SEARCH_NUMBERS: 10,
} as const;

