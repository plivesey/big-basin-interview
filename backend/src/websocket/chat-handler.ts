import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { saveMessage, getMessageHistory } from '../services/message-service';
import { getOrCreateSession } from '../services/session-service';
import { sendMessage as sendAIMessage, AIError } from '../services/ai-conversation-service';
import { logger } from '../utils/logger';
import type { ServerToClientEvents, ClientToServerEvents, ChatMessage, RawChatMessage } from '@asba/shared-types';

// Re-export WebSocket event types for consumers
export type { ServerToClientEvents, ClientToServerEvents } from '@asba/shared-types';

/**
 * Convert ChatMessage to RawChatMessage for WebSocket serialization
 */
function toRawMessage(message: ChatMessage): RawChatMessage {
  return {
    ...message,
    createdAt: message.createdAt.toISOString(),
  };
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  sessionId: string;
}

export type ChatSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type ChatServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Initialize WebSocket chat handlers
 */
export function initializeChatHandler(io: ChatServer): void {
  io.on('connection', async (socket: ChatSocket) => {
    logger.info('Client connected', { socketId: socket.id });

    try {
      // Get or create session from query param
      const querySessionId = socket.handshake.query.sessionId as string | undefined;
      const session = await getOrCreateSession(querySessionId);

      // Store session ID in socket data
      socket.data.sessionId = session.id;

      // Join session-specific room
      socket.join(session.id);

      // Send session info to client
      socket.emit('session_created', { sessionId: session.id });

      // Load and send message history
      const messageHistory = await getMessageHistory(session.id);
      socket.emit('message_history', { messages: messageHistory.map(toRawMessage) });

      logger.info('Session established', { sessionId: session.id, socketId: socket.id });
    } catch (error) {
      logger.error('Error during connection setup', { error: String(error), socketId: socket.id });
      socket.emit('error', {
        error: "I'm having trouble getting started. Please refresh the page to try again.",
        code: 'SESSION_INIT_ERROR',
      });
    }

    // Handle incoming user messages
    socket.on('user_message', async (data) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        logger.warn('User message received without active session', { socketId: socket.id });
        socket.emit('error', {
          error: "Looks like your session timed out. Please refresh the page to reconnect.",
          code: 'NO_SESSION',
        });
        return;
      }

      if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
        logger.warn('Invalid message received', { socketId: socket.id, sessionId });
        socket.emit('error', {
          error: "I didn't catch that. Try typing your message again.",
          code: 'INVALID_MESSAGE',
        });
        return;
      }

      const messageText = data.message.trim();

      try {
        // Save user message to database
        const userMessage = await saveMessage({
          sessionId,
          role: 'user',
          content: messageText,
        });

        logger.info('User message saved', { messageId: userMessage.id, sessionId });

        // Generate assistant message ID upfront for consistent tracking
        const assistantMessageId = uuidv4();

        // Emit message start to indicate processing
        socket.emit('message_start', { messageId: assistantMessageId });

        // Call AI service with streaming and tool callbacks
        const aiResponse = await sendAIMessage(sessionId, messageText, {
          onTextDelta: (text) => {
            socket.emit('text_delta', { text });
          },
          onToolStart: (toolName, toolUseId) => {
            logger.debug('Tool started', { toolName, toolUseId, sessionId });
            socket.emit('tool_start', { toolName, toolUseId });
          },
          onToolComplete: (toolName, toolUseId, result) => {
            logger.debug('Tool completed', { toolName, toolUseId, success: result.success, sessionId });
            socket.emit('tool_complete', { toolName, toolUseId, success: result.success });
          },
          onDisplayProviders: (providers) => {
            logger.debug('Displaying providers', { count: providers.length, sessionId });
            socket.emit('display_providers', { providers });
          },
        });

        // Save assistant message to database with pre-generated ID
        const assistantMessage = await saveMessage({
          id: assistantMessageId,
          sessionId,
          role: 'assistant',
          content: aiResponse,
        });

        // Emit message complete with final message ID
        socket.emit('message_complete', { messageId: assistantMessage.id });

        logger.info('AI response sent', { messageId: assistantMessage.id, sessionId });
      } catch (error) {
        // Differentiate error types for better user feedback
        let errorMessage = "Something went wrong on my end. Please try sending that again.";
        let errorCode = 'AI_ERROR';

        if (error instanceof AIError) {
          if (error.code === 'TIMEOUT') {
            errorMessage = "I'm taking longer than expected to think. Please try again.";
            errorCode = 'AI_TIMEOUT';
          } else if (error.code === 'MAX_RETRIES_EXCEEDED') {
            errorMessage = "I'm having trouble connecting right now. Please try again in a moment.";
            errorCode = 'AI_UNAVAILABLE';
          }
        }

        logger.error('Error handling user message', {
          error: String(error),
          errorCode,
          sessionId,
        });
        socket.emit('error', {
          error: errorMessage,
          code: errorCode,
        });
      }
    });

    // Handle sync request (for reconnection)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    socket.on('sync', async (data) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        logger.warn('Sync requested without active session', { socketId: socket.id });
        socket.emit('error', {
          error: "Looks like your session timed out. Please refresh the page to reconnect.",
          code: 'NO_SESSION',
        });
        return;
      }

      try {
        const messageHistory = await getMessageHistory(sessionId);
        socket.emit('message_history', { messages: messageHistory.map(toRawMessage) });
      } catch (error) {
        logger.error('Error during sync', { error: String(error), sessionId });
        socket.emit('error', {
          error: "I'm having trouble updating our conversation. Please refresh the page if messages look incomplete.",
          code: 'SYNC_ERROR',
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('Client disconnected', { socketId: socket.id, reason });
    });
  });
}
