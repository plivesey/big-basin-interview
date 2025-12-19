import { Router, Request, Response, NextFunction } from 'express';
import { createBooking, getBookingById, getBookingsByUser } from '../services/booking-service';
import {
  createBookingSchema,
  bookingIdSchema,
  bookingQuerySchema,
} from '../validation/booking-schemas';
import { transitionState, getWorkflow, WorkflowState } from '../services/workflow-service';
import { getProviderById } from '../services/provider-service';
import { eventBus } from '../events/event-bus';
import { NotFoundError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/bookings
 * Get bookings for a user
 * Query params:
 *   - userId: Required user ID to filter bookings
 * Returns bookings ordered by scheduledAt descending
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters (userId is required)
    const { userId } = bookingQuerySchema.parse(req.query);

    logger.debug('Booking list request', { userId });

    const bookings = await getBookingsByUser(userId);

    res.json({
      success: true,
      data: {
        bookings,
        total: bookings.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings
 * Create a new booking with idempotency support
 * Body:
 *   - providerId: UUID of the provider
 *   - serviceType: Type of service (e.g., 'haircut')
 *   - scheduledAt: ISO 8601 datetime
 *   - duration: Duration in minutes (optional, default 60)
 *   - idempotencyKey: Unique key to prevent duplicate bookings
 *   - workflowId: Workflow ID to complete on successful booking
 * Returns 201 if created, 200 if idempotent return
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const { providerId, serviceType, scheduledAt, duration, idempotencyKey, workflowId } =
      createBookingSchema.parse(req.body);

    logger.debug('Booking create request', {
      providerId,
      serviceType,
      scheduledAt,
      idempotencyKey,
      workflowId,
    });

    // Create booking (uses default_user for MVP)
    const result = await createBooking(
      {
        userId: 'default_user',
        providerId,
        serviceType,
        scheduledAt: new Date(scheduledAt),
        duration,
      },
      idempotencyKey
    );

    // Complete the workflow if booking was created
    if (result.created) {
      try {
        await transitionState(workflowId, WorkflowState.COMPLETE, {
          bookingId: result.booking.id,
        });
        logger.info('Workflow completed after booking', {
          workflowId,
          bookingId: result.booking.id,
        });
      } catch (workflowError) {
        // Log but don't fail the booking if workflow completion fails
        logger.warn('Failed to complete workflow after booking', {
          workflowId,
          bookingId: result.booking.id,
          error: String(workflowError),
        });
      }

      // Emit booking confirmation event for AI acknowledgment (non-blocking)
      // The event handler in websocket/event-handlers.ts will stream the response
      emitBookingConfirmedEvent(workflowId, providerId, serviceType, scheduledAt);
    }

    // Return 201 if created, 200 if idempotent return
    const statusCode = result.created ? 201 : 200;

    res.status(statusCode).json({
      success: true,
      data: {
        booking: result.booking,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bookings/:id
 * Get a single booking by ID
 * Returns 404 if booking not found
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate ID parameter
    const { id } = bookingIdSchema.parse(req.params);

    logger.debug('Booking detail request', { id });

    const booking = await getBookingById(id);

    if (!booking) {
      throw new NotFoundError('Booking', id);
    }

    res.json({
      success: true,
      data: {
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Emit booking confirmation event to trigger AI acknowledgment
 * This is a fire-and-forget operation - errors are logged but don't affect the booking
 */
function emitBookingConfirmedEvent(
  workflowId: string,
  providerId: string,
  serviceType: string,
  scheduledAt: string
): void {
  // Fetch workflow and provider async, then emit event
  Promise.all([getWorkflow(workflowId), getProviderById(providerId)])
    .then(([workflow, provider]) => {
      if (!workflow) {
        logger.warn('Cannot emit booking confirmation - workflow not found', { workflowId });
        return;
      }

      if (!provider) {
        logger.warn('Cannot emit booking confirmation - provider not found', { providerId });
        return;
      }

      // Emit domain event - the WebSocket layer handles the rest
      eventBus.emit('booking:confirmed', {
        sessionId: workflow.sessionId,
        workflowId,
        providerId,
        providerName: provider.name,
        serviceType,
        scheduledAt,
      });

      logger.debug('Emitted booking:confirmed event', {
        sessionId: workflow.sessionId,
        workflowId,
        providerName: provider.name,
      });
    })
    .catch((error) => {
      logger.error('Failed to emit booking confirmation event', {
        workflowId,
        providerId,
        error: String(error),
      });
    });
}

export default router;
