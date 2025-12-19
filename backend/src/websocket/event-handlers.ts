import { v4 as uuidv4 } from 'uuid';
import { eventBus, BookingConfirmedEvent } from '../events/event-bus';
import { sendMessage as sendAIMessage } from '../services/ai-conversation-service';
import { saveMessage } from '../services/message-service';
import { logger } from '../utils/logger';
import type { ChatServer } from './chat-handler';

/**
 * Event Handlers - Centralized WebSocket emission for domain events
 *
 * This module subscribes to domain events from the event bus and handles
 * all WebSocket communication. This ensures:
 * - Single point of control for socket emissions
 * - Services don't need to know about Socket.io
 * - All socket protocol logic is centralized here
 */

/**
 * Initialize all event bus handlers
 * Should be called once during server startup, passing the Socket.io server instance
 */
export function initializeEventHandlers(io: ChatServer): void {
  logger.info('Initializing event bus handlers');

  // Subscribe to booking confirmation events
  eventBus.on('booking:confirmed', async (event) => {
    await handleBookingConfirmation(io, event);
  });

  // Future event handlers can be added here:
  // eventBus.on('notification:send', async (event) => { ... });
  // eventBus.on('workflow:updated', async (event) => { ... });
}

/**
 * Handle booking confirmation - stream AI acknowledgment to the client
 *
 * This is triggered when a booking is successfully created. It:
 * 1. Saves a hidden system notification message (for Claude to see)
 * 2. Streams an AI-generated acknowledgment response to the user
 */
async function handleBookingConfirmation(
  io: ChatServer,
  event: BookingConfirmedEvent
): Promise<void> {
  const { sessionId, workflowId, providerName, serviceType, scheduledAt } = event;

  logger.info('Handling booking confirmation event', {
    sessionId,
    workflowId,
    providerName,
  });

  try {
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
    // Claude will see this and respond warmly to acknowledge the booking
    const notificationText = `The user has just confirmed their booking. Respond warmly to acknowledge their booking with ${providerName} for ${serviceType} scheduled for ${formattedDateTime}. Wish them well for their upcoming appointment and ask if there's anything else you can help them find.`;

    // Save the hidden notification as a user message (Claude will see it, user won't)
    await saveMessage({
      sessionId,
      role: 'user',
      content: [{ type: 'system_notification', text: notificationText }],
    });

    logger.info('Saved booking notification message', {
      sessionId,
      workflowId,
      providerName,
    });

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
      workflowId,
    });
  } catch (error) {
    logger.error('Error handling booking confirmation', {
      sessionId,
      workflowId,
      error: String(error),
    });

    // Emit error to the session so the client knows something went wrong
    io.to(sessionId).emit('error', {
      error: 'We confirmed your booking, but had trouble sending a message. Your booking is still valid.',
      code: 'BOOKING_ACK_ERROR',
    });
  }
}
