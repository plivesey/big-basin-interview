import Anthropic from '@anthropic-ai/sdk';
import { requireAnthropicKey } from '../config/env';
import { getMessageHistory, ChatMessage } from './message-service';
import { logger } from '../utils/logger';

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
 * Convert database message history to Claude API message format
 */
function buildMessagesArray(history: ChatMessage[]): Anthropic.MessageParam[] {
  return history.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
      .filter((block) => block.type === 'text')
      .map((block) => {
        if (block.type === 'text') {
          return { type: 'text' as const, text: block.text };
        }
        // This shouldn't happen due to filter, but TypeScript needs it
        return { type: 'text' as const, text: '' };
      })
      .filter((b) => b.text.length > 0),
  }));
}

/**
 * Send a message to Claude and get a response
 * Non-streaming implementation for simplicity
 */
export async function sendMessage(sessionId: string, userMessage: string): Promise<string> {
  logger.info('Sending message to AI', { sessionId, messageLength: userMessage.length });

  // Load conversation history from database
  const history = await getMessageHistory(sessionId);
  logger.debug('Loaded message history', { sessionId, messageCount: history.length });

  // Build messages array for Claude API
  // Note: We don't include the current user message since it's not in DB yet
  const messages = buildMessagesArray(history);

  // Add the new user message
  messages.push({ role: 'user', content: userMessage });

  logger.debug('Calling Claude API', { totalMessages: messages.length });

  // Call Claude API
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  logger.info('Received AI response', {
    sessionId,
    stopReason: response.stop_reason,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  // Extract text from response
  const textBlock = response.content.find((block) => block.type === 'text');
  const responseText = textBlock?.type === 'text' ? textBlock.text : '';

  if (!responseText) {
    logger.warn('AI response contained no text', { sessionId, content: response.content });
  }

  return responseText;
}
