import { z } from 'zod';
import { ValidationError } from './errors.js';

// Number validation: must be between 1 and 90
const numberSchema = z.number().int().min(1).max(90);

// Array of 5 numbers validation
export const numbersArraySchema = z
  .array(numberSchema)
  .length(5, 'Must contain exactly 5 numbers');

// Draw creation schema
export const createDrawSchema = z.object({
  drawDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  lottoType: z.string().min(1, 'Lotto type is required'),
  winningNumbers: numbersArraySchema,
  machineNumbers: numbersArraySchema,
  source: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Search query schema
export const searchQuerySchema = z.object({
  numbers: z
    .array(numberSchema)
    .min(1, 'At least one number is required')
    .max(10, 'Maximum 10 numbers allowed')
    .optional(),
  mode: z.enum(['exact', 'partial', 'winning-only', 'machine-only', 'group']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  lottoType: z.string().optional(),
  minMatches: z.number().int().min(1).optional(),
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Analytics timeframe schema
export const analyticsTimeframeSchema = z.object({
  daily: z.boolean().optional(),
  weekly: z.boolean().optional(),
  monthly: z.boolean().optional(),
  yearly: z.boolean().optional(),
  days: z.number().int().positive().optional(),
});

// Validation helper
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
}

