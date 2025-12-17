import { create } from 'zustand';

// Message content types (matching backend)
export type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string };

// Chat message type
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: MessageContent[];
  createdAt: Date;
}

// Connection status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

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

// Helper function to get text content from a message
export function getMessageText(message: ChatMessage): string {
  return message.content
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

// Helper to convert raw message data to ChatMessage
export function parseMessage(data: {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: MessageContent[];
  createdAt: string | Date;
}): ChatMessage {
  return {
    id: data.id,
    sessionId: data.sessionId,
    role: data.role,
    content: data.content,
    createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
  };
}
