import { Server, Socket } from 'socket.io';
import { saveMessage, getMessageHistory, ChatMessage } from '../services/message-service';
import { getOrCreateSession, updateSessionStatus } from '../services/session-service';

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
    console.log(`Client connected: ${socket.id}`);

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

      console.log(`Session ${session.id} established for socket ${socket.id}`);
    } catch (error) {
      console.error('Error during connection setup:', error);
      socket.emit('error', {
        error: 'Failed to initialize session',
        code: 'SESSION_INIT_ERROR',
      });
    }

    // Handle incoming user messages
    socket.on('user_message', async (data) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        socket.emit('error', {
          error: 'No active session',
          code: 'NO_SESSION',
        });
        return;
      }

      if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
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

        console.log(`User message saved: ${userMessage.id}`);

        // Generate echo response (will be replaced with AI in Milestone 3)
        const echoContent = `Echo: ${messageText}`;

        // Save assistant message to database
        const assistantMessage = await saveMessage({
          sessionId,
          role: 'assistant',
          content: echoContent,
        });

        // Emit message start
        socket.emit('message_start', { messageId: assistantMessage.id });

        // Emit the echo response
        socket.emit('assistant_message', {
          id: assistantMessage.id,
          content: echoContent,
          timestamp: assistantMessage.createdAt.toISOString(),
        });

        // Emit message complete
        socket.emit('message_complete', { messageId: assistantMessage.id });

        console.log(`Echo response sent: ${assistantMessage.id}`);
      } catch (error) {
        console.error('Error handling user message:', error);
        socket.emit('error', {
          error: 'Failed to process message',
          code: 'MESSAGE_ERROR',
        });
      }
    });

    // Handle sync request (for reconnection)
    socket.on('sync', async (data) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
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
        console.error('Error during sync:', error);
        socket.emit('error', {
          error: 'Failed to sync messages',
          code: 'SYNC_ERROR',
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      const sessionId = socket.data.sessionId;
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);

      if (sessionId) {
        try {
          // Update session status to inactive
          await updateSessionStatus(sessionId, 'inactive');
          console.log(`Session ${sessionId} marked as inactive`);
        } catch (error) {
          console.error('Error updating session status on disconnect:', error);
        }
      }
    });
  });
}
