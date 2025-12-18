/**
 * @asba/shared-types
 * Shared TypeScript types for Service Booking Assistant
 */

// Message types
export type {
  TextContent,
  ToolUseContent,
  ToolResultContent,
  MessageContent,
  MessageRole,
  ChatMessage,
  RawChatMessage,
} from './messages';

export {
  isTextContent,
  isToolUseContent,
  isToolResultContent,
  getMessageText,
  parseMessage,
} from './messages';

// WebSocket event types
export type {
  ServerToClientEvents,
  ClientToServerEvents,
  ConnectionStatus,
} from './websocket-events';
