import { z } from 'zod';

/**
 * Schema for POST /api/bookings request body
 */
export const createBookingSchema = z.object({
  providerId: z.string().uuid('Invalid provider ID format'),
  serviceType: z.string().min(1, 'Service type is required'),
  scheduledAt: z.string().datetime({ local: true, message: 'Invalid datetime format (use ISO 8601)' }),
  duration: z.number().int().min(15, 'Duration must be at least 15 minutes').max(480, 'Duration cannot exceed 8 hours').default(60),
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
  workflowId: z.string().uuid('Invalid workflow ID format'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/**
 * Schema for GET /api/bookings/:id path parameters
 */
export const bookingIdSchema = z.object({
  id: z.string().uuid('Invalid booking ID format'),
});

export type BookingIdParams = z.infer<typeof bookingIdSchema>;

/**
 * Schema for GET /api/bookings query parameters
 */
export const bookingQuerySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type BookingQuery = z.infer<typeof bookingQuerySchema>;

/**
 * Schema for POST /api/bookings/:id/cancel request body.
 * The workflowId is used to find the chat session so we can notify the user.
 */
export const cancelBookingSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

/**
 * Schema for GET /api/sessions/:id path parameters
 */
export const sessionIdSchema = z.object({
  id: z.string().uuid('Invalid session ID format'),
});

export type SessionIdParams = z.infer<typeof sessionIdSchema>;
