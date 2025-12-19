/**
 * search_providers tool - searches for local service providers
 *
 * Creates a new workflow when searching, replacing any existing active workflow.
 */

import { z } from 'zod';
import { RegisteredTool, ToolName, ToolExecutionContext, ToolDefinition } from '../types/tool.types';
import { searchProviders } from '../services/provider-service';
import { createWorkflow } from '../services/workflow-service';
import { getUserLocation } from '../services/memory-service';
import { PROVIDER_GEO_NAMES } from '../constants/supported-locations';
import { logger } from '../utils/logger';
import { LOCATION_NOT_SET } from '../prompts';

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

// Provider data returned in search results
export interface ProviderResult {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number | null;
  services: string[];
  address: string;
}

// Success output type
export interface SearchProvidersSuccess {
  providers: ProviderResult[];
  count: number;
  workflowId: string;
}

// Error output type (location not set)
export interface SearchProvidersError {
  error: string;
  providers: [];
  count: 0;
  supportedLocations: string[];
}

// Combined output type
export type SearchProvidersOutput = SearchProvidersSuccess | SearchProvidersError;

// Handler function
async function handler(
  input: SearchProvidersInput,
  context: ToolExecutionContext
): Promise<SearchProvidersOutput> {
  logger.info('search_providers executing', { input, sessionId: context.sessionId });

  // Check if user has set their location
  const userLocation = await getUserLocation(context.userId);
  if (!userLocation) {
    const supportedList = Object.values(PROVIDER_GEO_NAMES);
    logger.info('search_providers blocked - location not set', {
      userId: context.userId,
      sessionId: context.sessionId,
    });

    return {
      error: LOCATION_NOT_SET,
      providers: [],
      count: 0,
      supportedLocations: supportedList,
    };
  }

  // Create a new workflow for this search (abandons any existing workflow)
  const workflow = await createWorkflow(context.sessionId, {
    serviceType: input.query,
    location: userLocation,
  });

  logger.info('Created workflow for search', {
    workflowId: workflow.id,
    sessionId: context.sessionId,
    serviceType: input.query,
    location: userLocation,
  });

  const providers = await searchProviders(input.query, userLocation);

  logger.info('search_providers found results', {
    count: providers.length,
    workflowId: workflow.id,
  });

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
    workflowId: workflow.id,
  };
}

// Registered tool (exported for use in tool registry)
export const searchProvidersTool: RegisteredTool<SearchProvidersInput, SearchProvidersOutput> = {
  definition: searchProvidersDefinition,
  handler,
  inputSchema: searchProvidersInputSchema,
};
