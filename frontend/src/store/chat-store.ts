import { create } from 'zustand';
import type { ChatMessage, ConnectionStatus } from '@asba/shared-types';

// Re-export types and utilities from shared package for backward compatibility
export type { ChatMessage, MessageContent, ConnectionStatus } from '@asba/shared-types';
export { getMessageText, parseMessage } from '@asba/shared-types';

// Chat store state
export interface ChatState {
  // Session state
  sessionId: string | null;
  connectionStatus: ConnectionStatus;
  hasConnectedOnce: boolean;

  // Messages state
  messages: ChatMessage[];
  isLoading: boolean;
  isAiWorking: boolean;
  streamingMessageId: string | null;

  // Error state
  failedMessageIds: Set<string>;
  lastError: string | null;
  lastAttemptedMessage: string | null;

  // Actions
  setSessionId: (sessionId: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setHasConnectedOnce: (value: boolean) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  appendTextToMessage: (messageId: string, text: string) => void;
  setStreamingMessageId: (messageId: string | null) => void;
  clearMessages: () => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsAiWorking: (isAiWorking: boolean) => void;
  reset: () => void;

  // Error actions
  markMessageFailed: (messageId: string, error: string) => void;
  clearMessageError: (messageId: string) => void;
  setLastError: (error: string | null) => void;
  setLastAttemptedMessage: (message: string | null) => void;
}

// Initial state
const initialState = {
  sessionId: null,
  connectionStatus: 'disconnected' as ConnectionStatus,
  hasConnectedOnce: false,
  messages: [],
  isLoading: false,
  isAiWorking: false,
  streamingMessageId: null,
  failedMessageIds: new Set<string>(),
  lastError: null,
  lastAttemptedMessage: null,
};

// Create the store
export const useChatStore = create<ChatState>((set) => ({
  ...initialState,

  setSessionId: (sessionId: string) => set({ sessionId }),

  setConnectionStatus: (status: ConnectionStatus) => set({ connectionStatus: status }),

  setHasConnectedOnce: (value: boolean) => set({ hasConnectedOnce: value }),

  setMessages: (messages: ChatMessage[]) => set({ messages }),

  addMessage: (message: ChatMessage) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (messageId: string, updates: Partial<ChatMessage>) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    })),

  appendTextToMessage: (messageId: string, text: string) =>
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id !== messageId) return msg;
        // Find or create text content block
        const textBlock = msg.content.find((block) => block.type === 'text');
        if (textBlock && textBlock.type === 'text') {
          return {
            ...msg,
            content: msg.content.map((block) =>
              block.type === 'text' ? { ...block, text: block.text + text } : block
            ),
          };
        }
        // No text block exists, add one
        return {
          ...msg,
          content: [...msg.content, { type: 'text' as const, text }],
        };
      }),
    })),

  setStreamingMessageId: (messageId: string | null) => set({ streamingMessageId: messageId }),

  clearMessages: () => set({ messages: [] }),

  setIsLoading: (isLoading: boolean) => set({ isLoading }),

  setIsAiWorking: (isAiWorking: boolean) => set({ isAiWorking }),

  reset: () =>
    set({
      ...initialState,
      // Create fresh Set instance to avoid shared state
      failedMessageIds: new Set<string>(),
    }),

  // Error actions
  markMessageFailed: (messageId: string, error: string) =>
    set((state) => {
      const newFailedIds = new Set(state.failedMessageIds);
      newFailedIds.add(messageId);
      return {
        failedMessageIds: newFailedIds,
        lastError: error,
      };
    }),

  clearMessageError: (messageId: string) =>
    set((state) => {
      const newFailedIds = new Set(state.failedMessageIds);
      newFailedIds.delete(messageId);
      return {
        failedMessageIds: newFailedIds,
        // Clear lastError if no more failed messages
        lastError: newFailedIds.size === 0 ? null : state.lastError,
      };
    }),

  setLastError: (error: string | null) => set({ lastError: error }),

  setLastAttemptedMessage: (message: string | null) => set({ lastAttemptedMessage: message }),
}));

// Selectors - use these to subscribe to specific pieces of state
// This prevents unnecessary re-renders when unrelated state changes
export const selectMessages = (state: ChatState) => state.messages;
export const selectIsLoading = (state: ChatState) => state.isLoading;
export const selectIsAiWorking = (state: ChatState) => state.isAiWorking;
export const selectConnectionStatus = (state: ChatState) => state.connectionStatus;
export const selectHasConnectedOnce = (state: ChatState) => state.hasConnectedOnce;
export const selectSessionId = (state: ChatState) => state.sessionId;
export const selectStreamingMessageId = (state: ChatState) => state.streamingMessageId;

// Error selectors
export const selectFailedMessageIds = (state: ChatState) => state.failedMessageIds;
export const selectLastError = (state: ChatState) => state.lastError;
export const selectLastAttemptedMessage = (state: ChatState) => state.lastAttemptedMessage;

/**
 * Create a selector to check if a specific message failed.
 * Usage: useChatStore(selectIsMessageFailed(messageId))
 */
export const selectIsMessageFailed = (messageId: string) => (state: ChatState) =>
  state.failedMessageIds.has(messageId);
