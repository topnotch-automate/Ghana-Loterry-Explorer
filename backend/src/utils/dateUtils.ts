/**
 * Utility functions for date range generation and manipulation
 */

/**
 * Generate array of dates between start and end (inclusive)
 */
export function generateDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Generate date range as ISO strings (YYYY-MM-DD)
 */
export function generateDateRangeStrings(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = generateDateRange(start, end);
  
  return dates.map((date) => date.toISOString().split('T')[0]);
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Get date string for N days ago
 */
export function getDateNDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

/**
 * Check if date is within range
 */
export function isDateInRange(date: Date | string, start: Date | string, end: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  
  return d >= s && d <= e;
}

