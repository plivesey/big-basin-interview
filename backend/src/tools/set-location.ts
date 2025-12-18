/**
 * set_location tool - saves the user's location for provider search filtering
 */

import { z } from 'zod';
import { RegisteredTool, ToolName, ToolExecutionContext, ToolDefinition } from '../types/tool.types';
import { setLocationMemory } from '../services/memory-service';
import { matchProviderGeo, PROVIDER_GEO_NAMES, ProviderGeo } from '../constants/supported-locations';
import { logger } from '../utils/logger';

// Input schema (Zod for validation)
export const setLocationInputSchema = z.object({
  location: z
    .string()
    .describe('The user\'s location (city or region name)'),
});

export type SetLocationInput = z.infer<typeof setLocationInputSchema>;

// Tool definition (Claude SDK format)
export const setLocationDefinition: ToolDefinition = {
  name: ToolName.SET_LOCATION,
  description:
    'Save the user\'s location for filtering service provider searches. Use this after asking the user where they are located.',
  input_schema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description:
          'The user\'s location. Accepts city names like "Seattle", "San Francisco", "New York", or region names like "South Bay".',
      },
    },
    required: ['location'],
  },
};

// Output type for the handler
export interface SetLocationOutput {
  success: boolean;
  location?: string;
  locationDisplay?: string;
  error?: string;
  supportedLocations?: string[];
}

// Handler function
async function handler(
  input: SetLocationInput,
  context: ToolExecutionContext
): Promise<SetLocationOutput> {
  logger.info('set_location executing', { input, userId: context.userId });

  // Try to match the input to a supported location
  const matchedGeo = matchProviderGeo(input.location);

  if (!matchedGeo) {
    // Location not supported
    const supportedList = Object.values(PROVIDER_GEO_NAMES);
    logger.info('set_location failed - unsupported location', {
      input: input.location,
      userId: context.userId,
    });

    return {
      success: false,
      error: `"${input.location}" is not a supported location.`,
      supportedLocations: supportedList,
    };
  }

  // Save the location
  await setLocationMemory(context.userId, matchedGeo);

  const displayName = PROVIDER_GEO_NAMES[matchedGeo];
  logger.info('set_location succeeded', {
    location: matchedGeo,
    displayName,
    userId: context.userId,
  });

  return {
    success: true,
    location: matchedGeo,
    locationDisplay: displayName,
  };
}

// Registered tool (exported for use in tool registry)
export const setLocationTool: RegisteredTool<SetLocationInput, SetLocationOutput> = {
  definition: setLocationDefinition,
  handler,
  inputSchema: setLocationInputSchema,
};
