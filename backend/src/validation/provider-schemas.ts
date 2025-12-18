import { z } from 'zod';

/**
 * Schema for GET /api/providers query parameters
 */
export const providerQuerySchema = z.object({
  q: z.string().optional(), // search query
});

export type ProviderQuery = z.infer<typeof providerQuerySchema>;

/**
 * Schema for GET /api/providers/:id path parameters
 */
export const providerIdSchema = z.object({
  id: z.string().uuid('Invalid provider ID format'),
});

export type ProviderIdParams = z.infer<typeof providerIdSchema>;

/**
 * Schema for GET /api/providers/:id/availability query parameters
 */
export const availabilityQuerySchema = z.object({
  // Date in YYYY-MM-DD format
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  // Slot duration in minutes (optional, defaults to 30)
  duration: z
    .string()
    .optional()
    .default('30')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(15).max(480)),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
