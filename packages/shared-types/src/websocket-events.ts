/**
 * WebSocket event types for real-time chat communication
 * Used by both frontend (socket.io-client) and backend (socket.io)
 */

import type { RawChatMessage } from './messages';

/**
 * Provider data for display in UI
 */
export interface DisplayProvider {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number | null;
  services: string[];
  address: string;
}

/**
 * Events emitted from server to client
 */
export interface ServerToClientEvents {
  /** Session was created or restored */
  session_created: (data: { sessionId: string }) => void;

  /** Message history loaded (on connect/reconnect) */
  message_history: (data: { messages: RawChatMessage[] }) => void;

  /** Assistant started generating a response */
  message_start: (data: { messageId: string }) => void;

  /** Text chunk received during streaming */
  text_delta: (data: { text: string }) => void;

  /** Complete assistant message (non-streaming path) */
  assistant_message: (data: {
    id: string;
    content: string;
    timestamp: string
  }) => void;

  /** Streaming message is complete */
  message_complete: (data: { messageId: string }) => void;

  /** Tool execution started */
  tool_start: (data: { toolName: string; toolUseId: string }) => void;

  /** Tool execution completed */
  tool_complete: (data: {
    toolName: string;
    toolUseId: string;
    success: boolean;
  }) => void;

  /** Display providers in side panel */
  display_providers: (data: { providers: DisplayProvider[] }) => void;

  /** Error occurred */
  error: (data: { error: string; code?: string }) => void;
}

/**
 * Events emitted from client to server
 */
export interface ClientToServerEvents {
  /** User sends a message */
  user_message: (data: { message: string }) => void;

  /** Request sync after reconnection */
  sync: (data: { lastMessageId?: string }) => void;
}

/**
 * Connection status for WebSocket
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
