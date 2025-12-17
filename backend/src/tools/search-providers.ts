/**
 * search_providers tool - searches for local service providers
 */

import { z } from 'zod';
import { RegisteredTool, ToolName, ToolExecutionContext, ToolDefinition } from '../types/tool.types';
import { searchProviders } from '../services/provider-service';
import { logger } from '../utils/logger';

// Input schema (Zod for validation)
export const searchProvidersInputSchema = z.object({
  query: z
    .string()
    .optional()
    .describe('Short search term (1-2 words) for service type or category'),
});

export type SearchProvidersInput = z.infer<typeof searchProvidersInputSchema>;

// Tool definition (Claude SDK format)
export const searchProvidersDefinition: ToolDefinition = {
  name: ToolName.SEARCH_PROVIDERS,
  description:
    'Search for local service providers by category or service type. Uses partial text matching, so short search terms (1-2 words) work best. Examples: "salon", "haircut", "mechanic", "dentist", "oil change". Returns providers sorted by rating.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Short search term (1-2 words). Use service type like "haircut" or category like "salon". Single words work best for matching.',
      },
    },
    required: [],
  },
};

// Output type for the handler
export interface SearchProvidersOutput {
  providers: Array<{
    id: string;
    name: string;
    category: string;
    rating: number;
    reviewCount: number | null;
    services: string[];
    address: string;
  }>;
  count: number;
}

// Handler function
async function handler(
  input: SearchProvidersInput,
  context: ToolExecutionContext
): Promise<SearchProvidersOutput> {
  logger.info('search_providers executing', { input, sessionId: context.sessionId });

  const providers = await searchProviders(input.query);

  logger.info('search_providers found results', { count: providers.length });

  return {
    providers: providers.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      rating: p.rating,
      reviewCount: p.reviewCount,
      services: p.services as string[],
      address: p.address,
    })),
    count: providers.length,
  };
}

// Registered tool (exported for use in tool registry)
export const searchProvidersTool: RegisteredTool<SearchProvidersInput, SearchProvidersOutput> = {
  definition: searchProvidersDefinition,
  handler,
  inputSchema: searchProvidersInputSchema,
};
