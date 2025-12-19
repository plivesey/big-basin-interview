/**
 * Shared message content and chat message types
 * Used by both frontend and backend
 */

/**
 * Text content block in a message
 */
export interface TextContent {
  type: 'text';
  text: string;
}

/**
 * Tool use content block - when Claude invokes a tool
 */
export interface ToolUseContent {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool result content block - the result of a tool execution
 */
export interface ToolResultContent {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

/**
 * System notification content block - hidden from user but visible to AI
 * Used for internal notifications like booking confirmations
 */
export interface SystemNotificationContent {
  type: 'system_notification';
  text: string;
}

/**
 * Union type for all message content block types
 */
export type MessageContent = TextContent | ToolUseContent | ToolResultContent | SystemNotificationContent;

/**
 * Chat message role - who sent the message
 */
export type MessageRole = 'user' | 'assistant';

/**
 * Core chat message interface used across the application
 */
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: MessageContent[];
  createdAt: Date;
}

/**
 * Raw chat message from server (with string date)
 * Used when deserializing from JSON
 */
export interface RawChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: MessageContent[];
  createdAt: string;
}

/**
 * Helper type guard to check if content is text
 */
export function isTextContent(content: MessageContent): content is TextContent {
  return content.type === 'text';
}

/**
 * Helper type guard to check if content is tool use
 */
export function isToolUseContent(content: MessageContent): content is ToolUseContent {
  return content.type === 'tool_use';
}

/**
 * Helper type guard to check if content is tool result
 */
export function isToolResultContent(content: MessageContent): content is ToolResultContent {
  return content.type === 'tool_result';
}

/**
 * Helper type guard to check if content is system notification
 */
export function isSystemNotificationContent(content: MessageContent): content is SystemNotificationContent {
  return content.type === 'system_notification';
}

/**
 * Extract text from a message's content blocks
 */
export function getMessageText(message: ChatMessage): string {
  return message.content
    .filter(isTextContent)
    .map((block) => block.text)
    .join('\n');
}

/**
 * Parse a raw message (from JSON) into a ChatMessage
 */
export function parseMessage(raw: RawChatMessage): ChatMessage {
  return {
    id: raw.id,
    sessionId: raw.sessionId,
    role: raw.role,
    content: raw.content,
    createdAt: new Date(raw.createdAt),
  };
}
