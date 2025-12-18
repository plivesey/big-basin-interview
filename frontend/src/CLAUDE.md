# Frontend Source Directory

This directory contains the frontend source code for the Service Booking Assistant chat interface.

## Directory Structure

```
src/
├── App.tsx                  # Root component with ErrorBoundary wrapper
├── main.tsx                 # React 19 entry point
├── index.css                # Tailwind CSS + custom component classes
├── components/              # Reusable UI components
│   ├── index.ts             # Barrel exports
│   ├── ChatContainer.tsx    # Main chat orchestrator
│   ├── ChatInput.tsx        # Message input with auto-resize
│   ├── ChatMessage.tsx      # Message display (memoized)
│   ├── MessageList.tsx      # Message list with auto-scroll
│   ├── ConnectionStatus.tsx # WebSocket connection indicator
│   ├── ErrorBoundary.tsx    # Error boundary for graceful failures
│   ├── Button.tsx           # Multi-variant button
│   ├── Badge.tsx            # Status badges
│   ├── Card.tsx             # Card container
│   ├── Input.tsx            # Form input
│   ├── Textarea.tsx         # Form textarea
│   ├── StatusMessage.tsx    # Alert/status messages
│   └── Spinner.tsx          # Loading spinner
├── hooks/
│   └── useWebSocket.ts      # WebSocket connection management
├── store/
│   ├── chat-store.ts        # Zustand state management + selectors
│   └── chat-store.test.ts   # Store tests (20 tests)
├── utils/
│   └── logger.ts            # Development-aware logging
└── test/
    └── setup.ts             # Vitest setup
```

## Key Files

### State Management (`store/`)

**chat-store.ts** - Zustand store with:
- Session state (sessionId, connectionStatus)
- Message state (messages, isLoading, streamingMessageId)
- Actions for state mutations
- **Selectors** for optimized subscriptions:
  - `selectMessages`, `selectIsLoading`, `selectConnectionStatus`, etc.
  - Use selectors to prevent unnecessary re-renders

```typescript
// Good - only re-renders when messages change
const messages = useChatStore(selectMessages);

// Bad - re-renders on any store change
const { messages } = useChatStore();
```

### WebSocket Hook (`hooks/`)

**useWebSocket.ts** - Manages WebSocket connection:
- Auto-connect on mount, disconnect on unmount
- Session persistence via sessionStorage
- Reconnection logic with exponential backoff
- Streaming message support (text deltas)
- **Uses ref for streaming ID** to avoid race conditions

### Components (`components/`)

All chat-related components are memoized with `React.memo()`:
- `ChatMessage`, `ChatTimestamp`, `ChatLoading`
- `ConnectionStatus`

**ChatContainer** uses Zustand selectors for optimized rendering.

**ErrorBoundary** wraps the app to catch and display errors gracefully.

## Patterns and Conventions

### Imports

Types are imported from the shared package:
```typescript
import type { ChatMessage, ConnectionStatus } from '@asba/shared-types';
import { parseMessage, getMessageText } from '@asba/shared-types';
```

The store re-exports these for backward compatibility:
```typescript
import { useChatStore, parseMessage, type ChatMessage } from '../store/chat-store';
```

### Component Structure

1. Imports
2. Types/Interfaces
3. Component (with JSDoc comment)
4. Export (named, not default)

```typescript
import { memo } from 'react';

interface Props { ... }

/**
 * Component description.
 */
export const MyComponent = memo(function MyComponent(props: Props) {
  return ...
});
```

### Styling

Uses Tailwind CSS with custom component classes from `index.css`:
- `.btn-primary`, `.btn-secondary` - Button styles
- `.message-user`, `.message-assistant` - Chat bubble styles
- `.badge-*` - Status badge variants
- `.card`, `.card-hover` - Card containers

## NPM Scripts

```bash
npm run dev          # Start dev server (port 5173)
npm run build        # Build for production
npm run test         # Run Vitest tests
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
```

## Testing

Tests use Vitest with jsdom environment. Test files are co-located:
- `chat-store.test.ts` - 20 tests for store behavior

Run tests:
```bash
npm run test         # Single run
npm run test:watch   # Watch mode
```

## Environment Variables

```bash
VITE_BACKEND_URL=http://localhost:3001  # Backend API URL
```

Variables must be prefixed with `VITE_` to be available in the browser.
