import { create } from 'zustand';
import type {
  ChatMessage,
  MessageContent,
  ConnectionStatus,
} from '@asba/shared-types';
import { getMessageText, parseMessage } from '@asba/shared-types';

// Re-export types from shared package for backward compatibility
export type { ChatMessage, MessageContent, ConnectionStatus } from '@asba/shared-types';
export { getMessageText, parseMessage } from '@asba/shared-types';

// Chat store state
export interface ChatState {
  // Session state
  sessionId: string | null;
  connectionStatus: ConnectionStatus;

  // Messages state
  messages: ChatMessage[];
  isLoading: boolean;
  streamingMessageId: string | null;

  // Actions
  setSessionId: (sessionId: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  appendTextToMessage: (messageId: string, text: string) => void;
  setStreamingMessageId: (messageId: string | null) => void;
  clearMessages: () => void;
  setIsLoading: (isLoading: boolean) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  sessionId: null,
  connectionStatus: 'disconnected' as ConnectionStatus,
  messages: [],
  isLoading: false,
  streamingMessageId: null,
};

// Create the store
export const useChatStore = create<ChatState>((set) => ({
  ...initialState,

  setSessionId: (sessionId: string) => set({ sessionId }),

  setConnectionStatus: (status: ConnectionStatus) => set({ connectionStatus: status }),

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

  reset: () => set(initialState),
}));

// Selectors - use these to subscribe to specific pieces of state
// This prevents unnecessary re-renders when unrelated state changes
export const selectMessages = (state: ChatState) => state.messages;
export const selectIsLoading = (state: ChatState) => state.isLoading;
export const selectConnectionStatus = (state: ChatState) => state.connectionStatus;
export const selectSessionId = (state: ChatState) => state.sessionId;
export const selectStreamingMessageId = (state: ChatState) => state.streamingMessageId;
