import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { io } from 'socket.io-client';
import { useChatStore, parseMessage } from '../store/chat-store';
import type { ChatMessage } from '@asba/shared-types';
import { usePanelStore } from '../store/panel-store';
import { useBookingStore } from '../store/booking-store';
import { useMenuStore } from '../store/menu-store';
import { logger } from '../utils/logger';
import { ERROR_MESSAGES } from '../utils/error-messages';
import { BACKEND_URL } from '../api/config';
import type { ChatSocket } from '../socket/events';
import {
  getSessionIdSync,
  setSessionIdSync,
  clearSessionIdSync,
} from '../socket/session-storage';
import { enqueue, flushQueue, getQueue } from '../storage/offline-queue';

/**
 * Port of frontend/src/hooks/useWebSocket.ts.
 *
 * The ref-based design is kept verbatim. Those refs are not a web idiom -- they
 * exist so socket.io event callbacks never read stale React state -- and they
 * matter more on a device, not less.
 *
 * Three things differ from web:
 *  1. The session id comes from src/socket/session-storage.ts, which is
 *     hydrated before this hook ever mounts. See that file for why awaiting
 *     AsyncStorage inside connect() would be a bug.
 *  2. AppState and NetInfo resume handling, which the web app has no need for.
 *  3. connect() reads store actions through getState() rather than closing over
 *     18 destructured actions, so its dependency array is empty. On web those
 *     identities happen to be stable and the effect never re-fires, but that is
 *     luck: any future `create()` refactor would tear down and rebuild the
 *     socket on every render.
 */

export interface UseWebSocketReturn {
  sendMessage: (message: string) => void;
  reconnect: () => void;
  disconnect: () => void;
  retryLastMessage: () => void;
  isRetrying: boolean;
  switchSession: (sessionId: string) => void;
  createNewSession: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_CONNECTION_TIMEOUT = 10000;
const MESSAGE_TIMEOUT = 30000;
/** NetInfo is chatty on iOS; collapse bursts before acting on them. */
const NETWORK_DEBOUNCE = 500;

export function useWebSocket(): UseWebSocketReturn {
  const socketRef = useRef<ChatSocket | null>(null);
  const reconnectAttempts = useRef(0);

  // Guards against a stale async continuation touching a socket that has since
  // been replaced or torn down.
  const generationRef = useRef(0);

  // Ref, not state: the store update is async but the ref update is synchronous.
  const streamingIdRef = useRef<string | null>(null);
  const streamingMessageCreatedRef = useRef<boolean>(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const lastUserMessageIdRef = useRef<string | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMessageRef = useRef<boolean>(false);
  // Messages typed before the socket was up. In-memory only -- they do not
  // survive the process being killed.
  const messageQueueRef = useRef<string[]>([]);
  const queuedMessageIdsRef = useRef<string[]>([]);
  const initialConnectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // When a message was sent, so the timeout can be re-armed with the remaining
  // budget after the app comes back to the foreground.
  const pendingSinceRef = useRef<number | null>(null);

  const clearMessageTimeout = useCallback(() => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
  }, []);

  const handleMessageFailure = useCallback(
    (errorMessage: string) => {
      clearMessageTimeout();

      const store = useChatStore.getState();

      const lastUserMsgId = lastUserMessageIdRef.current;
      if (lastUserMsgId && pendingMessageRef.current) {
        store.markMessageFailed(lastUserMsgId, errorMessage);
      }

      // Drop any half-streamed assistant bubble.
      const streamingId = streamingIdRef.current;
      if (streamingId && streamingMessageCreatedRef.current) {
        store.setMessages(store.messages.filter((msg) => msg.id !== streamingId));
      }

      store.setLastError(errorMessage);

      streamingIdRef.current = null;
      streamingMessageCreatedRef.current = false;
      store.setStreamingMessageId(null);
      store.setIsLoading(false);
      store.setIsAiWorking(false);
      pendingMessageRef.current = false;
      pendingSinceRef.current = null;
      setIsRetrying(false);
    },
    [clearMessageTimeout]
  );

  const armMessageTimeout = useCallback(
    (ms: number = MESSAGE_TIMEOUT) => {
      clearMessageTimeout();
      pendingSinceRef.current = Date.now();
      messageTimeoutRef.current = setTimeout(() => {
        if (pendingMessageRef.current) {
          logger.warn('Message timeout - no response received');
          handleMessageFailure(ERROR_MESSAGES.AI_TIMEOUT);
        }
      }, ms);
    },
    [clearMessageTimeout, handleMessageFailure]
  );

  const clearInitialConnectionTimeout = useCallback(() => {
    if (initialConnectionTimeoutRef.current) {
      clearTimeout(initialConnectionTimeoutRef.current);
      initialConnectionTimeoutRef.current = null;
    }
  }, []);

  const flushMessageQueue = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    const queuedMessages = [...messageQueueRef.current];
    messageQueueRef.current = [];
    queuedMessageIdsRef.current = [];

    if (queuedMessages.length === 0) return;

    logger.debug('Flushing queued messages', { count: queuedMessages.length });

    queuedMessages.forEach((message) => {
      useChatStore.getState().setLastAttemptedMessage(message);
      armMessageTimeout();
      socket.emit('user_message', { message });
    });
  }, [armMessageTimeout]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    const generation = ++generationRef.current;
    const store = useChatStore.getState();
    store.setConnectionStatus('connecting');

    // Synchronous, by design -- see src/socket/session-storage.ts.
    const storedSessionId = getSessionIdSync();

    const socket: ChatSocket = io(BACKEND_URL, {
      query: storedSessionId ? { sessionId: storedSessionId } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    initialConnectionTimeoutRef.current = setTimeout(() => {
      const hasConnected = useChatStore.getState().hasConnectedOnce;
      if (!hasConnected && messageQueueRef.current.length > 0) {
        logger.warn('Initial connection timeout with queued messages');
        const s = useChatStore.getState();
        s.setLastError(ERROR_MESSAGES.CONNECTION_FAILED);
        s.setConnectionStatus('error');
        s.setHasConnectedOnce(true);

        queuedMessageIdsRef.current.forEach((msgId) => {
          s.markMessageFailed(msgId, ERROR_MESSAGES.CONNECTION_FAILED);
        });

        messageQueueRef.current = [];
        queuedMessageIdsRef.current = [];
        pendingMessageRef.current = false;
        s.setIsLoading(false);
      }
    }, INITIAL_CONNECTION_TIMEOUT);

    socket.on('connect', () => {
      if (generationRef.current !== generation) return;
      logger.info('WebSocket connected');
      useChatStore.getState().setConnectionStatus('connected');
      useChatStore.getState().setHasConnectedOnce(true);
      reconnectAttempts.current = 0;
      clearInitialConnectionTimeout();
      flushMessageQueue();

      // Ask for anything that landed while we were away. The server takes our
      // newest message id and replies with just the delta, so this stays cheap
      // even on a long conversation.
      const known = useChatStore.getState().messages;
      socket.emit('sync', { lastMessageId: known[known.length - 1]?.id });

      // Drain anything typed while we were offline.
      flushQueue(socket);
    });

    socket.on('disconnect', (reason) => {
      logger.info('WebSocket disconnected', { reason });
      useChatStore.getState().setConnectionStatus('disconnected');

      if (pendingMessageRef.current) {
        handleMessageFailure(ERROR_MESSAGES.CONNECTION_LOST);
      }
    });

    socket.on('connect_error', (error) => {
      logger.error('WebSocket connection error', { error: String(error) });
      reconnectAttempts.current++;

      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        useChatStore.getState().setConnectionStatus('error');
      }
    });

    socket.on('session_created', (data) => {
      logger.info('Session created', {
        sessionId: data.sessionId,
        currentWorkflowId: data.currentWorkflowId,
      });
      useChatStore.getState().setSessionId(data.sessionId);
      setSessionIdSync(data.sessionId);
      useMenuStore.getState().setCurrentSessionId(data.sessionId);
      if (data.currentWorkflowId) {
        usePanelStore.getState().setActiveWorkflowId(data.currentWorkflowId);
      }
    });

    socket.on('message_history', (data) => {
      logger.debug('Received message history', { count: data.messages.length });
      const parsedMessages = data.messages.map((msg) => parseMessage(msg));

      // We hydrate optimistic messages from disk now, so the old temp- merge
      // branch is redundant. This is only ever the delta since lastMessageId,
      // so appending is correct and cheaper than reconciling by id.
      const currentMessages = useChatStore.getState().messages;
      useChatStore.getState().setMessages([...currentMessages, ...parsedMessages]);
    });

    socket.on('message_start', (data) => {
      logger.debug('Message started', { messageId: data.messageId });
      const s = useChatStore.getState();
      s.setIsLoading(true);
      s.setIsAiWorking(true);

      // The client mints its own id here and rewrites it to the server's id on
      // message_complete.
      const streamingId = `streaming-${Date.now()}`;
      streamingIdRef.current = streamingId;
      streamingMessageCreatedRef.current = true;
      s.setStreamingMessageId(streamingId);

      const message: ChatMessage = {
        id: streamingId,
        sessionId: s.sessionId || '',
        role: 'assistant',
        content: [{ type: 'text', text: '' }],
        createdAt: new Date(),
      };
      s.addMessage(message);
    });

    socket.on('text_delta', (data) => {
      const streamingId = streamingIdRef.current;
      if (!streamingId) return;
      useChatStore.getState().appendTextToMessage(streamingId, data.text);
    });

    // Declared in the shared types but never emitted by the server today.
    socket.on('assistant_message', (data) => {
      logger.debug('Assistant message received', { messageId: data.id });
      const s = useChatStore.getState();
      s.addMessage({
        id: data.id,
        sessionId: s.sessionId || '',
        role: 'assistant',
        content: [{ type: 'text', text: data.content }],
        createdAt: new Date(data.timestamp),
      });
      s.setIsLoading(false);
    });

    socket.on('message_complete', (data) => {
      logger.debug('Message completed', { messageId: data.messageId });
      clearMessageTimeout();

      const s = useChatStore.getState();
      const streamingId = streamingIdRef.current;
      if (streamingId && streamingMessageCreatedRef.current) {
        s.updateMessage(streamingId, { id: data.messageId });
      }

      streamingIdRef.current = null;
      streamingMessageCreatedRef.current = false;
      pendingMessageRef.current = false;
      pendingSinceRef.current = null;
      s.setStreamingMessageId(null);
      s.setIsLoading(false);
      s.setIsAiWorking(false);
    });

    socket.on('error', (data) => {
      logger.error('WebSocket error', { error: data.error, code: data.code });
      handleMessageFailure(ERROR_MESSAGES.AI_REQUEST_FAILED);
    });

    socket.on('display_providers', (data) => {
      logger.debug('Display providers received', {
        count: data.providers.length,
        workflowId: data.workflowId,
        workflowState: data.workflowState,
      });
      usePanelStore
        .getState()
        .openProviderPanel(data.providers, data.workflowId, data.workflowState);
    });

    socket.on('open_provider_detail', (data) => {
      logger.debug('Open provider detail received', {
        providerId: data.providerId,
        providerName: data.providerName,
        workflowId: data.workflowId,
      });
      useBookingStore.getState().openProviderModal(data.providerId, data.workflowId);
    });

    // Also declared but never emitted today.
    socket.on('booking_success', (data) => {
      logger.debug('Booking success received', { bookingId: data.bookingId });
      usePanelStore.getState().clearProviders();
    });
  }, [
    clearInitialConnectionTimeout,
    clearMessageTimeout,
    flushMessageQueue,
    handleMessageFailure,
  ]);

  const disconnect = useCallback(() => {
    generationRef.current++;
    clearMessageTimeout();
    clearInitialConnectionTimeout();

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    streamingIdRef.current = null;
    streamingMessageCreatedRef.current = false;
    pendingMessageRef.current = false;
    pendingSinceRef.current = null;

    messageQueueRef.current = [];
    queuedMessageIdsRef.current = [];
  }, [clearMessageTimeout, clearInitialConnectionTimeout]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    connect();
  }, [disconnect, connect]);

  const sendMessage = useCallback(
    (message: string) => {
      const socket = socketRef.current;
      const store = useChatStore.getState();

      if (!message.trim()) {
        return;
      }

      const trimmedMessage = message.trim();

      const messageId = `temp-${Date.now()}`;
      const userMessage: ChatMessage = {
        id: messageId,
        sessionId: store.sessionId || '',
        role: 'user',
        content: [{ type: 'text', text: trimmedMessage }],
        createdAt: new Date(),
      };
      store.addMessage(userMessage);
      store.setIsLoading(true);

      lastUserMessageIdRef.current = messageId;
      pendingMessageRef.current = true;

      if (!socket?.connected) {
        logger.debug('Queueing message - offline', { depth: getQueue().length });
        enqueue({ id: messageId, text: trimmedMessage, queuedAt: Date.now() });
        store.setLastAttemptedMessage(trimmedMessage);
        return;
      }

      store.setLastAttemptedMessage(trimmedMessage);
      store.setLastError(null);
      armMessageTimeout();

      socket.emit('user_message', { message: trimmedMessage });
    },
    [armMessageTimeout]
  );

  const retryLastMessage = useCallback(() => {
    const store = useChatStore.getState();
    const lastMessage = store.lastAttemptedMessage;
    const lastUserMsgId = lastUserMessageIdRef.current;

    if (!lastMessage) {
      logger.warn('No message to retry');
      return;
    }

    if (lastUserMsgId) {
      store.clearMessageError(lastUserMsgId);
      store.setMessages(store.messages.filter((msg) => msg.id !== lastUserMsgId));
    }

    store.setLastError(null);
    setIsRetrying(true);

    sendMessage(lastMessage);
    setIsRetrying(false);
  }, [sendMessage]);

  const resetStores = useCallback(() => {
    useChatStore.getState().reset();
    usePanelStore.getState().reset();
    useBookingStore.getState().reset();
  }, []);

  const switchSession = useCallback(
    (sessionId: string) => {
      logger.info('Switching session', { sessionId });

      disconnect();
      setSessionIdSync(sessionId);
      resetStores();
      useMenuStore.getState().setCurrentSessionId(sessionId);

      reconnectAttempts.current = 0;
      connect();
    },
    [disconnect, connect, resetStores]
  );

  const createNewSession = useCallback(() => {
    logger.info('Creating new session');

    disconnect();
    clearSessionIdSync();
    resetStores();
    useMenuStore.getState().setCurrentSessionId(null);

    reconnectAttempts.current = 0;
    connect();
  }, [disconnect, connect, resetStores]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  /**
   * Foreground/background handling. This is mandatory, not a nicety.
   *
   * socket.io's `reconnectionAttempts: 5` is terminal: once the manager
   * exhausts five attempts it gives up permanently and never retries on its
   * own. On a phone that happens routinely -- a lift, a tunnel, a lock screen
   * -- so without an explicit connect() on resume the app stays dead until it
   * is force-quit.
   *
   * The socket is deliberately left alone on background: iOS keeps it alive for
   * tens of seconds and a reconnect costs a full message_history replay.
   */
  useEffect(() => {
    const handleChange = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        // A message sent seconds before backgrounding would otherwise trip the
        // 30s AI_TIMEOUT while the assistant is still replying, marking the
        // user's message failed and deleting the in-flight bubble.
        clearMessageTimeout();
        return;
      }

      if (next !== 'active') return;

      const socket = socketRef.current;
      if (socket && !socket.connected) {
        logger.info('Resuming: reconnecting socket after foreground');
        reconnectAttempts.current = 0;
        socket.connect();
      }

      if (pendingMessageRef.current && pendingSinceRef.current !== null) {
        const elapsed = Date.now() - pendingSinceRef.current;
        const remaining = MESSAGE_TIMEOUT - elapsed;
        if (remaining <= 0) {
          handleMessageFailure(ERROR_MESSAGES.AI_TIMEOUT);
        } else {
          armMessageTimeout(remaining);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleChange);
    return () => subscription.remove();
  }, [armMessageTimeout, clearMessageTimeout, handleMessageFailure]);

  /** Same rationale as AppState: socket.io's own backoff has already given up. */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (!online) return;

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const socket = socketRef.current;
        if (socket && !socket.connected) {
          logger.info('Resuming: reconnecting socket after network change');
          reconnectAttempts.current = 0;
          socket.connect();
        }
      }, NETWORK_DEBOUNCE);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return {
    sendMessage,
    reconnect,
    disconnect,
    retryLastMessage,
    isRetrying,
    switchSession,
    createNewSession,
  };
}
