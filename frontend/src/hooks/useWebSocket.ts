import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useChatStore, parseMessage } from '../store/chat-store';
import type {
  ChatMessage,
  ServerToClientEvents,
  ClientToServerEvents,
} from '@asba/shared-types';
import { usePanelStore } from '../store/panel-store';
import { useBookingStore } from '../store/booking-store';
import { logger } from '../utils/logger';
import { ERROR_MESSAGES } from '../utils/error-messages';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const SESSION_STORAGE_KEY = 'chat_session_id';

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface UseWebSocketReturn {
  sendMessage: (message: string) => void;
  reconnect: () => void;
  disconnect: () => void;
  retryLastMessage: () => void;
  isRetrying: boolean;
}

export function useWebSocket(): UseWebSocketReturn {
  const socketRef = useRef<ChatSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Use a ref to track streaming message ID to avoid race conditions
  // The store update is async, but the ref update is synchronous
  const streamingIdRef = useRef<string | null>(null);
  // Track whether the streaming message has been created (on first text_delta)
  const streamingMessageCreatedRef = useRef<boolean>(false);
  // Track retry state
  const isRetryingRef = useRef<boolean>(false);
  // Track the last user message ID for marking as failed
  const lastUserMessageIdRef = useRef<string | null>(null);
  // Track message timeout
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track if we're waiting for a response
  const pendingMessageRef = useRef<boolean>(false);

  const {
    setSessionId,
    setConnectionStatus,
    setMessages,
    addMessage,
    updateMessage,
    appendTextToMessage,
    setStreamingMessageId,
    setIsLoading,
    setIsAiWorking,
    markMessageFailed,
    clearMessageError,
    setLastError,
    setLastAttemptedMessage,
  } = useChatStore();

  // Helper to clear message timeout
  const clearMessageTimeout = useCallback(() => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
  }, []);

  // Helper to handle message failure (used by timeout, disconnect, and error handlers)
  const handleMessageFailure = useCallback((errorMessage: string) => {
    // Clear timeout if any
    clearMessageTimeout();

    // Mark last user message as failed if we have one
    const lastUserMsgId = lastUserMessageIdRef.current;
    if (lastUserMsgId && pendingMessageRef.current) {
      markMessageFailed(lastUserMsgId, errorMessage);
    }

    // Remove any incomplete streaming message
    const streamingId = streamingIdRef.current;
    if (streamingId && streamingMessageCreatedRef.current) {
      const messages = useChatStore.getState().messages;
      const filteredMessages = messages.filter((msg) => msg.id !== streamingId);
      setMessages(filteredMessages);
    }

    // Set the last error for display
    setLastError(errorMessage);

    // Clear streaming state
    streamingIdRef.current = null;
    streamingMessageCreatedRef.current = false;
    setStreamingMessageId(null);
    setIsLoading(false);
    setIsAiWorking(false);
    pendingMessageRef.current = false;
    isRetryingRef.current = false;
  }, [clearMessageTimeout, markMessageFailed, setMessages, setLastError, setStreamingMessageId, setIsLoading, setIsAiWorking]);

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

      // If we have a pending message, mark it as failed
      if (pendingMessageRef.current) {
        handleMessageFailure(ERROR_MESSAGES.CONNECTION_LOST);
      }
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
      logger.info('Session created', { sessionId: data.sessionId, currentWorkflowId: data.currentWorkflowId });
      setSessionId(data.sessionId);
      storeSessionId(data.sessionId);
      // Restore active workflow ID if present
      if (data.currentWorkflowId) {
        usePanelStore.getState().setActiveWorkflowId(data.currentWorkflowId);
      }
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
      setIsAiWorking(true);

      // Create message immediately with empty content (typing indicator will show)
      const streamingId = `streaming-${Date.now()}`;
      streamingIdRef.current = streamingId;
      streamingMessageCreatedRef.current = true;
      setStreamingMessageId(streamingId);

      const message: ChatMessage = {
        id: streamingId,
        sessionId: useChatStore.getState().sessionId || '',
        role: 'assistant',
        content: [{ type: 'text', text: '' }],
        createdAt: new Date(),
      };
      addMessage(message);
    });

    socket.on('text_delta', (data) => {
      // Use ref instead of store to avoid race condition
      const streamingId = streamingIdRef.current;
      if (!streamingId) return;

      // Message already exists from message_start, just append
      appendTextToMessage(streamingId, data.text);
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
      // Clear the timeout since we got a response
      clearMessageTimeout();

      // Use ref for consistency with text_delta handler
      const streamingId = streamingIdRef.current;
      if (streamingId && streamingMessageCreatedRef.current) {
        // Update the streaming message ID to the final ID from the server
        updateMessage(streamingId, { id: data.messageId });
      }

      // Clear all streaming state
      streamingIdRef.current = null;
      streamingMessageCreatedRef.current = false;
      pendingMessageRef.current = false;
      setStreamingMessageId(null);
      setIsLoading(false);
      setIsAiWorking(false);
    });

    // Error handling
    socket.on('error', (data) => {
      logger.error('WebSocket error', { error: data.error, code: data.code });
      handleMessageFailure(ERROR_MESSAGES.AI_REQUEST_FAILED);
    });

    // Provider display events
    socket.on('display_providers', (data) => {
      logger.debug('Display providers received', {
        count: data.providers.length,
        workflowId: data.workflowId,
        workflowState: data.workflowState,
      });
      usePanelStore.getState().openProviderPanel(data.providers, data.workflowId, data.workflowState);
    });

    // Open provider detail modal (from AI select_provider tool)
    socket.on('open_provider_detail', (data) => {
      logger.debug('Open provider detail received', {
        providerId: data.providerId,
        providerName: data.providerName,
        workflowId: data.workflowId,
      });
      useBookingStore.getState().openProviderModal(data.providerId, data.workflowId);
    });

    // Booking completed - clear provider panel
    socket.on('booking_success', (data) => {
      logger.debug('Booking success received', {
        bookingId: data.bookingId,
        providerId: data.providerId,
      });
      // Clear providers when workflow completes
      usePanelStore.getState().clearProviders();
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
    setIsAiWorking,
    getStoredSessionId,
    storeSessionId,
    handleMessageFailure,
    clearMessageTimeout,
  ]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    // Clear message timeout to prevent memory leaks
    clearMessageTimeout();

    if (socketRef.current) {
      // Remove all listeners to prevent memory leaks
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    // Clear streaming refs on disconnect
    streamingIdRef.current = null;
    streamingMessageCreatedRef.current = false;
    pendingMessageRef.current = false;
  }, [clearMessageTimeout]);

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
      setLastError(ERROR_MESSAGES.CONNECTION_FAILED);
      return;
    }

    if (!message.trim()) {
      return;
    }

    const trimmedMessage = message.trim();

    // Track the message for potential retry
    setLastAttemptedMessage(trimmedMessage);
    // Clear any previous error state
    setLastError(null);
    // Clear any previous timeout
    clearMessageTimeout();

    // Add user message to store immediately (optimistic update)
    const messageId = `temp-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: messageId,
      sessionId: sessionId || '',
      role: 'user',
      content: [{ type: 'text', text: trimmedMessage }],
      createdAt: new Date(),
    };
    addMessage(userMessage);
    setIsLoading(true);

    // Track the user message ID for error handling
    lastUserMessageIdRef.current = messageId;
    pendingMessageRef.current = true;

    // Set a timeout for message acknowledgment (30 seconds)
    messageTimeoutRef.current = setTimeout(() => {
      if (pendingMessageRef.current) {
        logger.warn('Message timeout - no response received');
        handleMessageFailure(ERROR_MESSAGES.AI_TIMEOUT);
      }
    }, 30000);

    // Send to server
    socket.emit('user_message', { message: trimmedMessage });
  }, [addMessage, setIsLoading, setLastAttemptedMessage, setLastError, clearMessageTimeout, handleMessageFailure]);

  // Retry the last failed message
  const retryLastMessage = useCallback(() => {
    const lastMessage = useChatStore.getState().lastAttemptedMessage;
    const lastUserMsgId = lastUserMessageIdRef.current;

    if (!lastMessage) {
      logger.warn('No message to retry');
      return;
    }

    // Clear the failed message from the store
    if (lastUserMsgId) {
      clearMessageError(lastUserMsgId);
      // Remove the failed message from the messages array
      const messages = useChatStore.getState().messages;
      const filteredMessages = messages.filter((msg) => msg.id !== lastUserMsgId);
      setMessages(filteredMessages);
    }

    // Clear error state
    setLastError(null);
    isRetryingRef.current = true;

    // Resend the message
    sendMessage(lastMessage);
    isRetryingRef.current = false;
  }, [clearMessageError, setMessages, setLastError, sendMessage]);

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
    retryLastMessage,
    isRetrying: isRetryingRef.current,
  };
}
