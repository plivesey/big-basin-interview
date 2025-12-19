import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, requestContext, RequestContext } from '../../src/utils/logger';

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logger interface', () => {
    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('should have child method', () => {
      expect(typeof logger.child).toBe('function');
    });
  });

  describe('logging without errors', () => {
    it('should not throw when logging debug message', () => {
      expect(() => logger.debug('Test debug message')).not.toThrow();
    });

    it('should not throw when logging info message', () => {
      expect(() => logger.info('Test info message')).not.toThrow();
    });

    it('should not throw when logging warn message', () => {
      expect(() => logger.warn('Test warn message')).not.toThrow();
    });

    it('should not throw when logging error message', () => {
      expect(() => logger.error('Test error message')).not.toThrow();
    });

    it('should not throw when logging with meta object', () => {
      expect(() => logger.info('Test message', { key: 'value' })).not.toThrow();
    });

    it('should not throw when logging with complex meta', () => {
      const meta = {
        userId: '123',
        action: 'login',
        details: { nested: true },
      };
      expect(() => logger.info('User action', meta)).not.toThrow();
    });
  });

  describe('child logger', () => {
    it('should create child logger', () => {
      const childLogger = logger.child({ service: 'test-service' });
      expect(childLogger).toBeDefined();
    });

    it('should return a pino logger instance', () => {
      const childLogger = logger.child({ service: 'test-service' });
      expect(typeof childLogger.info).toBe('function');
      expect(typeof childLogger.error).toBe('function');
    });
  });
});

describe('requestContext', () => {
  it('should store and retrieve request ID', () => {
    let capturedId: string | undefined;

    requestContext.run({ requestId: 'test-123' }, () => {
      const store = requestContext.getStore();
      capturedId = store?.requestId;
    });

    expect(capturedId).toBe('test-123');
  });

  it('should isolate context between runs', () => {
    const results: (string | undefined)[] = [];

    requestContext.run({ requestId: 'first' }, () => {
      results.push(requestContext.getStore()?.requestId);
    });

    requestContext.run({ requestId: 'second' }, () => {
      results.push(requestContext.getStore()?.requestId);
    });

    expect(results).toEqual(['first', 'second']);
  });

  it('should return undefined outside of run context', () => {
    const store = requestContext.getStore();
    expect(store).toBeUndefined();
  });

  it('should support nested contexts', () => {
    const results: (string | undefined)[] = [];

    requestContext.run({ requestId: 'outer' }, () => {
      results.push(requestContext.getStore()?.requestId);

      requestContext.run({ requestId: 'inner' }, () => {
        results.push(requestContext.getStore()?.requestId);
      });

      results.push(requestContext.getStore()?.requestId);
    });

    expect(results).toEqual(['outer', 'inner', 'outer']);
  });

  it('should work with async operations', async () => {
    let capturedId: string | undefined;

    await new Promise<void>((resolve) => {
      requestContext.run({ requestId: 'async-123' }, async () => {
        await Promise.resolve();
        capturedId = requestContext.getStore()?.requestId;
        resolve();
      });
    });

    expect(capturedId).toBe('async-123');
  });
});

describe('logger with requestContext', () => {
  it('should not throw when logging within request context', () => {
    expect(() => {
      requestContext.run({ requestId: 'ctx-123' }, () => {
        logger.info('Message with context');
      });
    }).not.toThrow();
  });

  it('should not throw when logging with meta within context', () => {
    expect(() => {
      requestContext.run({ requestId: 'ctx-456' }, () => {
        logger.info('Message with meta', { action: 'test' });
      });
    }).not.toThrow();
  });

  it('should work correctly outside of context', () => {
    expect(() => {
      logger.info('No context message');
    }).not.toThrow();
  });
});
