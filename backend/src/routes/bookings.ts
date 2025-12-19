import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createBooking, getBookingById, getBookingsByUser } from '../services/booking-service';
import {
  createBookingSchema,
  bookingIdSchema,
  bookingQuerySchema,
} from '../validation/booking-schemas';
import { transitionState, getWorkflow, WorkflowState } from '../services/workflow-service';
import { getProviderById } from '../services/provider-service';
import { saveMessage } from '../services/message-service';
import { sendMessage as sendAIMessage } from '../services/ai-conversation-service';
import { getSocketInstance } from '../websocket/socket-instance';
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

      // Trigger AI acknowledgment of the booking (non-blocking)
      triggerBookingAcknowledgment(workflowId, providerId, serviceType, scheduledAt).catch(
        (error) => {
          logger.error('Failed to trigger booking acknowledgment', {
            workflowId,
            error: String(error),
          });
        }
      );
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
 * Trigger AI acknowledgment of a successful booking
 * This injects a hidden system notification message and triggers an AI response
 * that the user will see, warmly acknowledging their booking.
 */
async function triggerBookingAcknowledgment(
  workflowId: string,
  providerId: string,
  serviceType: string,
  scheduledAt: string
): Promise<void> {
  // Get workflow to find the sessionId
  const workflow = await getWorkflow(workflowId);
  if (!workflow) {
    logger.warn('Cannot trigger booking acknowledgment - workflow not found', { workflowId });
    return;
  }

  const sessionId = workflow.sessionId;

  // Get provider details for the notification
  const provider = await getProviderById(providerId);
  if (!provider) {
    logger.warn('Cannot trigger booking acknowledgment - provider not found', { providerId });
    return;
  }

  // Format the date/time for the notification
  const scheduledDate = new Date(scheduledAt);
  const formattedDateTime = scheduledDate.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Create the hidden system notification message
  const notificationText = `The user has just confirmed their booking. Respond warmly to acknowledge their booking with ${provider.name} for ${serviceType} scheduled for ${formattedDateTime}. Wish them well for their upcoming appointment and ask if there's anything else you can help them find.`;

  // Save the hidden notification as a user message (Claude will see it, user won't)
  await saveMessage({
    sessionId,
    role: 'user',
    content: [{ type: 'system_notification', text: notificationText }],
  });

  logger.info('Saved booking notification message', {
    sessionId,
    workflowId,
    providerName: provider.name,
  });

  // Get socket.io instance to emit events
  const io = getSocketInstance();
  if (!io) {
    logger.warn('Cannot stream booking acknowledgment - socket.io not initialized');
    return;
  }

  // Generate message ID for streaming
  const assistantMessageId = uuidv4();

  // Emit message start to the session room
  io.to(sessionId).emit('message_start', { messageId: assistantMessageId });

  // Call AI service with streaming callbacks
  // We pass an empty string for userMessage since the notification is already saved
  const aiResponse = await sendAIMessage(sessionId, '', {
    onTextDelta: (text) => {
      io.to(sessionId).emit('text_delta', { text });
    },
  });

  // Save the assistant's response
  await saveMessage({
    id: assistantMessageId,
    sessionId,
    role: 'assistant',
    content: aiResponse,
  });

  // Emit message complete
  io.to(sessionId).emit('message_complete', { messageId: assistantMessageId });

  logger.info('Booking acknowledgment sent', {
    sessionId,
    messageId: assistantMessageId,
  });
}

export default router;
