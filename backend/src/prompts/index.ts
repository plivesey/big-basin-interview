/**
 * Prompts Module
 *
 * Centralized AI-facing text including system prompts and tool error messages.
 * All text in this module is sent to the AI, not directly to users.
 *
 * @example
 * ```typescript
 * import { BASE_SYSTEM_PROMPT, TOOL_ERRORS } from '../prompts';
 * ```
 */

export {
  // System prompt sections
  SCOUT_PERSONALITY,
  COMMUNICATION_GUIDELINES,
  TOOL_USAGE_GUIDELINES,
  // Location context templates
  LOCATION_CONTEXT_SET,
  LOCATION_CONTEXT_NOT_SET,
  // Workflow context
  WORKFLOW_PROVIDER_IDS_HEADER,
  // Composed prompt
  BASE_SYSTEM_PROMPT,
} from './system-prompt';

export {
  // Individual error messages
  locationNotSupported,
  LOCATION_NOT_SET,
  NO_ACTIVE_WORKFLOW,
  providerNotFound,
  WORKFLOW_TRANSITION_FAILED,
  providerNotFoundForAvailability,
  AVAILABILITY_FETCH_FAILED,
  // Grouped export
  TOOL_ERRORS,
} from './tool-errors';
