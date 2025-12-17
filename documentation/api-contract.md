# API Contract Documentation

This document describes the REST and WebSocket APIs for the Service Booking Assistant.

## REST API

Base URL: `http://localhost:3001/api`

### Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }  // Optional
  }
}
```

### Endpoints

#### Health Check

```
GET /api/heartbeat
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "Backend is running"
}
```

#### List/Search Providers

```
GET /api/providers
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (searches name, category, description, services) |

**Response:**
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "id": "uuid",
        "name": "Luxe Salon",
        "category": "salon",
        "description": "Premium hair styling...",
        "address": "123 Main St",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "rating": 4.8,
        "reviewCount": 150,
        "phoneNumber": "+1-555-0100",
        "email": "info@luxesalon.com",
        "website": "https://luxesalon.com",
        "workingHours": {
          "monday": { "open": "09:00", "close": "18:00" },
          "tuesday": { "open": "09:00", "close": "18:00" },
          ...
        },
        "services": ["haircut", "coloring", "styling"],
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 10
  }
}
```

#### Get Provider by ID

```
GET /api/providers/:id
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Provider ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "provider": { ... }
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Provider with ID 'xxx' not found"
  }
}
```

**Response (400 - Invalid UUID):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "path": ["id"],
        "message": "Invalid provider ID format"
      }
    ]
  }
}
```

---

## WebSocket API

Connection URL: `ws://localhost:3001`

The WebSocket API uses Socket.io for real-time chat communication.

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  query: { sessionId: 'existing-session-id' }, // Optional
  transports: ['websocket', 'polling'],
});
```

### Type Definitions

Types are available in `@asba/shared-types`:

```typescript
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  RawChatMessage,
} from '@asba/shared-types';
```

### Server-to-Client Events

#### `session_created`

Emitted after connection when session is established.

```typescript
socket.on('session_created', (data: { sessionId: string }) => {
  // Store sessionId for reconnection
});
```

#### `message_history`

Emitted after connection with existing conversation history.

```typescript
socket.on('message_history', (data: { messages: RawChatMessage[] }) => {
  // data.messages contains conversation history
  // Each message has createdAt as ISO string
});
```

**RawChatMessage:**
```typescript
interface RawChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: MessageContent[];
  createdAt: string; // ISO 8601 format
}

type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string };
```

#### `message_start`

Emitted when the assistant begins generating a response.

```typescript
socket.on('message_start', (data: { messageId: string }) => {
  // Create placeholder message for streaming
  // messageId will be used in message_complete
});
```

#### `text_delta`

Emitted during streaming with text chunks.

```typescript
socket.on('text_delta', (data: { text: string }) => {
  // Append text to current streaming message
});
```

#### `assistant_message`

Emitted for non-streaming responses (complete message).

```typescript
socket.on('assistant_message', (data: {
  id: string;
  content: string;
  timestamp: string;
}) => {
  // Add complete message to conversation
});
```

#### `message_complete`

Emitted when streaming is finished.

```typescript
socket.on('message_complete', (data: { messageId: string }) => {
  // Update placeholder message with final ID
  // Clear streaming state
});
```

#### `error`

Emitted on error.

```typescript
socket.on('error', (data: { error: string; code?: string }) => {
  // Display error message to user
  // Common codes: SESSION_INIT_ERROR, NO_SESSION, INVALID_MESSAGE,
  //               AI_TIMEOUT, AI_UNAVAILABLE, SYNC_ERROR
});
```

### Client-to-Server Events

#### `user_message`

Send a chat message.

```typescript
socket.emit('user_message', { message: string });
```

**Notes:**
- Message must be non-empty
- Requires active session

#### `sync`

Request message sync after reconnection.

```typescript
socket.emit('sync', { lastMessageId?: string });
```

**Notes:**
- If lastMessageId provided, returns messages after that message
- If not provided, returns full message history

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `SESSION_INIT_ERROR` | WS | Failed to initialize session |
| `NO_SESSION` | WS | No active session for request |
| `INVALID_MESSAGE` | WS | Message validation failed |
| `AI_ERROR` | WS | Generic AI service error |
| `AI_TIMEOUT` | WS | AI response timed out |
| `AI_UNAVAILABLE` | WS | AI service unavailable after retries |
| `SYNC_ERROR` | WS | Failed to sync message history |
