import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { ErrorCategory, ErrorContext } from '../types/error.types';

/**
 * Custom error class for API errors with status codes and categories.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public category: ErrorCategory = ErrorCategory.INTERNAL_ERROR,
    public context?: Partial<ErrorContext>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Not found error helper
 */
export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    super(404, 'NOT_FOUND', message, ErrorCategory.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

/**
 * Provider not found error - thrown when a provider ID doesn't exist
 */
export class ProviderNotFoundError extends NotFoundError {
  public providerId: string;

  constructor(providerId: string) {
    super('Provider', providerId);
    this.name = 'ProviderNotFoundError';
    this.providerId = providerId;
  }
}

/**
 * Database error - thrown for database operation failures
 */
export class DatabaseError extends ApiError {
  constructor(message: string, context?: Partial<ErrorContext>) {
    super(500, 'DB_ERROR', message, ErrorCategory.DB_ERROR, context);
    this.name = 'DatabaseError';
  }
}

/**
 * LLM error - thrown for AI/Claude API failures
 */
export class LLMError extends ApiError {
  constructor(message: string, context?: Partial<ErrorContext>) {
    super(502, 'LLM_ERROR', message, ErrorCategory.LLM_FAILURE, context);
    this.name = 'LLMError';
  }
}

/**
 * Calendar error - thrown for Google Calendar API failures
 */
export class CalendarError extends ApiError {
  constructor(message: string, context?: Partial<ErrorContext>) {
    super(502, 'CALENDAR_ERROR', message, ErrorCategory.CALENDAR_ERROR, context);
    this.name = 'CalendarError';
  }
}

/**
 * Validation error - thrown for request validation failures
 */
export class ValidationError extends ApiError {
  constructor(message: string, context?: Partial<ErrorContext>) {
    super(400, 'VALIDATION_ERROR', message, ErrorCategory.VALIDATION_ERROR, context);
    this.name = 'ValidationError';
  }
}

/**
 * API response format for errors
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/**
 * Format Zod validation errors into a readable format
 */
function formatZodErrors(error: ZodError<unknown>): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join(', ');
}

/**
 * Global error handler middleware
 * Must be registered after all routes
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Build error context for logging
  const errorContext: Record<string, unknown> = {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
  };

  // Add category and additional context for ApiError instances
  if (err instanceof ApiError) {
    errorContext.category = err.category;
    errorContext.code = err.code;
    if (err.context) {
      errorContext.context = err.context;
    }
  } else if (err instanceof ZodError) {
    errorContext.category = ErrorCategory.VALIDATION_ERROR;
    errorContext.details = err.issues;
  } else {
    errorContext.category = ErrorCategory.INTERNAL_ERROR;
  }

  // Log with category
  logger.error('Request error', errorContext);

  let response: ErrorResponse;
  let statusCode: number;

  if (err instanceof ZodError) {
    // Validation error - 400 Bad Request
    statusCode = 400;
    response = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: formatZodErrors(err),
        details: err.issues,
        requestId: req.requestId,
      },
    };
  } else if (err instanceof ApiError) {
    // Known API error (NotFoundError, etc.)
    statusCode = err.statusCode;
    response = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        requestId: req.requestId,
      },
    };
  } else {
    // Unknown error - 500 Internal Server Error
    statusCode = 500;
    response = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId: req.requestId,
      },
    };
  }

  res.status(statusCode).json(response);
}
