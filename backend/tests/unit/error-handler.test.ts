import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import {
  ApiError,
  NotFoundError,
  ProviderNotFoundError,
  DatabaseError,
  LLMError,
  CalendarError,
  ValidationError,
  errorHandler,
} from '../../src/middleware/error-handler';
import { ErrorCategory } from '../../src/types/error.types';

// Mock logger to avoid console output during tests
vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Error Classes', () => {
  describe('ApiError', () => {
    it('should create error with status code and code', () => {
      const error = new ApiError(400, 'BAD_REQUEST', 'Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ApiError');
    });

    it('should extend Error', () => {
      const error = new ApiError(500, 'TEST', 'Test error');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    it('should extend ApiError', () => {
      const error = new NotFoundError('Resource', '123');
      expect(error instanceof ApiError).toBe(true);
    });

    it('should have 404 status code', () => {
      const error = new NotFoundError('Resource', '123');
      expect(error.statusCode).toBe(404);
    });

    it('should have NOT_FOUND code', () => {
      const error = new NotFoundError('Resource', '123');
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should format message with resource and ID', () => {
      const error = new NotFoundError('Provider', 'abc-123');
      expect(error.message).toBe("Provider with ID 'abc-123' not found");
    });

    it('should format message without ID when not provided', () => {
      const error = new NotFoundError('Session');
      expect(error.message).toBe('Session not found');
    });
  });

  describe('ProviderNotFoundError', () => {
    it('should extend NotFoundError', () => {
      const error = new ProviderNotFoundError('provider-123');
      expect(error instanceof NotFoundError).toBe(true);
    });

    it('should store providerId property', () => {
      const error = new ProviderNotFoundError('my-provider-id');
      expect(error.providerId).toBe('my-provider-id');
    });

    it('should have 404 status code', () => {
      const error = new ProviderNotFoundError('provider-123');
      expect(error.statusCode).toBe(404);
    });

    it('should have correct error message format', () => {
      const error = new ProviderNotFoundError('test-provider');
      expect(error.message).toBe("Provider with ID 'test-provider' not found");
    });

    it('should have ProviderNotFoundError as name', () => {
      const error = new ProviderNotFoundError('provider-123');
      expect(error.name).toBe('ProviderNotFoundError');
    });

    it('should be identifiable via instanceof check', () => {
      const error = new ProviderNotFoundError('provider-123');

      expect(error instanceof ProviderNotFoundError).toBe(true);
      expect(error instanceof NotFoundError).toBe(true);
      expect(error instanceof ApiError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('DatabaseError', () => {
    it('should have 500 status code', () => {
      const error = new DatabaseError('Connection failed');
      expect(error.statusCode).toBe(500);
    });

    it('should have DB_ERROR code', () => {
      const error = new DatabaseError('Query failed');
      expect(error.code).toBe('DB_ERROR');
    });

    it('should have DB_ERROR category', () => {
      const error = new DatabaseError('Connection failed');
      expect(error.category).toBe(ErrorCategory.DB_ERROR);
    });

    it('should extend ApiError', () => {
      const error = new DatabaseError('Test error');
      expect(error instanceof ApiError).toBe(true);
    });

    it('should accept optional context', () => {
      const error = new DatabaseError('Query failed', {
        requestId: 'req-123',
        payload: { table: 'users' },
      });
      expect(error.context?.requestId).toBe('req-123');
      expect(error.context?.payload).toEqual({ table: 'users' });
    });
  });

  describe('LLMError', () => {
    it('should have 502 status code', () => {
      const error = new LLMError('Claude API timeout');
      expect(error.statusCode).toBe(502);
    });

    it('should have LLM_ERROR code', () => {
      const error = new LLMError('Rate limited');
      expect(error.code).toBe('LLM_ERROR');
    });

    it('should have LLM_FAILURE category', () => {
      const error = new LLMError('API failure');
      expect(error.category).toBe(ErrorCategory.LLM_FAILURE);
    });

    it('should extend ApiError', () => {
      const error = new LLMError('Test error');
      expect(error instanceof ApiError).toBe(true);
    });
  });

  describe('CalendarError', () => {
    it('should have 502 status code', () => {
      const error = new CalendarError('Google API error');
      expect(error.statusCode).toBe(502);
    });

    it('should have CALENDAR_ERROR code', () => {
      const error = new CalendarError('Event creation failed');
      expect(error.code).toBe('CALENDAR_ERROR');
    });

    it('should have CALENDAR_ERROR category', () => {
      const error = new CalendarError('Calendar sync failed');
      expect(error.category).toBe(ErrorCategory.CALENDAR_ERROR);
    });

    it('should extend ApiError', () => {
      const error = new CalendarError('Test error');
      expect(error instanceof ApiError).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should have 400 status code', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
    });

    it('should have VALIDATION_ERROR code', () => {
      const error = new ValidationError('Missing required field');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should have VALIDATION_ERROR category', () => {
      const error = new ValidationError('Invalid date format');
      expect(error.category).toBe(ErrorCategory.VALIDATION_ERROR);
    });

    it('should extend ApiError', () => {
      const error = new ValidationError('Test error');
      expect(error instanceof ApiError).toBe(true);
    });
  });
});

describe('errorHandler middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let statusSpy: ReturnType<typeof vi.fn>;
  let jsonSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      path: '/test',
      method: 'GET',
      requestId: 'test-request-123',
    };

    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });

    mockRes = {
      status: statusSpy,
      json: jsonSpy,
    };

    mockNext = vi.fn();
  });

  it('should handle ZodError with 400 status', () => {
    const schema = z.object({ name: z.string() });
    let zodError: ZodError;
    try {
      schema.parse({});
    } catch (e) {
      zodError = e as ZodError;
    }

    errorHandler(zodError!, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      })
    );
  });

  it('should handle ApiError with custom status code', () => {
    const error = new ApiError(403, 'FORBIDDEN', 'Access denied');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(403);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
        requestId: 'test-request-123',
      },
    });
  });

  it('should handle NotFoundError with 404 status', () => {
    const error = new NotFoundError('User', '123');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(404);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: "User with ID '123' not found",
        requestId: 'test-request-123',
      },
    });
  });

  it('should handle ProviderNotFoundError with 404 status', () => {
    const error = new ProviderNotFoundError('provider-abc');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(404);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: "Provider with ID 'provider-abc' not found",
        requestId: 'test-request-123',
      },
    });
  });

  it('should handle DatabaseError with 500 status', () => {
    const error = new DatabaseError('Connection failed');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'DB_ERROR',
        message: 'Connection failed',
        requestId: 'test-request-123',
      },
    });
  });

  it('should handle LLMError with 502 status', () => {
    const error = new LLMError('Claude API timeout');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(502);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'LLM_ERROR',
        message: 'Claude API timeout',
        requestId: 'test-request-123',
      },
    });
  });

  it('should handle CalendarError with 502 status', () => {
    const error = new CalendarError('Event creation failed');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(502);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'CALENDAR_ERROR',
        message: 'Event creation failed',
        requestId: 'test-request-123',
      },
    });
  });

  it('should handle unknown errors with 500 status', () => {
    const error = new Error('Something went wrong');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId: 'test-request-123',
      },
    });
  });
});
