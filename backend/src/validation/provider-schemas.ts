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
