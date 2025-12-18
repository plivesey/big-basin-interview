/**
 * Error categories for classification and monitoring.
 * Used for log aggregation, alerting, and debugging.
 */
export enum ErrorCategory {
  /** AI/LLM API failures (timeouts, rate limits, API errors) */
  LLM_FAILURE = 'llm_failure',

  /** Database errors (connection, query, constraint violations) */
  DB_ERROR = 'db_error',

  /** Google Calendar API errors (auth, quota, API errors) */
  CALENDAR_ERROR = 'calendar_error',

  /** Request validation errors (invalid input, schema violations) */
  VALIDATION_ERROR = 'validation_error',

  /** Network errors (connection refused, timeout, DNS) */
  NETWORK_ERROR = 'network_error',

  /** Resource not found errors (404s) */
  NOT_FOUND = 'not_found',

  /** Unclassified internal errors */
  INTERNAL_ERROR = 'internal_error',
}

/**
 * Extended error context for logging and debugging.
 */
export interface ErrorContext {
  /** Error category for classification */
  category: ErrorCategory;

  /** Request ID for tracing */
  requestId?: string;

  /** Stack trace */
  stack?: string;

  /** Additional context (request payload, etc.) */
  payload?: unknown;

  /** Original error message if wrapping another error */
  originalError?: string;
}
