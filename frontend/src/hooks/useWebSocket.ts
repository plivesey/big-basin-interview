import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useChatStore, parseMessage } from '../store/chat-store';
import type {
  ChatMessage,
  ServerToClientEvents,
  ClientToServerEvents,
} from '@asba/shared-types';
import { logger } from '../utils/logger';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const SESSION_STORAGE_KEY = 'chat_session_id';

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface UseWebSocketReturn {
  sendMessage: (message: string) => void;
  reconnect: () => void;
  disconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const socketRef = useRef<ChatSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Use a ref to track streaming message ID to avoid race conditions
  // The store update is async, but the ref update is synchronous
  const streamingIdRef = useRef<string | null>(null);

  const {
    setSessionId,
    setConnectionStatus,
    setMessages,
    addMessage,
    updateMessage,
    appendTextToMessage,
    setStreamingMessageId,
    setIsLoading,
  } = useChatStore();

  // Get stored session ID
  const getStoredSessionId = useCallback((): string | null => {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      return null;
    }
  }, []);

  // Store session ID
  const storeSessionId = useCallback((sessionId: string): void => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setConnectionStatus('connecting');

    const storedSessionId = getStoredSessionId();

    const socket: ChatSocket = io(BACKEND_URL, {
      query: storedSessionId ? { sessionId: storedSessionId } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      logger.info('WebSocket connected');
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
    });

    socket.on('disconnect', (reason) => {
      logger.info('WebSocket disconnected', { reason });
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      logger.error('WebSocket connection error', { error: String(error) });
      reconnectAttempts.current++;

      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setConnectionStatus('error');
      }
    });

    // Session events
    socket.on('session_created', (data) => {
      logger.info('Session created', { sessionId: data.sessionId });
      setSessionId(data.sessionId);
      storeSessionId(data.sessionId);
    });

    // Message history
    socket.on('message_history', (data) => {
      logger.debug('Received message history', { count: data.messages.length });
      const parsedMessages = data.messages.map((msg) => parseMessage(msg));
      setMessages(parsedMessages);
    });

    // Incoming messages - streaming support
    socket.on('message_start', (data) => {
      logger.debug('Message started', { messageId: data.messageId });
      setIsLoading(true);

      // Create a placeholder message for streaming
      const streamingId = `streaming-${Date.now()}`;
      const placeholderMessage: ChatMessage = {
        id: streamingId,
        sessionId: useChatStore.getState().sessionId || '',
        role: 'assistant',
        content: [{ type: 'text', text: '' }],
        createdAt: new Date(),
      };
      addMessage(placeholderMessage);

      // Update both ref (synchronous) and store (async)
      // The ref ensures text_delta handlers always have the latest ID
      streamingIdRef.current = streamingId;
      setStreamingMessageId(streamingId);
    });

    socket.on('text_delta', (data) => {
      // Use ref instead of store to avoid race condition
      const streamingId = streamingIdRef.current;
      if (streamingId) {
        appendTextToMessage(streamingId, data.text);
      }
    });

    socket.on('assistant_message', (data) => {
      logger.debug('Assistant message received', { messageId: data.id });
      const message: ChatMessage = {
        id: data.id,
        sessionId: useChatStore.getState().sessionId || '',
        role: 'assistant',
        content: [{ type: 'text', text: data.content }],
        createdAt: new Date(data.timestamp),
      };
      addMessage(message);
      setIsLoading(false);
    });

    socket.on('message_complete', (data) => {
      logger.debug('Message completed', { messageId: data.messageId });
      // Use ref for consistency with text_delta handler
      const streamingId = streamingIdRef.current;
      if (streamingId) {
        // Update the streaming message ID to the final ID from the server
        updateMessage(streamingId, { id: data.messageId });

        // Clear both ref and store
        streamingIdRef.current = null;
        setStreamingMessageId(null);
      }
      setIsLoading(false);
    });

    // Error handling
    socket.on('error', (data) => {
      logger.error('WebSocket error', { error: data.error, code: data.code });
      setIsLoading(false);
    });
  }, [
    setSessionId,
    setConnectionStatus,
    setMessages,
    addMessage,
    updateMessage,
    appendTextToMessage,
    setStreamingMessageId,
    setIsLoading,
    getStoredSessionId,
    storeSessionId,
  ]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      // Remove all listeners to prevent memory leaks
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    // Clear streaming ref on disconnect
    streamingIdRef.current = null;
  }, []);

  // Reconnect to WebSocket server
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    connect();
  }, [disconnect, connect]);

  // Send a message
  const sendMessage = useCallback((message: string) => {
    const socket = socketRef.current;
    const sessionId = useChatStore.getState().sessionId;

    if (!socket?.connected) {
      logger.warn('Cannot send message: not connected');
      return;
    }

    if (!message.trim()) {
      return;
    }

    // Add user message to store immediately (optimistic update)
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: sessionId || '',
      role: 'user',
      content: [{ type: 'text', text: message.trim() }],
      createdAt: new Date(),
    };
    addMessage(userMessage);
    setIsLoading(true);

    // Send to server
    socket.emit('user_message', { message: message.trim() });
  }, [addMessage, setIsLoading]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    sendMessage,
    reconnect,
    disconnect,
  };
}
