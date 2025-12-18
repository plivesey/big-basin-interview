/**
 * get_availability tool - queries available time slots for a provider
 *
 * This is a read-only tool for conversational queries like "What times are
 * available at Luxe tomorrow?". It returns availability data for the AI
 * to describe in chat but does NOT open the booking modal.
 *
 * Can be used without an active workflow (pure informational query).
 */

import { z } from 'zod';
import {
  RegisteredTool,
  ToolName,
  ToolExecutionContext,
  ToolDefinition,
} from '../types/tool.types';
import { getAvailableSlots, TimeSlot } from '../services/availability-service';
import { getLocalDateString } from '../utils/date-utils';
import { ProviderNotFoundError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

// Input schema (Zod for validation)
export const getAvailabilityInputSchema = z.object({
  providerId: z.string().describe('The ID of the provider to check availability for'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .describe('Date to check availability (YYYY-MM-DD format, defaults to today)'),
  duration: z
    .number()
    .min(15)
    .max(480)
    .optional()
    .describe('Appointment duration in minutes (defaults to 30)'),
});

export type GetAvailabilityInput = z.infer<typeof getAvailabilityInputSchema>;

// Tool definition (Claude SDK format)
export const getAvailabilityDefinition: ToolDefinition = {
  name: ToolName.GET_AVAILABLE_SLOTS,
  description:
    'Check available time slots for a provider on a specific date. Use this when the user asks about availability without intending to book immediately (e.g., "What times are available at Luxe tomorrow?"). Returns availability data to describe conversationally. Does NOT open the booking modal.',
  input_schema: {
    type: 'object',
    properties: {
      providerId: {
        type: 'string',
        description: 'The ID of the provider to check availability for.',
      },
      date: {
        type: 'string',
        description:
          'Date to check availability in YYYY-MM-DD format. Defaults to today if not specified.',
      },
      duration: {
        type: 'number',
        description: 'Appointment duration in minutes. Defaults to 30.',
      },
    },
    required: ['providerId'],
  },
};

// Output type for the handler
export interface GetAvailabilityOutput {
  success: boolean;
  providerId: string;
  providerName: string;
  date: string;
  availableSlots: TimeSlot[];
  totalSlots: number;
  error?: string;
}

// Handler function
async function handler(
  input: GetAvailabilityInput,
  context: ToolExecutionContext
): Promise<GetAvailabilityOutput> {
  logger.info('get_availability executing', {
    providerId: input.providerId,
    date: input.date,
    duration: input.duration,
    sessionId: context.sessionId,
  });

  try {
    // Default to today's date if not provided
    const date = input.date || getLocalDateString();
    const duration = input.duration || 30;

    // Get availability from service
    const result = await getAvailableSlots(
      input.providerId,
      date,
      duration
    );

    // Filter to only available slots for the response
    const availableSlots = result.slots.filter((slot) => slot.available);

    logger.info('get_availability completed', {
      providerId: input.providerId,
      date: result.date,
      totalSlots: result.slots.length,
      availableSlots: availableSlots.length,
    });

    return {
      success: true,
      providerId: result.providerId,
      providerName: result.providerName,
      date: result.date,
      availableSlots,
      totalSlots: result.slots.length,
    };
  } catch (error) {
    logger.error('get_availability failed', {
      providerId: input.providerId,
      error: String(error),
    });

    const defaultDate = input.date || getLocalDateString();

    // Handle provider not found
    if (error instanceof ProviderNotFoundError) {
      return {
        success: false,
        providerId: input.providerId,
        providerName: '',
        date: defaultDate,
        availableSlots: [],
        totalSlots: 0,
        error: `Provider ID '${input.providerId}' does not exist. Use the search_providers tool first to find valid provider IDs, then use one of those IDs with this tool.`,
      };
    }

    return {
      success: false,
      providerId: input.providerId,
      providerName: '',
      date: defaultDate,
      availableSlots: [],
      totalSlots: 0,
      error: 'Failed to retrieve availability.',
    };
  }
}

// Registered tool (exported for use in tool registry)
export const getAvailabilityTool: RegisteredTool<
  GetAvailabilityInput,
  GetAvailabilityOutput
> = {
  definition: getAvailabilityDefinition,
  handler,
  inputSchema: getAvailabilityInputSchema,
};
