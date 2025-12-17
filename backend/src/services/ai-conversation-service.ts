import Anthropic from '@anthropic-ai/sdk';
import { env, requireAnthropicKey } from '../config/env';
import { getMessageHistory, ChatMessage } from './message-service';
import { logger } from '../utils/logger';
import { TextContent } from '../db/schema';

// Initialize client lazily to allow app to start without API key
let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: requireAnthropicKey(),
    });
  }
  return client;
}

// System prompt for the booking assistant
const SYSTEM_PROMPT = `You are a helpful service booking assistant. You help users find and book appointments with local service providers like salons, mechanics, and dentists.

Your role is to:
- Understand what service the user needs
- Help them find suitable providers
- Guide them through the booking process
- Answer questions about services and availability

Be friendly, concise, and helpful. Ask clarifying questions when needed to better understand the user's needs.`;

/**
 * Type guard to check if a content block is a text block
 */
function isTextContent(block: { type: string }): block is TextContent {
  return block.type === 'text';
}

/**
 * Convert database message history to Claude API message format
 */
export function buildMessagesArray(history: ChatMessage[]): Anthropic.MessageParam[] {
  return history.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
      .filter(isTextContent)
      .map((block) => ({ type: 'text' as const, text: block.text }))
      .filter((b) => b.text.length > 0),
  }));
}

/**
 * Callbacks for streaming events
 */
export interface StreamCallbacks {
  onTextDelta?: (text: string) => void;
}

/**
 * Send a message to Claude with streaming support
 * Calls onTextDelta callback as text arrives, returns full response when complete
 */
export async function sendMessage(
  sessionId: string,
  userMessage: string,
  callbacks?: StreamCallbacks
): Promise<string> {
  logger.info('Sending message to AI', { sessionId, messageLength: userMessage.length });

  // Load conversation history from database
  const history = await getMessageHistory(sessionId);
  logger.debug('Loaded message history', { sessionId, messageCount: history.length });

  // Build messages array for Claude API
  const messages = buildMessagesArray(history);

  // Add the new user message
  messages.push({ role: 'user', content: userMessage });

  logger.debug('Calling Claude API with streaming', { totalMessages: messages.length });

  // Accumulate full response
  let fullResponse = '';

  // Call Claude API with streaming
  const stream = getClient().messages.stream({
    model: env.CLAUDE_MODEL,
    max_tokens: env.CLAUDE_MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages,
  });

  // Handle streaming events
  stream.on('text', (text) => {
    fullResponse += text;
    if (callbacks?.onTextDelta) {
      callbacks.onTextDelta(text);
    }
  });

  // Wait for stream to complete
  const finalMessage = await stream.finalMessage();

  logger.info('Received AI response', {
    sessionId,
    stopReason: finalMessage.stop_reason,
    inputTokens: finalMessage.usage.input_tokens,
    outputTokens: finalMessage.usage.output_tokens,
  });

  if (!fullResponse) {
    logger.warn('AI response contained no text', { sessionId });
  }

  return fullResponse;
}
