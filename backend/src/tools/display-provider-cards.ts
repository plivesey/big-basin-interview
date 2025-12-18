/**
 * display_provider_cards tool - displays provider cards in the UI side panel
 *
 * Takes provider IDs as input, looks up full provider data from database,
 * and emits a WebSocket event to display the cards. This prevents AI hallucination
 * of provider details.
 */

import { z } from 'zod';
import {
  RegisteredTool,
  ToolName,
  ToolExecutionContext,
  ToolDefinition,
  DisplayProvider,
} from '../types/tool.types';
import { getProviderById } from '../services/provider-service';
import { logger } from '../utils/logger';

// Input schema (Zod for validation) - IDs only
export const displayProviderCardsInputSchema = z.object({
  providerIds: z
    .array(z.string())
    .min(1)
    .describe('Array of provider IDs from search_providers results'),
});

export type DisplayProviderCardsInput = z.infer<typeof displayProviderCardsInputSchema>;

// Tool definition (Claude SDK format)
export const displayProviderCardsDefinition: ToolDefinition = {
  name: ToolName.DISPLAY_PROVIDER_CARDS,
  description:
    'Display provider cards in the side panel. Call this with provider IDs from search_providers results. The backend will fetch the current provider data - do NOT include provider details, only IDs.',
  input_schema: {
    type: 'object',
    properties: {
      providerIds: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Array of provider IDs to display. Use the IDs from search_providers results.',
      },
    },
    required: ['providerIds'],
  },
};

// Output type for the handler
export interface DisplayProviderCardsOutput {
  success: boolean;
  displayed: number;
  notFound: string[];
}

// Handler function
async function handler(
  input: DisplayProviderCardsInput,
  context: ToolExecutionContext
): Promise<DisplayProviderCardsOutput> {
  logger.info('display_provider_cards executing', {
    providerIds: input.providerIds,
    sessionId: context.sessionId,
  });

  // Look up each provider from database
  const providers: DisplayProvider[] = [];
  const notFound: string[] = [];

  for (const id of input.providerIds) {
    const provider = await getProviderById(id);
    if (provider) {
      providers.push({
        id: provider.id,
        name: provider.name,
        category: provider.category,
        rating: provider.rating,
        reviewCount: provider.reviewCount,
        services: provider.services as string[],
        address: provider.address,
      });
    } else {
      notFound.push(id);
      logger.warn('Provider not found for display', { providerId: id });
    }
  }

  // Emit to frontend via context callback
  if (providers.length > 0 && context.emitDisplayProviders) {
    context.emitDisplayProviders(providers);
    logger.info('display_provider_cards emitted to frontend', {
      count: providers.length,
    });
  }

  return {
    success: true,
    displayed: providers.length,
    notFound,
  };
}

// Registered tool (exported for use in tool registry)
export const displayProviderCardsTool: RegisteredTool<
  DisplayProviderCardsInput,
  DisplayProviderCardsOutput
> = {
  definition: displayProviderCardsDefinition,
  handler,
  inputSchema: displayProviderCardsInputSchema,
};
