import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requestIdMiddleware } from '../../src/middleware/request-id';
import { requestContext } from '../../src/utils/logger';

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-123'),
}));

describe('requestIdMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let setHeaderSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      headers: {},
    };

    setHeaderSpy = vi.fn();
    mockRes = {
      setHeader: setHeaderSpy,
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate a UUID when no X-Request-ID header is present', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.requestId).toBe('mock-uuid-123');
    expect(setHeaderSpy).toHaveBeenCalledWith('X-Request-ID', 'mock-uuid-123');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use existing X-Request-ID header when present', () => {
    mockReq.headers = { 'x-request-id': 'existing-request-id' };

    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.requestId).toBe('existing-request-id');
    expect(setHeaderSpy).toHaveBeenCalledWith('X-Request-ID', 'existing-request-id');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should set the request ID on the request object', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.requestId).toBeDefined();
    expect(typeof mockReq.requestId).toBe('string');
  });

  it('should set X-Request-ID response header', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(setHeaderSpy).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
  });

  it('should call next() to continue middleware chain', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should wrap handler in AsyncLocalStorage context', () => {
    let capturedContext: { requestId: string } | undefined;

    // Override mockNext to capture context
    mockNext = vi.fn(() => {
      capturedContext = requestContext.getStore();
    });

    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(capturedContext).toBeDefined();
    expect(capturedContext?.requestId).toBe('mock-uuid-123');
  });

  it('should propagate request ID through AsyncLocalStorage', () => {
    let innerContext: { requestId: string } | undefined;

    mockNext = vi.fn(() => {
      // Simulate nested async operation
      const store = requestContext.getStore();
      innerContext = store;
    });

    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(innerContext?.requestId).toBe('mock-uuid-123');
  });
});
