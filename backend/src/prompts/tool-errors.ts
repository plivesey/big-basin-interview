/**
 * Tool Error Messages
 *
 * Error messages returned by tools when operations fail.
 * These are sent back to the AI as tool results, helping it understand
 * what went wrong and how to guide the user.
 *
 * All text in this file is sent to the AI (not directly to users).
 */

// =============================================================================
// set_location Tool Errors
// =============================================================================

/**
 * Error when user provides an unsupported location
 */
export const locationNotSupported = (
  location: string,
  supportedLocations: string[]
): string =>
  `"${location}" is not a supported location. Supported locations: ${supportedLocations.join(', ')}.`;

// =============================================================================
// search_providers Tool Errors
// =============================================================================

/**
 * Error when user tries to search without setting location first
 */
export const LOCATION_NOT_SET =
  'Location not set. Please ask the user for their location and use the set_location tool first.';

// =============================================================================
// select_provider Tool Errors
// =============================================================================

/**
 * Error when no workflow exists (user hasn't searched yet)
 */
export const NO_ACTIVE_WORKFLOW =
  'No active booking workflow. Please search for providers first.';

/**
 * Error when provider ID doesn't exist
 * @param providerId - The invalid provider ID that was provided
 * @param validProvidersList - Optional formatted list of valid provider IDs
 */
export const providerNotFound = (
  providerId: string,
  validProvidersList?: string
): string =>
  `Provider ID '${providerId}' does not exist.${validProvidersList ?? ''}\nUse one of these exact IDs with select_provider.`;

/**
 * Error when workflow state transition fails
 */
export const WORKFLOW_TRANSITION_FAILED = 'Failed to update booking workflow.';

// =============================================================================
// get_availability Tool Errors
// =============================================================================

/**
 * Error when provider ID doesn't exist (availability check)
 */
export const providerNotFoundForAvailability = (providerId: string): string =>
  `Provider ID '${providerId}' does not exist. Use the search_providers tool first to find valid provider IDs, then use one of those IDs with this tool.`;

/**
 * Generic error when availability fetch fails
 */
export const AVAILABILITY_FETCH_FAILED = 'Failed to retrieve availability.';

// =============================================================================
// Grouped Export (for convenience)
// =============================================================================

export const TOOL_ERRORS = {
  // set_location
  locationNotSupported,

  // search_providers
  LOCATION_NOT_SET,

  // select_provider
  NO_ACTIVE_WORKFLOW,
  providerNotFound,
  WORKFLOW_TRANSITION_FAILED,

  // get_availability
  providerNotFoundForAvailability,
  AVAILABILITY_FETCH_FAILED,
} as const;
