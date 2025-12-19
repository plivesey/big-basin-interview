/**
 * @asba/shared-types
 * Shared TypeScript types for Service Booking Assistant
 */

// Message types
export type {
  TextContent,
  ToolUseContent,
  ToolResultContent,
  SystemNotificationContent,
  MessageContent,
  MessageRole,
  ChatMessage,
  RawChatMessage,
} from './messages';

export {
  isTextContent,
  isToolUseContent,
  isToolResultContent,
  isSystemNotificationContent,
  getMessageText,
  parseMessage,
} from './messages';

// WebSocket event types
export type {
  ServerToClientEvents,
  ClientToServerEvents,
  ConnectionStatus,
  DisplayProvider,
  ProviderDetail,
  TimeSlot,
  WorkingHours,
  WorkflowState,
} from './websocket-events';

// Session types for conversation history
export interface SessionListItem {
  id: string;
  title: string;
  date: string; // ISO format
}
