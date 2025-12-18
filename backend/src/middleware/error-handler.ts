import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Custom error class for API errors with status codes
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
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
    super(404, 'NOT_FOUND', message);
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
 * API response format for errors
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
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
  // Log the error
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

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
      },
    };
  }

  res.status(statusCode).json(response);
}
