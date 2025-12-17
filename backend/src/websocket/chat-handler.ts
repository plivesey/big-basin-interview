import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { saveMessage, getMessageHistory, ChatMessage } from '../services/message-service';
import { getOrCreateSession } from '../services/session-service';
import { sendMessage as sendAIMessage } from '../services/ai-conversation-service';
import { logger } from '../utils/logger';

// Types for WebSocket events
export interface ServerToClientEvents {
  // Connection events
  session_created: (data: { sessionId: string }) => void;
  message_history: (data: { messages: ChatMessage[] }) => void;

  // Message events
  message_start: (data: { messageId: string }) => void;
  assistant_message: (data: { id: string; content: string; timestamp: string }) => void;
  text_delta: (data: { text: string }) => void;
  message_complete: (data: { messageId: string }) => void;

  // Status events
  error: (data: { error: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  user_message: (data: { message: string }) => void;
  sync: (data: { lastMessageId?: string }) => void;
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
      socket.emit('message_history', { messages: messageHistory });

      logger.info('Session established', { sessionId: session.id, socketId: socket.id });
    } catch (error) {
      logger.error('Error during connection setup', { error: String(error), socketId: socket.id });
      socket.emit('error', {
        error: 'Failed to initialize session',
        code: 'SESSION_INIT_ERROR',
      });
    }

    // Handle incoming user messages
    socket.on('user_message', async (data) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        logger.warn('User message received without active session', { socketId: socket.id });
        socket.emit('error', {
          error: 'No active session',
          code: 'NO_SESSION',
        });
        return;
      }

      if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
        logger.warn('Invalid message received', { socketId: socket.id, sessionId });
        socket.emit('error', {
          error: 'Message is required',
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

        // Call AI service to get response
        const aiResponse = await sendAIMessage(sessionId, messageText);

        // Save assistant message to database with pre-generated ID
        const assistantMessage = await saveMessage({
          id: assistantMessageId,
          sessionId,
          role: 'assistant',
          content: aiResponse,
        });

        // Emit the AI response
        socket.emit('assistant_message', {
          id: assistantMessage.id,
          content: aiResponse,
          timestamp: assistantMessage.createdAt.toISOString(),
        });

        // Emit message complete
        socket.emit('message_complete', { messageId: assistantMessage.id });

        logger.info('AI response sent', { messageId: assistantMessage.id, sessionId });
      } catch (error) {
        logger.error('Error handling user message', { error: String(error), sessionId });
        socket.emit('error', {
          error: 'Failed to get AI response. Please try again.',
          code: 'AI_ERROR',
        });
      }
    });

    // Handle sync request (for reconnection)
    socket.on('sync', async (data) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        logger.warn('Sync requested without active session', { socketId: socket.id });
        socket.emit('error', {
          error: 'No active session',
          code: 'NO_SESSION',
        });
        return;
      }

      try {
        const messageHistory = await getMessageHistory(sessionId);
        socket.emit('message_history', { messages: messageHistory });
      } catch (error) {
        logger.error('Error during sync', { error: String(error), sessionId });
        socket.emit('error', {
          error: 'Failed to sync messages',
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
