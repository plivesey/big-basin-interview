import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createBooking, getBookingById, getBookingsByUser, cancelBooking } from '../services/booking-service';
import {
  createBookingSchema,
  bookingIdSchema,
  bookingQuerySchema,
  cancelBookingSchema,
} from '../validation/booking-schemas';
import { transitionState, getWorkflow, WorkflowState } from '../services/workflow-service';
import { getProviderById } from '../services/provider-service';
import { eventBus } from '../events/event-bus';
import { getSocketInstance } from '../websocket/socket-instance';
import { sendMessage as sendAIMessage } from '../services/ai-conversation-service';
import { saveMessage } from '../services/message-service';
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
 * POST /api/bookings/:id/cancel
 * Cancel a confirmed booking and let the assistant acknowledge it in the chat.
 * Body:
 *   - workflowId: Workflow ID used to locate the chat session
 */
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = bookingIdSchema.parse(req.params);
    const { workflowId } = cancelBookingSchema.parse(req.body);

    logger.debug('Booking cancel request', { id, workflowId });

    const booking = await cancelBooking(id);

    // Notify the chat so the assistant can acknowledge the cancellation
    await notifyChatOfCancellation(workflowId, booking?.providerId ?? '', booking?.serviceType ?? '');

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
 * Push a cancellation acknowledgment to the user's chat session.
 *
 * Looks up the session from the workflow, saves a hidden system notification so
 * Claude has context, and streams an AI acknowledgment back over the socket.
 */
async function notifyChatOfCancellation(
  workflowId: string,
  providerId: string,
  serviceType: string
): Promise<void> {
  try {
    const io = getSocketInstance();
    if (!io) {
      return;
    }

    const workflow = await getWorkflow(workflowId);
    if (!workflow) {
      logger.error('Cannot notify chat of cancellation - workflow not found', { workflowId });
      return;
    }

    const provider = await getProviderById(providerId);
    const providerName = provider ? provider.name : 'your provider';

    const sessionId = workflow.sessionId;

    const notificationText = `The user has just cancelled their booking with ${providerName} for ${serviceType}. Acknowledge the cancellation warmly, let them know it has been cancelled, and ask if there's anything else you can help them with.`;

    // Save the hidden notification as a user message (Claude will see it, the user won't)
    await saveMessage({
      sessionId,
      role: 'user',
      content: [{ type: 'system_notification', text: notificationText }],
    });

    const assistantMessageId = uuidv4();

    io.to(sessionId).emit('message_start', { messageId: assistantMessageId });

    const aiResponse = await sendAIMessage(sessionId, '', {
      onTextDelta: (text) => {
        io.to(sessionId).emit('text_delta', { text });
      },
    });

    await saveMessage({
      id: assistantMessageId,
      sessionId,
      role: 'assistant',
      content: aiResponse,
    });

    io.to(sessionId).emit('message_complete', { messageId: assistantMessageId });

    logger.info('Cancellation acknowledgment sent', { sessionId, workflowId });
  } catch (error) {
    logger.error('Failed to notify chat of cancellation', {
      workflowId,
      error: String(error),
    });
  }
}

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
        logger.error('Cannot emit booking confirmation - workflow not found', { workflowId });
        return;
      }

      if (!provider) {
        logger.error('Cannot emit booking confirmation - provider not found', { providerId });
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
