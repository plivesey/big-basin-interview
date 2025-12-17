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

/**
 * Custom error class for AI-related errors
 */
export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable (5xx errors, network errors, timeouts)
 */
function isRetryableError(error: unknown): boolean {
  // Timeout errors are retryable
  if (error instanceof AIError && error.code === 'TIMEOUT') {
    return true;
  }

  // Anthropic API errors
  if (error instanceof Anthropic.APIError) {
    // Retry on 5xx (server errors) and 429 (rate limit)
    if (error.status >= 500 || error.status === 429) {
      return true;
    }
    // Don't retry on 4xx (client errors) except 429
    return false;
  }

  // Network errors are retryable
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('etimedout')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate retry delays with exponential backoff
 * Returns array of delays in ms: [1000, 2000, 4000, 8000, 16000]
 */
function getRetryDelays(maxRetries: number): number[] {
  const delays: number[] = [];
  for (let i = 0; i < maxRetries; i++) {
    delays.push(1000 * Math.pow(2, i)); // 1s, 2s, 4s, 8s, 16s...
  }
  return delays;
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
 * Internal function to send a message with timeout protection
 * Does NOT include retry logic - that's handled by the wrapper
 */
async function sendMessageInternal(
  sessionId: string,
  messages: Anthropic.MessageParam[],
  callbacks?: StreamCallbacks
): Promise<string> {
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

  // Create timeout promise
  const timeoutMs = env.AI_TIMEOUT_MS;
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      stream.abort();
      reject(new AIError('AI response timed out', 'TIMEOUT', true));
    }, timeoutMs);
  });

  // Race between stream completion and timeout
  const finalMessage = await Promise.race([stream.finalMessage(), timeoutPromise]);

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

/**
 * Send a message to Claude with streaming support, timeout protection, and retry logic
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

  // Retry logic with exponential backoff
  const retryDelays = getRetryDelays(env.AI_MAX_RETRIES);
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
    try {
      return await sendMessageInternal(sessionId, messages, callbacks);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!isRetryableError(error)) {
        logger.error('Non-retryable AI error', {
          sessionId,
          error: lastError.message,
          attempt: attempt + 1,
        });
        throw error;
      }

      // Check if we've exhausted retries
      if (attempt >= retryDelays.length) {
        logger.error('AI request failed after all retries', {
          sessionId,
          error: lastError.message,
          totalAttempts: attempt + 1,
        });
        throw new AIError(
          `AI request failed after ${attempt + 1} attempts: ${lastError.message}`,
          'MAX_RETRIES_EXCEEDED',
          false
        );
      }

      // Wait before retrying
      const delay = retryDelays[attempt];
      logger.warn('Retrying AI request', {
        sessionId,
        attempt: attempt + 1,
        maxAttempts: retryDelays.length + 1,
        delayMs: delay,
        error: lastError.message,
      });
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError ?? new Error('Unknown error');
}
