# Event Bus Pattern

## Overview

The event bus provides a centralized pub/sub system for domain events, decoupling backend services from WebSocket emission. Services publish domain events (e.g., `booking:confirmed`), and the WebSocket layer subscribes to handle socket communication.

## Problem

Before this pattern, the booking route directly accessed the Socket.io instance:

```
┌─────────────────────┐          ┌─────────────────────┐
│   chat-handler.ts   │          │    bookings.ts      │
└────────┬────────────┘          └──────────┬──────────┘
         │ socket.emit()                    │ getSocketInstance()
         ▼                                  ▼
┌─────────────────────────────────────────────────────────┐
│            Socket.io Server (global singleton)          │
└─────────────────────────────────────────────────────────┘
```

This created several issues:
- **Scattered control flow**: Multiple places emit WebSocket messages at arbitrary times
- **Protocol leakage**: The booking route understands socket protocol details
- **Testing difficulty**: Hard to test booking logic independently of sockets
- **No centralized control**: Difficult to add logging, rate limiting, or message ordering

## Solution

The event bus pattern centralizes all WebSocket emission in the chat-handler:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  chat-handler   │     │  booking-route  │     │ future-services │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │ subscribe             │ publish               │ publish
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Internal Event Bus                         │
└────────────────────────────────────────────────────────────────┘
         │
         │ chat-handler owns all socket emission
         ▼
┌─────────────────┐
│   Socket.io     │
└─────────────────┘
```

## Implementation

### Event Bus (`backend/src/events/event-bus.ts`)

A typed event bus singleton wrapping Node.js EventEmitter:

```typescript
import { eventBus } from '../events/event-bus';

// Publish an event
eventBus.emit('booking:confirmed', {
  sessionId: 'session-123',
  workflowId: 'workflow-456',
  providerId: 'provider-789',
  providerName: 'Downtown Salon',
  serviceType: 'haircut',
  scheduledAt: '2025-12-20T10:00:00Z',
});

// Subscribe to an event
eventBus.on('booking:confirmed', async (event) => {
  // Handle the event
});
```

Key features:
- **Type-safe**: TypeScript interfaces enforce event contracts
- **Error isolation**: Handler errors are caught and logged without affecting other handlers
- **Async support**: Handlers can be sync or async
- **Once support**: `eventBus.once()` for single-fire subscriptions

### Event Handlers (`backend/src/websocket/event-handlers.ts`)

Centralizes socket emission for all domain events:

```typescript
export function initializeEventHandlers(io: ChatServer): void {
  eventBus.on('booking:confirmed', async (event) => {
    await handleBookingConfirmation(io, event);
  });
}
```

The booking confirmation handler:
1. Formats the scheduled date for display
2. Saves a hidden notification message to conversation history
3. Streams an AI acknowledgment response to the user
4. Saves the AI response message

### Booking Route (`backend/src/routes/bookings.ts`)

The route now publishes events instead of emitting sockets directly:

```typescript
// After successful booking creation
eventBus.emit('booking:confirmed', {
  sessionId: workflow.sessionId,
  workflowId,
  providerId,
  providerName: provider.name,
  serviceType,
  scheduledAt,
});
```

## Adding New Events

1. **Define the event interface** in `event-bus.ts`:

```typescript
export interface NotificationSentEvent {
  sessionId: string;
  notificationType: string;
  message: string;
}

export interface EventMap {
  'booking:confirmed': BookingConfirmedEvent;
  'notification:sent': NotificationSentEvent; // Add new event
}
```

2. **Add handler** in `event-handlers.ts`:

```typescript
eventBus.on('notification:sent', async (event) => {
  // Handle notification
});
```

3. **Emit from service**:

```typescript
eventBus.emit('notification:sent', {
  sessionId: 'session-123',
  notificationType: 'reminder',
  message: 'Your appointment is tomorrow',
});
```

## Error Handling

The event bus catches both sync and async errors to prevent one handler from crashing others:

```typescript
// This won't crash other handlers
eventBus.on('booking:confirmed', () => {
  throw new Error('Handler error');
});

eventBus.on('booking:confirmed', () => {
  // This still runs
});
```

Errors are logged with the event name and error details.

## Testing

### Testing Services

Mock the event bus to test services in isolation:

```typescript
vi.mock('../events/event-bus', () => ({
  eventBus: {
    emit: vi.fn(),
    on: vi.fn(),
  },
}));

// Verify event was emitted
expect(eventBus.emit).toHaveBeenCalledWith('booking:confirmed', {
  sessionId: 'test-session',
  // ...
});
```

### Testing Event Handlers

Test handlers by importing them directly:

```typescript
import { initializeEventHandlers } from './event-handlers';

// Create mock io and trigger handler
const mockIo = { to: vi.fn().mockReturnThis(), emit: vi.fn() };
initializeEventHandlers(mockIo);

// Emit event and verify socket calls
```

## Benefits

- **Complete decoupling**: Services publish domain events without knowing about sockets
- **Single point of control**: All WebSocket emissions flow through chat-handler
- **Testable**: Mock the event bus to test services in isolation
- **Extensible**: Easy to add new event types without modifying socket code
- **Type-safe**: TypeScript interfaces enforce event contracts
- **Future-proof**: Can evolve to Redis Pub/Sub if horizontal scaling is needed

## Related Files

- `backend/src/events/event-bus.ts` - Typed event bus singleton
- `backend/src/websocket/event-handlers.ts` - Centralized socket emission
- `backend/src/websocket/chat-handler.ts` - Initializes event handlers
- `backend/src/routes/bookings.ts` - Emits booking:confirmed event
- `backend/tests/unit/event-bus.test.ts` - Event bus tests
- `backend/tests/unit/event-handlers.test.ts` - Event handler tests
