import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

/**
 * Event Bus - Centralized pub/sub for domain events
 *
 * This module provides a typed event bus for decoupling services from WebSocket emission.
 * Services publish domain events (e.g., 'booking:confirmed'), and the WebSocket layer
 * subscribes to these events to handle socket communication.
 *
 * Benefits:
 * - Services don't need to know about Socket.io
 * - Single point of control for all WebSocket emissions
 * - Easy to add new event types without modifying socket code
 * - Testable: mock the event bus to test services in isolation
 *
 * Future: Can evolve to Redis Pub/Sub if horizontal scaling is needed
 */

// Domain Events

export interface BookingConfirmedEvent {
  sessionId: string;
  workflowId: string;
  providerId: string;
  providerName: string;
  serviceType: string;
  scheduledAt: string;
}

// Event Map - Add new event types here
export interface EventMap {
  'booking:confirmed': BookingConfirmedEvent;
  // Future events:
  // 'notification:send': NotificationEvent;
  // 'workflow:updated': WorkflowUpdatedEvent;
}

export type EventName = keyof EventMap;

/**
 * Typed Event Bus wrapper around Node.js EventEmitter
 *
 * Provides type-safe emit/subscribe for domain events.
 */
class TypedEventBus {
  private emitter = new EventEmitter();

  /**
   * Emit a domain event
   */
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    logger.debug('Event bus emit', { event, payload });
    this.emitter.emit(event, payload);
  }

  /**
   * Subscribe to a domain event
   */
  on<K extends keyof EventMap>(
    event: K,
    handler: (payload: EventMap[K]) => void | Promise<void>
  ): void {
    this.emitter.on(event, (payload) => {
      // Wrap async handlers to catch and log errors
      Promise.resolve(handler(payload)).catch((error) => {
        logger.error('Event handler error', {
          event,
          error: String(error),
        });
      });
    });
  }

  /**
   * Unsubscribe from a domain event
   */
  off<K extends keyof EventMap>(
    event: K,
    handler: (payload: EventMap[K]) => void | Promise<void>
  ): void {
    this.emitter.off(event, handler);
  }

  /**
   * Subscribe to a domain event for a single occurrence
   */
  once<K extends keyof EventMap>(
    event: K,
    handler: (payload: EventMap[K]) => void | Promise<void>
  ): void {
    this.emitter.once(event, (payload) => {
      Promise.resolve(handler(payload)).catch((error) => {
        logger.error('Event handler error', {
          event,
          error: String(error),
        });
      });
    });
  }
}

// Singleton instance
export const eventBus = new TypedEventBus();
