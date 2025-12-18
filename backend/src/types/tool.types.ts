/**
 * Tool definition types for Claude SDK integration
 */

import { z } from 'zod';

// Tool definition structure (matches Claude SDK format)
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// Tool handler function type
export type ToolHandler<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  context: ToolExecutionContext
) => Promise<TOutput>;

// Context passed to tool handlers
export interface ToolExecutionContext {
  sessionId: string;
  workflowId?: string;
  userId: string;
  // Callback for emitting display_providers WebSocket event
  emitDisplayProviders?: (providers: DisplayProvider[]) => void;
}

// Tool execution result
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Registered tool with handler
export interface RegisteredTool<TInput = unknown, TOutput = unknown> {
  definition: ToolDefinition;
  handler: ToolHandler<TInput, TOutput>;
  inputSchema: z.ZodSchema<TInput>;
}

// Tool names enum for type safety
export enum ToolName {
  SEARCH_PROVIDERS = 'search_providers',
  DISPLAY_PROVIDER_CARDS = 'display_provider_cards',
  GET_AVAILABLE_SLOTS = 'get_available_slots',
  DISPLAY_TIME_SLOTS = 'display_time_slots',
  CHECK_CALENDAR_CONFLICTS = 'check_calendar_conflicts',
  CONFIRM_BOOKING = 'confirm_booking',
  CREATE_BOOKING = 'create_booking',
  SELECT_PROVIDER = 'select_provider',
}

// Tool input types
export interface SearchProvidersInput {
  category?: string;
  location?: string;
  serviceType?: string;
}

// Provider data for display (returned from backend lookup)
export interface DisplayProvider {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number | null;
  services: string[];
  address: string;
}

// Tool input - only IDs, backend looks up full data
export interface DisplayProviderCardsInput {
  providerIds: string[];
}

export interface GetAvailableSlotsInput {
  providerId: string;
  date: string; // ISO date
  duration?: number;
}

export interface DisplayTimeSlotsInput {
  providerId: string;
  providerName: string;
  slots: Array<{
    start: string;
    end: string;
    available: boolean;
  }>;
  message: string;
}

export interface CheckCalendarConflictsInput {
  startTime: string;
  endTime: string;
}

export interface ConfirmBookingInput {
  providerId: string;
  providerName: string;
  serviceType: string;
  scheduledAt: string;
  duration: number;
}

export interface CreateBookingInput {
  providerId: string;
  serviceType: string;
  scheduledAt: string;
  duration: number;
}

export interface SelectProviderInput {
  providerId: string;
}
