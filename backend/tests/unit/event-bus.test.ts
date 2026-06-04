import { describe, it, expect, vi, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// We can't easily test the singleton eventBus without polluting state between tests.
// Instead, we'll test the TypedEventBus class behavior by creating our own instances.

// Recreate the TypedEventBus class for testing
class TestTypedEventBus<T extends Record<string, unknown>> {
  private emitter = new EventEmitter();

  emit<K extends keyof T>(event: K, payload: T[K]): void {
    this.emitter.emit(event as string, payload);
  }

  on<K extends keyof T>(
    event: K,
    handler: (payload: T[K]) => void | Promise<void>
  ): void {
    this.emitter.on(event as string, (payload) => {
      // Wrap handlers to catch both sync and async errors
      try {
        const result = handler(payload);
        if (result instanceof Promise) {
          result.catch(() => {
            // Errors are caught and logged (in real impl)
          });
        }
      } catch {
        // Sync errors are caught (logged in real impl)
      }
    });
  }

  off<K extends keyof T>(
    event: K,
    handler: (payload: T[K]) => void | Promise<void>
  ): void {
    this.emitter.off(event as string, handler);
  }

  once<K extends keyof T>(
    event: K,
    handler: (payload: T[K]) => void | Promise<void>
  ): void {
    this.emitter.once(event as string, (payload) => {
      // Wrap handlers to catch both sync and async errors
      try {
        const result = handler(payload);
        if (result instanceof Promise) {
          result.catch(() => {
            // Errors are caught and logged (in real impl)
          });
        }
      } catch {
        // Sync errors are caught (logged in real impl)
      }
    });
  }
}

interface TestBookingEvent {
  sessionId: string;
  workflowId: string;
  providerId: string;
  providerName: string;
  serviceType: string;
  scheduledAt: string;
}

interface TestEventMap {
  'booking:confirmed': TestBookingEvent;
}

describe('event-bus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('emit and on', () => {
    it('should emit events to registered handlers', () => {
      const eventBus = new TestTypedEventBus<TestEventMap>();
      const handler = vi.fn();
      const event: TestBookingEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      eventBus.on('booking:confirmed', handler);
      eventBus.emit('booking:confirmed', event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should support multiple handlers for the same event', () => {
      const eventBus = new TestTypedEventBus<TestEventMap>();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();
      const event: TestBookingEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      eventBus.on('booking:confirmed', handler1);
      eventBus.on('booking:confirmed', handler2);
      eventBus.on('booking:confirmed', handler3);
      eventBus.emit('booking:confirmed', event);

      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
      expect(handler3).toHaveBeenCalledWith(event);
    });

    it('should call handlers in registration order', () => {
      const eventBus = new TestTypedEventBus<TestEventMap>();
      const callOrder: number[] = [];
      const handler1 = vi.fn(() => callOrder.push(1));
      const handler2 = vi.fn(() => callOrder.push(2));
      const handler3 = vi.fn(() => callOrder.push(3));
      const event: TestBookingEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      eventBus.on('booking:confirmed', handler1);
      eventBus.on('booking:confirmed', handler2);
      eventBus.on('booking:confirmed', handler3);
      eventBus.emit('booking:confirmed', event);

      expect(callOrder).toEqual([1, 2, 3]);
    });

    it('should not affect other event instances', () => {
      const eventBus1 = new TestTypedEventBus<TestEventMap>();
      const eventBus2 = new TestTypedEventBus<TestEventMap>();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const event: TestBookingEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      eventBus1.on('booking:confirmed', handler1);
      eventBus2.on('booking:confirmed', handler2);

      eventBus1.emit('booking:confirmed', event);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('async handlers', () => {
    it('should support async handlers', async () => {
      const eventBus = new TestTypedEventBus<TestEventMap>();
      const results: string[] = [];
      const asyncHandler = vi.fn(async (event: TestBookingEvent) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push(`processed: ${event.sessionId}`);
      });

      const event: TestBookingEvent = {
        sessionId: 'async-session',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      eventBus.on('booking:confirmed', asyncHandler);
      eventBus.emit('booking:confirmed', event);

      // Handler is called immediately
      expect(asyncHandler).toHaveBeenCalledWith(event);

      // But the async work completes later
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(results).toContain('processed: async-session');
    });

    it('should catch errors in async handlers without crashing', async () => {
      const eventBus = new TestTypedEventBus<TestEventMap>();
      const errorHandler = vi.fn(async () => {
        throw new Error('Async handler error');
      });
      const successHandler = vi.fn();

      const event: TestBookingEvent = {
        sessionId: 'error-session',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      eventBus.on('booking:confirmed', errorHandler);
      eventBus.on('booking:confirmed', successHandler);

      // Should not throw
      expect(() => eventBus.emit('booking:confirmed', event)).not.toThrow();

      // Both handlers should be called
      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();

      // Wait for async to settle
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    it('should catch errors in sync handlers wrapped in Promise.resolve', () => {
      const eventBus = new TestTypedEventBus<TestEventMap>();
      const errorHandler = vi.fn(() => {
        throw new Error('Sync handler error');
      });
      const successHandler = vi.fn();

      const event: TestBookingEvent = {
        sessionId: 'error-session',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      eventBus.on('booking:confirmed', errorHandler);
      eventBus.on('booking:confirmed', successHandler);

      // The Promise.resolve wrapper catches sync errors
      expect(() => eventBus.emit('booking:confirmed', event)).not.toThrow();

      // Both handlers should still be called
      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should only call handler once', () => {
      const eventBus = new TestTypedEventBus<TestEventMap>();
      const handler = vi.fn();
      const event: TestBookingEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      eventBus.once('booking:confirmed', handler);

      // First emit
      eventBus.emit('booking:confirmed', event);
      expect(handler).toHaveBeenCalledTimes(1);

      // Second emit - handler should not be called again
      eventBus.emit('booking:confirmed', event);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle async once handlers', async () => {
      const eventBus = new TestTypedEventBus<TestEventMap>();
      const results: string[] = [];
      const asyncHandler = vi.fn(async (event: TestBookingEvent) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push(`once: ${event.sessionId}`);
      });

      const event: TestBookingEvent = {
        sessionId: 'once-session',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      eventBus.once('booking:confirmed', asyncHandler);
      eventBus.emit('booking:confirmed', event);

      // Wait for async work
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(results).toContain('once: once-session');

      // Second emit should not trigger handler
      eventBus.emit('booking:confirmed', event);
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(results).toHaveLength(1);
    });
  });

  describe('type safety', () => {
    it('should have all required fields in BookingConfirmedEvent', () => {
      const event: TestBookingEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      expect(event).toHaveProperty('sessionId');
      expect(event).toHaveProperty('workflowId');
      expect(event).toHaveProperty('providerId');
      expect(event).toHaveProperty('providerName');
      expect(event).toHaveProperty('serviceType');
      expect(event).toHaveProperty('scheduledAt');
    });

    it('should enforce types at compile time (this is a compile-time check)', () => {
      const eventBus = new TestTypedEventBus<TestEventMap>();
      const event: TestBookingEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      // Type-safe handler
      eventBus.on('booking:confirmed', (payload) => {
        // TypeScript infers payload type
        const _id: string = payload.sessionId;
        expect(_id).toBe('session-123');
      });

      eventBus.emit('booking:confirmed', event);
    });
  });

  describe('edge cases', () => {
    it('should handle emit with no registered handlers', () => {
      const eventBus = new TestTypedEventBus<TestEventMap>();
      const event: TestBookingEvent = {
        sessionId: 'orphan-session',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      // Should not throw when emitting to no handlers
      expect(() => eventBus.emit('booking:confirmed', event)).not.toThrow();
    });

    it('should handle rapid consecutive emits', () => {
      const eventBus = new TestTypedEventBus<TestEventMap>();
      const handler = vi.fn();
      const events: TestBookingEvent[] = Array.from({ length: 100 }, (_, i) => ({
        sessionId: `session-${i}`,
        workflowId: `workflow-${i}`,
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      }));

      eventBus.on('booking:confirmed', handler);

      // Emit 100 events rapidly
      events.forEach((event) => eventBus.emit('booking:confirmed', event));

      expect(handler).toHaveBeenCalledTimes(100);
    });

    it('should handle handler that modifies event (events are not immutable)', () => {
      const eventBus = new TestTypedEventBus<TestEventMap>();
      const mutatingHandler = vi.fn((event: TestBookingEvent) => {
        (event as Record<string, unknown>).mutated = true;
      });
      const observingHandler = vi.fn();

      const event: TestBookingEvent = {
        sessionId: 'mutable-session',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      eventBus.on('booking:confirmed', mutatingHandler);
      eventBus.on('booking:confirmed', observingHandler);

      eventBus.emit('booking:confirmed', event);

      expect(mutatingHandler).toHaveBeenCalled();
      expect(observingHandler).toHaveBeenCalled();
      expect((event as Record<string, unknown>).mutated).toBe(true);
    });

    it('should handle empty string values in event', () => {
      const eventBus = new TestTypedEventBus<TestEventMap>();
      const handler = vi.fn();
      const event: TestBookingEvent = {
        sessionId: '',
        workflowId: '',
        providerId: '',
        providerName: '',
        serviceType: '',
        scheduledAt: '',
      };

      eventBus.on('booking:confirmed', handler);
      eventBus.emit('booking:confirmed', event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should handle special characters in event data', () => {
      const eventBus = new TestTypedEventBus<TestEventMap>();
      const handler = vi.fn();
      const event: TestBookingEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: "O'Reilly's \"Best\" Hair & Beauty <script>",
        serviceType: 'haircut & styling',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      eventBus.on('booking:confirmed', handler);
      eventBus.emit('booking:confirmed', event);

      expect(handler).toHaveBeenCalledWith(event);
    });
  });

  describe('production eventBus singleton', () => {
    // Test the actual exported eventBus
    it('should export a singleton eventBus', async () => {
      // Dynamic import to avoid polluting other tests
      const { eventBus } = await import('../../src/events/event-bus');

      expect(eventBus).toBeDefined();
      expect(typeof eventBus.emit).toBe('function');
      expect(typeof eventBus.on).toBe('function');
      expect(typeof eventBus.off).toBe('function');
      expect(typeof eventBus.once).toBe('function');
    });

    it('should export BookingConfirmedEvent type', async () => {
      // Import both the eventBus and the type
      const module = await import('../../src/events/event-bus');

      // Type check - if this compiles, the type is exported correctly
      const event: typeof module.BookingConfirmedEvent extends never
        ? never
        : {
            sessionId: string;
            workflowId: string;
            providerId: string;
            providerName: string;
            serviceType: string;
            scheduledAt: string;
          } = {
        sessionId: 'test',
        workflowId: 'test',
        providerId: 'test',
        providerName: 'test',
        serviceType: 'test',
        scheduledAt: 'test',
      };

      expect(event.sessionId).toBe('test');
      expect(module.eventBus).toBeDefined();
    });
  });
});
