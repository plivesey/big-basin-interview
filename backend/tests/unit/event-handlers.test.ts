import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { ChatServer } from '../../src/websocket/chat-handler';
import type { BookingConfirmedEvent } from '../../src/events/event-bus';

// Mock the event bus - use factory that doesn't reference external variables
vi.mock('../../src/events/event-bus', () => {
  const mockOn = vi.fn();
  return {
    eventBus: {
      on: mockOn,
      emit: vi.fn(),
      off: vi.fn(),
    },
  };
});

// Mock the AI conversation service
vi.mock('../../src/services/ai-conversation-service', () => ({
  sendMessage: vi.fn(),
}));

// Mock the message service
vi.mock('../../src/services/message-service', () => ({
  saveMessage: vi.fn(),
}));

// Mock logger to avoid console output during tests
vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-message-id'),
}));

import { initializeEventHandlers } from '../../src/websocket/event-handlers';
import { eventBus } from '../../src/events/event-bus';
import { sendMessage as sendAIMessage } from '../../src/services/ai-conversation-service';
import { saveMessage } from '../../src/services/message-service';
import { logger } from '../../src/utils/logger';

const mockSendAIMessage = vi.mocked(sendAIMessage);
const mockSaveMessage = vi.mocked(saveMessage);
const mockLogger = vi.mocked(logger);
const mockEventBusOn = vi.mocked(eventBus.on);

describe('event-handlers', () => {
  let mockIo: ChatServer;
  let mockEmit: ReturnType<typeof vi.fn>;
  let mockTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mock socket server
    mockEmit = vi.fn();
    mockTo = vi.fn(() => ({ emit: mockEmit }));
    mockIo = {
      to: mockTo,
    } as unknown as ChatServer;

    // Reset default mock implementations
    mockSendAIMessage.mockResolvedValue('Thank you for your booking!');
    mockSaveMessage.mockResolvedValue({
      id: 'saved-message-id',
      sessionId: 'session-123',
      role: 'assistant' as const,
      content: [{ type: 'text' as const, text: 'Thank you for your booking!' }],
      createdAt: new Date(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeEventHandlers', () => {
    it('should register booking:confirmed event handler', () => {
      initializeEventHandlers(mockIo);

      expect(mockEventBusOn).toHaveBeenCalledWith('booking:confirmed', expect.any(Function));
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing event bus handlers');
    });

    it('should register exactly one booking:confirmed handler per call', () => {
      const initialCallCount = mockEventBusOn.mock.calls.length;

      initializeEventHandlers(mockIo);

      const newCalls = mockEventBusOn.mock.calls.slice(initialCallCount);
      const bookingConfirmedCalls = newCalls.filter(
        (call) => call[0] === 'booking:confirmed'
      );
      expect(bookingConfirmedCalls).toHaveLength(1);
    });
  });

  describe('handleBookingConfirmation', () => {
    let bookingConfirmedHandler: (event: BookingConfirmedEvent) => Promise<void>;

    beforeEach(() => {
      // Initialize handlers to capture the registered handler
      initializeEventHandlers(mockIo);

      // Get the handler that was registered for booking:confirmed
      const bookingConfirmedCall = mockEventBusOn.mock.calls.find(
        (call) => call[0] === 'booking:confirmed'
      );
      bookingConfirmedHandler = bookingConfirmedCall![1] as (event: BookingConfirmedEvent) => Promise<void>;
    });

    it('should emit message_start event to the session room', async () => {
      const event: BookingConfirmedEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      await bookingConfirmedHandler(event);

      expect(mockTo).toHaveBeenCalledWith('session-123');
      expect(mockEmit).toHaveBeenCalledWith('message_start', { messageId: 'mock-message-id' });
    });

    it('should save hidden system notification message', async () => {
      const event: BookingConfirmedEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Elegant Cuts',
        serviceType: 'styling',
        scheduledAt: '2025-12-25T14:30:00Z',
      };

      await bookingConfirmedHandler(event);

      expect(mockSaveMessage).toHaveBeenCalledWith({
        sessionId: 'session-123',
        role: 'user',
        content: [
          {
            type: 'system_notification',
            text: expect.stringContaining('Elegant Cuts'),
          },
        ],
      });

      // Verify the notification text includes key details
      const savedNotification = mockSaveMessage.mock.calls[0][0];
      const notificationText = (savedNotification.content as Array<{ text: string }>)[0].text;
      expect(notificationText).toContain('styling');
      expect(notificationText).toContain('booking');
    });

    it('should call AI service with streaming callback', async () => {
      const event: BookingConfirmedEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      await bookingConfirmedHandler(event);

      expect(mockSendAIMessage).toHaveBeenCalledWith(
        'session-123',
        '',
        expect.objectContaining({
          onTextDelta: expect.any(Function),
        })
      );
    });

    it('should emit text_delta events for streamed text', async () => {
      mockSendAIMessage.mockImplementation(async (_sessionId, _message, callbacks) => {
        // Simulate streaming some text
        if (callbacks?.onTextDelta) {
          callbacks.onTextDelta('Thank ');
          callbacks.onTextDelta('you ');
          callbacks.onTextDelta('for booking!');
        }
        return 'Thank you for booking!';
      });

      const event: BookingConfirmedEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      await bookingConfirmedHandler(event);

      // Verify text_delta was emitted for each chunk
      const textDeltaCalls = mockEmit.mock.calls.filter(
        (call) => call[0] === 'text_delta'
      );
      expect(textDeltaCalls).toHaveLength(3);
      expect(textDeltaCalls[0][1]).toEqual({ text: 'Thank ' });
      expect(textDeltaCalls[1][1]).toEqual({ text: 'you ' });
      expect(textDeltaCalls[2][1]).toEqual({ text: 'for booking!' });
    });

    it('should save assistant response message', async () => {
      mockSendAIMessage.mockResolvedValue('Your booking is confirmed!');

      const event: BookingConfirmedEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      await bookingConfirmedHandler(event);

      // Second saveMessage call should be the assistant response
      expect(mockSaveMessage).toHaveBeenCalledTimes(2);
      expect(mockSaveMessage).toHaveBeenNthCalledWith(2, {
        id: 'mock-message-id',
        sessionId: 'session-123',
        role: 'assistant',
        content: 'Your booking is confirmed!',
      });
    });

    it('should emit message_complete event', async () => {
      const event: BookingConfirmedEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      await bookingConfirmedHandler(event);

      expect(mockEmit).toHaveBeenCalledWith('message_complete', { messageId: 'mock-message-id' });
    });

    it('should log booking acknowledgment success', async () => {
      const event: BookingConfirmedEvent = {
        sessionId: 'session-123',
        workflowId: 'workflow-456',
        providerId: 'provider-789',
        providerName: 'Test Salon',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      await bookingConfirmedHandler(event);

      expect(mockLogger.info).toHaveBeenCalledWith('Booking acknowledgment sent', {
        sessionId: 'session-123',
        messageId: 'mock-message-id',
        workflowId: 'workflow-456',
      });
    });

    describe('date formatting', () => {
      it('should include formatted date in notification', async () => {
        const event: BookingConfirmedEvent = {
          sessionId: 'session-123',
          workflowId: 'workflow-456',
          providerId: 'provider-789',
          providerName: 'Test Salon',
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T09:30:00Z',
        };

        await bookingConfirmedHandler(event);

        const savedNotification = mockSaveMessage.mock.calls[0][0];
        const notificationText = (savedNotification.content as Array<{ text: string }>)[0].text;
        // Should contain some date/time info
        expect(notificationText).toMatch(/\d/); // Contains numbers (from date)
      });
    });

    describe('error handling', () => {
      it('should emit error event when AI service fails', async () => {
        mockSendAIMessage.mockRejectedValue(new Error('AI service unavailable'));

        const event: BookingConfirmedEvent = {
          sessionId: 'session-123',
          workflowId: 'workflow-456',
          providerId: 'provider-789',
          providerName: 'Test Salon',
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
        };

        await bookingConfirmedHandler(event);

        expect(mockEmit).toHaveBeenCalledWith('error', {
          error: 'We confirmed your booking, but had trouble sending a message. Your booking is still valid.',
          code: 'BOOKING_ACK_ERROR',
        });
      });

      it('should log error when AI service fails', async () => {
        mockSendAIMessage.mockRejectedValue(new Error('AI service unavailable'));

        const event: BookingConfirmedEvent = {
          sessionId: 'session-123',
          workflowId: 'workflow-456',
          providerId: 'provider-789',
          providerName: 'Test Salon',
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
        };

        await bookingConfirmedHandler(event);

        expect(mockLogger.error).toHaveBeenCalledWith('Error handling booking confirmation', {
          sessionId: 'session-123',
          workflowId: 'workflow-456',
          error: expect.stringContaining('AI service unavailable'),
        });
      });

      it('should emit error event when saveMessage fails', async () => {
        mockSaveMessage.mockRejectedValue(new Error('Database error'));

        const event: BookingConfirmedEvent = {
          sessionId: 'session-123',
          workflowId: 'workflow-456',
          providerId: 'provider-789',
          providerName: 'Test Salon',
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
        };

        await bookingConfirmedHandler(event);

        expect(mockEmit).toHaveBeenCalledWith('error', expect.objectContaining({
          code: 'BOOKING_ACK_ERROR',
        }));
      });

      it('should not throw when error occurs', async () => {
        mockSendAIMessage.mockRejectedValue(new Error('Some error'));

        const event: BookingConfirmedEvent = {
          sessionId: 'session-123',
          workflowId: 'workflow-456',
          providerId: 'provider-789',
          providerName: 'Test Salon',
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
        };

        // Should not throw
        await expect(bookingConfirmedHandler(event)).resolves.toBeUndefined();
      });
    });

    describe('event flow order', () => {
      it('should emit events in correct order', async () => {
        const emitOrder: string[] = [];
        mockEmit.mockImplementation((eventName: string) => {
          emitOrder.push(eventName);
        });

        const event: BookingConfirmedEvent = {
          sessionId: 'session-123',
          workflowId: 'workflow-456',
          providerId: 'provider-789',
          providerName: 'Test Salon',
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
        };

        await bookingConfirmedHandler(event);

        // Verify order: message_start -> (text_delta)* -> message_complete
        expect(emitOrder[0]).toBe('message_start');
        expect(emitOrder[emitOrder.length - 1]).toBe('message_complete');
      });

      it('should save notification before calling AI', async () => {
        const callOrder: string[] = [];
        mockSaveMessage.mockImplementation(async () => {
          callOrder.push('saveMessage');
          return {
            id: 'msg-id',
            sessionId: 'session-123',
            role: 'assistant' as const,
            content: [{ type: 'text' as const, text: 'test' }],
            createdAt: new Date(),
          };
        });
        mockSendAIMessage.mockImplementation(async () => {
          callOrder.push('sendAIMessage');
          return 'response';
        });

        const event: BookingConfirmedEvent = {
          sessionId: 'session-123',
          workflowId: 'workflow-456',
          providerId: 'provider-789',
          providerName: 'Test Salon',
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
        };

        await bookingConfirmedHandler(event);

        // Notification should be saved before AI is called
        expect(callOrder.indexOf('saveMessage')).toBeLessThan(
          callOrder.indexOf('sendAIMessage')
        );
      });
    });

    describe('edge cases', () => {
      it('should handle empty provider name', async () => {
        const event: BookingConfirmedEvent = {
          sessionId: 'session-123',
          workflowId: 'workflow-456',
          providerId: 'provider-789',
          providerName: '',
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
        };

        await bookingConfirmedHandler(event);

        expect(mockSaveMessage).toHaveBeenCalled();
      });

      it('should handle empty service type', async () => {
        const event: BookingConfirmedEvent = {
          sessionId: 'session-123',
          workflowId: 'workflow-456',
          providerId: 'provider-789',
          providerName: 'Test Salon',
          serviceType: '',
          scheduledAt: '2025-12-20T10:00:00Z',
        };

        await bookingConfirmedHandler(event);

        expect(mockSaveMessage).toHaveBeenCalled();
      });

      it('should handle special characters in provider name', async () => {
        const event: BookingConfirmedEvent = {
          sessionId: 'session-123',
          workflowId: 'workflow-456',
          providerId: 'provider-789',
          providerName: "O'Reilly's Hair & Beauty",
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
        };

        await bookingConfirmedHandler(event);

        const savedNotification = mockSaveMessage.mock.calls[0][0];
        const notificationText = (savedNotification.content as Array<{ text: string }>)[0].text;
        expect(notificationText).toContain("O'Reilly's Hair & Beauty");
      });

      it('should handle very long provider names', async () => {
        const longName = 'A'.repeat(200);
        const event: BookingConfirmedEvent = {
          sessionId: 'session-123',
          workflowId: 'workflow-456',
          providerId: 'provider-789',
          providerName: longName,
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
        };

        await bookingConfirmedHandler(event);

        const savedNotification = mockSaveMessage.mock.calls[0][0];
        const notificationText = (savedNotification.content as Array<{ text: string }>)[0].text;
        expect(notificationText).toContain(longName);
      });
    });
  });

  describe('multiple sessions', () => {
    let bookingConfirmedHandler: (event: BookingConfirmedEvent) => Promise<void>;

    beforeEach(() => {
      initializeEventHandlers(mockIo);
      const bookingConfirmedCall = mockEventBusOn.mock.calls.find(
        (call) => call[0] === 'booking:confirmed'
      );
      bookingConfirmedHandler = bookingConfirmedCall![1] as (event: BookingConfirmedEvent) => Promise<void>;
    });

    it('should emit to correct session room for each event', async () => {
      const event1: BookingConfirmedEvent = {
        sessionId: 'session-111',
        workflowId: 'workflow-1',
        providerId: 'provider-1',
        providerName: 'Salon A',
        serviceType: 'haircut',
        scheduledAt: '2025-12-20T10:00:00Z',
      };

      const event2: BookingConfirmedEvent = {
        sessionId: 'session-222',
        workflowId: 'workflow-2',
        providerId: 'provider-2',
        providerName: 'Salon B',
        serviceType: 'styling',
        scheduledAt: '2025-12-20T11:00:00Z',
      };

      await bookingConfirmedHandler(event1);
      await bookingConfirmedHandler(event2);

      // Verify both sessions received their events
      const toCalls = mockTo.mock.calls;
      expect(toCalls.some((call) => call[0] === 'session-111')).toBe(true);
      expect(toCalls.some((call) => call[0] === 'session-222')).toBe(true);
    });
  });
});
