import Anthropic from '@anthropic-ai/sdk';
import { env, requireAnthropicKey } from '../config/env';
import { getMessageHistory, ChatMessage } from './message-service';
import { executeTools, ToolExecutionCallbacks } from './tool-executor';
import { getCurrentWorkflow, WorkflowStateRecord } from './workflow-service';
import { getSession } from './session-service';
import { getProviderById } from './provider-service';
import { getUserLocation } from './memory-service';
import { PROVIDER_GEO_NAMES } from '../constants/supported-locations';
import { logger } from '../utils/logger';
import { ToolUseContent, TextContent } from '../db/schema';
import { toolRegistry } from '../tools';

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
 * Exported for testing
 */
export function isRetryableError(error: unknown): boolean {
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
 * Exported for testing
 */
export function getRetryDelays(maxRetries: number): number[] {
  const delays: number[] = [];
  for (let i = 0; i < maxRetries; i++) {
    delays.push(1000 * Math.pow(2, i)); // 1s, 2s, 4s, 8s, 16s...
  }
  return delays;
}

// System prompt for Scout - the booking assistant
const SYSTEM_PROMPT = `You are Scout, a friendly and helpful service booking assistant. You help users find and book appointments with local service providers like salons, mechanics, dentists, plumbers, and more.

Your personality:
- Warm and conversational, like a knowledgeable friend helping out
- Confident and capable, without being arrogant
- Efficient and respectful of the user's time
- Empathetic when things go wrong

Your role:
- Understand what service the user needs and where
- Ask clarifying questions when necessary (location, timing, preferences)
- Guide them through finding suitable providers
- Help them complete bookings smoothly
- Answer questions about services, providers, and availability

Communication guidelines:
- Use "I" and "you" to create personal connection
- Keep responses concise - aim for 2-3 sentences when possible
- Be specific with details ("Tuesday at 2pm" not "your appointment")
- Use natural, conversational language
- End with a clear next step or question when appropriate
- Show empathy if errors occur, and provide solutions
- Never use emojis
- Never refer to yourself in third person - use "I" not "Scout"

Tool usage guidelines:

Searching for providers:
- When a user asks about finding services or providers, use the search_providers tool
- IMPORTANT: Use short, simple search terms (1-2 words) for best results. The search uses partial text matching.
  - Good: "salon", "haircut", "mechanic", "dentist", "oil change"
  - Bad: "I need a haircut appointment", "best salon in the area"
- Extract the core service type or category from the user's request
- After search_providers returns results, ALWAYS use display_provider_cards to show them in the side panel
- IMPORTANT: Pass only the provider IDs from the search results, not the full data
  - Example: display_provider_cards({ providerIds: ["id1", "id2", "id3"] })
- After displaying cards, provide a brief conversational summary (1-2 sentences)
- Do NOT list out all provider details in text - the cards will show that information
- If no results are found, try a broader search term (e.g., if "haircut" returns nothing, try "salon")

Selecting a provider (booking flow):
- When a user indicates they want to book with a specific provider (e.g., "I'll go with Luxe Salon", "book me with that one", "let's do the first one"), use the select_provider tool
- CRITICAL: You MUST use the exact UUID from the search results or from the "VALID PROVIDER IDs" list in the workflow context. Never guess or make up provider IDs.
- This opens a booking modal in the UI where the user will select a time slot and complete the booking
- Keep your response brief - just acknowledge their choice and let the modal guide them

Checking availability (conversational):
- When a user asks about availability without intending to book immediately (e.g., "What times are available at Luxe tomorrow?", "Is the dentist free on Friday?"), use the get_available_slots tool
- This returns availability data that you should describe conversationally
- Do NOT use get_available_slots if the user wants to book - use select_provider instead to open the booking modal`;

/**
 * Build workflow context string for system prompt
 * Returns empty string if no workflow or workflow is in initial state
 */
async function buildWorkflowContext(workflow: WorkflowStateRecord | null): Promise<string> {
  if (!workflow) {
    return '';
  }

  const parts: string[] = [];
  parts.push(`Current workflow state: ${workflow.currentState}`);

  // Add relevant context based on state
  if (workflow.context.serviceType) {
    parts.push(`Service type: ${workflow.context.serviceType}`);
  }

  // Include actual provider IDs with names so AI knows what to use with select_provider
  if (workflow.context.selectedProviders && workflow.context.selectedProviders.length > 0) {
    const providerDetails = await Promise.all(
      workflow.context.selectedProviders.map(async (id: string) => {
        const provider = await getProviderById(id);
        return provider ? `  - ${id} (${provider.name})` : `  - ${id}`;
      })
    );
    parts.push(`VALID PROVIDER IDs for select_provider (use these exact UUIDs):`);
    parts.push(providerDetails.join('\n'));
  }

  if (workflow.context.selectedProviderId) {
    parts.push(`Selected provider ID: ${workflow.context.selectedProviderId}`);
  }
  if (workflow.context.selectedTimeSlot) {
    parts.push(`Selected time slot: ${workflow.context.selectedTimeSlot}`);
  }

  return `\n\nCurrent booking workflow:\n${parts.join('\n')}`;
}

/**
 * Build location context string for system prompt
 * If location is set, includes it. If not, instructs AI to ask for it.
 */
async function buildLocationContext(userId: string): Promise<string> {
  const location = await getUserLocation(userId);

  if (location) {
    const displayName = PROVIDER_GEO_NAMES[location];
    return `\n\nUser's current location: ${displayName}. When searching for providers, results will automatically show for this location.`;
  }

  const locationList = Object.values(PROVIDER_GEO_NAMES).join(', ');
  return `\n\nIMPORTANT: The user has not set their location yet. Before searching for providers, you must ask them where they are located and use the set_location tool to save it.

Supported locations: ${locationList}.

If they mention a location not on this list, apologize and explain that only these locations are currently supported.`;
}

/**
 * Convert database message history to Claude API message format
 * Handles all content types: text, tool_use, tool_result, and system_notification
 * System notifications are converted to text blocks so Claude can see them
 */
export function buildMessagesArray(history: ChatMessage[]): Anthropic.MessageParam[] {
  return history.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
      .map((block) => {
        if (block.type === 'text') {
          return { type: 'text' as const, text: block.text };
        }
        if (block.type === 'tool_use') {
          return {
            type: 'tool_use' as const,
            id: block.id,
            name: block.name,
            input: block.input,
          };
        }
        if (block.type === 'tool_result') {
          return {
            type: 'tool_result' as const,
            tool_use_id: block.tool_use_id,
            content: block.content,
          };
        }
        if (block.type === 'system_notification') {
          // Convert system notification to text for Claude to see
          return { type: 'text' as const, text: block.text };
        }
        // Unknown type - should not happen
        return null;
      })
      .filter((b): b is NonNullable<typeof b> => {
        // Filter out nulls and empty text blocks
        if (b === null) return false;
        if (b.type === 'text' && !b.text) return false;
        return true;
      }),
  }));
}

/**
 * Callbacks for streaming and tool execution events
 */
export interface StreamCallbacks extends ToolExecutionCallbacks {
  onTextDelta?: (text: string) => void;
}

/**
 * Maximum number of tool execution loop iterations
 * Prevents infinite loops if the AI keeps calling tools
 */
const MAX_TOOL_LOOP_ITERATIONS = 10;

/**
 * Determines if spacing should be added before a new text block.
 *
 * ## Problem This Solves
 * When Claude responds with text, calls a tool, then continues with more text,
 * the Anthropic SDK streams these as separate text blocks. Without intervention,
 * they get concatenated without any spacing:
 *   "Let me search for that.Here are the results."
 *
 * ## When Spacing Is Needed
 * Spacing should be added when:
 * 1. There's already accumulated text (not the first text block)
 * 2. The existing text doesn't already end with a newline
 *
 * ## When This Function Is Called
 * This is called when we receive a `content_block_start` event with type `text`
 * from the Anthropic streaming API. This event fires BEFORE any text deltas
 * for that block, so we can prepend spacing before the new text arrives.
 *
 * @param accumulatedText - The text accumulated so far from previous blocks/iterations
 * @returns true if spacing (\n\n) should be prepended before the next text block
 */
export function shouldAddSpacingBeforeTextBlock(accumulatedText: string): boolean {
  // No spacing needed if this is the first text (nothing accumulated yet)
  if (accumulatedText.length === 0) {
    return false;
  }

  // No spacing needed if the text already ends with a newline
  // (the model may have already added appropriate line breaks)
  if (accumulatedText.endsWith('\n')) {
    return false;
  }

  // Spacing is needed - we have text that doesn't end with whitespace
  return true;
}

/**
 * Send a message with tool support and handle the tool execution loop
 * Continues calling Claude until it returns stop_reason === 'end_turn'
 */
async function sendMessageWithToolLoop(
  sessionId: string,
  messages: Anthropic.MessageParam[],
  callbacks?: StreamCallbacks,
  workflowContext: string = '',
  maxIterations: number = MAX_TOOL_LOOP_ITERATIONS
): Promise<string> {
  const tools = toolRegistry.getToolDefinitions();
  let fullTextResponse = '';
  let iteration = 0;
  let textBlocksInCurrentIteration = 0;

  // Build full system prompt with workflow context
  const systemPrompt = SYSTEM_PROMPT + workflowContext;

  while (iteration < maxIterations) {
    iteration++;
    textBlocksInCurrentIteration = 0;
    logger.debug('Tool loop iteration', { iteration, sessionId, totalTools: tools.length });

    // Call Claude API with streaming and tools
    const stream = getClient().messages.stream({
      model: env.CLAUDE_MODEL,
      max_tokens: env.CLAUDE_MAX_TOKENS,
      system: systemPrompt,
      messages,
      tools: tools.length > 0 ? tools : undefined,
    });

    // Accumulate text during streaming.
    // The 'text' event fires for each chunk of text received from Claude.
    stream.on('text', (text) => {
      fullTextResponse += text;
      callbacks?.onTextDelta?.(text);
    });

    // Handle spacing between text blocks separated by tool calls.
    //
    // The Anthropic API sends responses as a sequence of content blocks:
    //   TextBlock("Let me search") → ToolUseBlock(search) → TextBlock("Here are results")
    //
    // The 'content_block_start' event fires BEFORE any text deltas for each block.
    // We use this to detect when a new text block is starting and prepend spacing
    // if there's already text accumulated (from previous blocks or iterations).
    //
    // This handles two scenarios:
    // 1. Multiple text blocks in ONE response: text → tool_use → text (within same API call)
    // 2. Text across MULTIPLE iterations: iteration 1 text → tool executed → iteration 2 text
    stream.on('streamEvent', (event) => {
      if (event.type === 'content_block_start' && event.content_block.type === 'text') {
        if (shouldAddSpacingBeforeTextBlock(fullTextResponse)) {
          const spacing = '\n\n';
          fullTextResponse += spacing;
          callbacks?.onTextDelta?.(spacing);
        }
        textBlocksInCurrentIteration++;
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

    // Wait for completion with timeout
    const finalMessage = await Promise.race([stream.finalMessage(), timeoutPromise]);

    logger.info('Claude response received', {
      sessionId,
      iteration,
      stopReason: finalMessage.stop_reason,
      contentBlocks: finalMessage.content.length,
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
    });

    // Check stop reason
    if (finalMessage.stop_reason === 'end_turn') {
      logger.debug('Tool loop complete - end_turn', { sessionId, iterations: iteration });
      break;
    }

    if (finalMessage.stop_reason === 'tool_use') {
      // Extract tool_use blocks from the response
      const toolUseBlocks: ToolUseContent[] = finalMessage.content
        .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
        .map((b) => ({
          type: 'tool_use' as const,
          id: b.id,
          name: b.name,
          input: b.input as Record<string, unknown>,
        }));

      logger.debug('Tool use blocks found', {
        sessionId,
        toolCount: toolUseBlocks.length,
        tools: toolUseBlocks.map((t) => t.name),
      });

      // Add assistant message to conversation (with all content blocks)
      // Use specific types (not MessageContent) since Claude API doesn't accept system_notification
      const assistantContent: (TextContent | ToolUseContent)[] = finalMessage.content
        .filter((b): b is Anthropic.TextBlock | Anthropic.ToolUseBlock =>
          b.type === 'text' || b.type === 'tool_use'
        )
        .map((b) => {
          if (b.type === 'text') {
            return { type: 'text' as const, text: b.text };
          }
          return {
            type: 'tool_use' as const,
            id: b.id,
            name: b.name,
            input: b.input as Record<string, unknown>,
          };
        });
      messages.push({ role: 'assistant', content: assistantContent });

      // Execute tools
      const context = { sessionId, userId: 'default_user' };
      const { toolResults } = await executeTools(toolUseBlocks, context, callbacks);

      // Add tool results as user message (this is how Claude expects them)
      messages.push({
        role: 'user',
        content: toolResults.map((r) => ({
          type: 'tool_result' as const,
          tool_use_id: r.tool_use_id,
          content: r.content,
        })),
      });

      // Continue loop to get Claude's response to tool results
      continue;
    }

    // Other stop reasons (max_tokens, etc.) - break loop with warning
    logger.warn('Unexpected stop reason, ending tool loop', {
      sessionId,
      stopReason: finalMessage.stop_reason,
      iteration,
    });
    break;
  }

  if (iteration >= maxIterations) {
    logger.warn('Tool loop reached max iterations', { sessionId, maxIterations });
  }

  return fullTextResponse;
}

/**
 * Send a message to Claude with streaming support, tool execution, timeout protection, and retry logic
 * Calls onTextDelta callback as text arrives, returns full response when complete
 */
export async function sendMessage(
  sessionId: string,
  userMessage: string,
  callbacks?: StreamCallbacks
): Promise<string> {
  logger.info('Sending message to AI', { sessionId, messageLength: userMessage.length });

  // Load session to get userId
  const session = await getSession(sessionId);
  const userId = session?.userId ?? 'default_user';

  // Load conversation history from database
  const history = await getMessageHistory(sessionId);
  logger.debug('Loaded message history', { sessionId, messageCount: history.length });

  // Load current workflow for context
  const workflow = await getCurrentWorkflow(sessionId);
  const workflowContext = await buildWorkflowContext(workflow);
  if (workflow) {
    logger.debug('Workflow context loaded', {
      sessionId,
      workflowId: workflow.id,
      state: workflow.currentState,
    });
  }

  // Load location context for user
  const locationContext = await buildLocationContext(userId);

  // Combine all context for system prompt
  const fullContext = workflowContext + locationContext;

  // Build messages array for Claude API
  const messages = buildMessagesArray(history);

  // Add the new user message (if non-empty)
  // Empty userMessage is used when triggering a response to existing history (e.g., booking notifications)
  if (userMessage) {
    messages.push({ role: 'user', content: userMessage });
  }

  logger.debug('Calling Claude API with tool support', { totalMessages: messages.length });

  // Retry logic with exponential backoff
  const retryDelays = getRetryDelays(env.AI_MAX_RETRIES);
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
    try {
      return await sendMessageWithToolLoop(sessionId, messages, callbacks, fullContext);
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
