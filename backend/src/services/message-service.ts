import { v4 as uuidv4 } from 'uuid';
import { eq, asc, and, gt } from 'drizzle-orm';
import { db, messages, MessageContent, Message, NewMessage } from '../db';

export interface SaveMessageParams {
  id?: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string | MessageContent[];
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: MessageContent[];
  createdAt: Date;
}

/**
 * Normalize content to MessageContent array format
 * Handles both string content and already-formatted MessageContent arrays
 */
function normalizeContent(content: string | MessageContent[]): MessageContent[] {
  if (typeof content === 'string') {
    return [{ type: 'text', text: content }];
  }
  return content;
}

/**
 * Save a message to the database
 */
export async function saveMessage(params: SaveMessageParams): Promise<ChatMessage> {
  const { id, sessionId, role, content } = params;

  if (!sessionId || !sessionId.trim()) {
    throw new Error('Session ID is required');
  }

  if (!role || (role !== 'user' && role !== 'assistant')) {
    throw new Error('Role must be "user" or "assistant"');
  }

  if (content === null || content === undefined) {
    throw new Error('Content is required');
  }

  const normalizedContent = normalizeContent(content);
  const now = new Date();

  const newMessage: NewMessage = {
    id: id || uuidv4(),
    sessionId,
    role,
    content: normalizedContent,
    createdAt: now,
  };

  await db.insert(messages).values(newMessage);

  return {
    id: newMessage.id,
    sessionId: newMessage.sessionId,
    role: newMessage.role as 'user' | 'assistant',
    content: normalizedContent,
    createdAt: now,
  };
}

/**
 * Get message history for a session in chronological order
 */
export async function getMessageHistory(sessionId: string): Promise<ChatMessage[]> {
  if (!sessionId || !sessionId.trim()) {
    return [];
  }

  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(asc(messages.createdAt));

  return result.map((msg: Message) => ({
    id: msg.id,
    sessionId: msg.sessionId,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    createdAt: msg.createdAt,
  }));
}

/**
 * Delete all messages for a session (useful for testing)
 */
export async function deleteMessageHistory(sessionId: string): Promise<number> {
  if (!sessionId || !sessionId.trim()) {
    return 0;
  }

  const result = await db
    .delete(messages)
    .where(eq(messages.sessionId, sessionId));

  return result.changes;
}

/**
 * Get a single message by ID
 */
export async function getMessageById(messageId: string): Promise<ChatMessage | null> {
  if (!messageId || !messageId.trim()) {
    return null;
  }

  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const msg = result[0];
  return {
    id: msg.id,
    sessionId: msg.sessionId,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    createdAt: msg.createdAt,
  };
}

/**
 * Get messages since a specific message ID (for sync/reconnection)
 */
export async function getMessagesSince(sessionId: string, afterMessageId: string): Promise<ChatMessage[]> {
  if (!sessionId || !sessionId.trim()) {
    return [];
  }

  // Get the timestamp of the reference message
  const referenceMsg = await getMessageById(afterMessageId);
  if (!referenceMsg) {
    // If reference message not found, return all messages
    return getMessageHistory(sessionId);
  }

  // Use SQL query to filter messages after the reference timestamp
  const result = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.sessionId, sessionId),
        gt(messages.createdAt, referenceMsg.createdAt)
      )
    )
    .orderBy(asc(messages.createdAt));

  return result.map((msg: Message) => ({
    id: msg.id,
    sessionId: msg.sessionId,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    createdAt: msg.createdAt,
  }));
}
