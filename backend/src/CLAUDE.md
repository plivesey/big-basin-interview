# Backend Source Directory

This directory contains the backend source code for the Service Booking Assistant.

## Directory Structure

```
src/
├── index.ts              # Express app entry point, starts server
├── config/
│   └── env.ts            # Environment variable validation with Zod
├── db/
│   ├── index.ts          # Drizzle ORM database connection
│   ├── schema.ts         # Database schema definitions (providers, bookings, sessions, messages, workflows)
│   └── seed.ts           # Seed script with 10 mock providers
├── types/
│   ├── index.ts          # Central type exports
│   ├── workflow.types.ts # Workflow state machine types and transitions
│   ├── api.types.ts      # API request/response types
│   └── tool.types.ts     # Claude SDK tool definition types
└── utils/
    └── logger.ts         # Centralized logging utility
```

## Key Files

### Database (`db/`)
- **schema.ts**: Drizzle ORM schema with tables for providers, bookings, sessions, messages, and workflow_states
- **index.ts**: Database connection using better-sqlite3 with WAL mode and foreign keys enabled
- **seed.ts**: Populates database with 10 realistic providers (3 salons, 3 mechanics, 2 dentists, 2 other)

### Configuration (`config/`)
- **env.ts**: Environment variable validation using Zod schema, auto-loads `.env` file

### Types (`types/`)
- **workflow.types.ts**: Defines WorkflowState enum, transitions, and validation functions (`canTransition`, `getNextStates`)
- **api.types.ts**: Request/response types for REST API endpoints
- **tool.types.ts**: Types for Claude SDK tool definitions and handlers

## Database Schema

Five main tables:
1. **providers** - Service providers with working hours (JSON) and services (JSON array)
2. **bookings** - Appointments with idempotency keys for duplicate prevention
3. **sessions** - Chat sessions with default user for MVP
4. **messages** - Conversation history with JSON content (supports text, tool_use, tool_result)
5. **workflow_states** - Booking workflow state machine (supports multiple workflows per session)

## Logging

**IMPORTANT: Never use `console.log`, `console.error`, or `console.warn` directly.** Always use the centralized logger from `utils/logger.ts`.

```typescript
import { logger } from './utils/logger';

logger.debug('Detailed debug info', { context: 'optional' });
logger.info('General information');
logger.warn('Warning message');
logger.error('Error occurred', { error: String(err) });
```

The logger respects the `LOG_LEVEL` environment variable and formats output with timestamps. The only exception is `config/env.ts` which must use `process.stderr.write` directly because the logger depends on env validation completing first.

## NPM Scripts

- `npm run dev` - Start development server with hot reload
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Populate database with mock data
- `npm run db:studio` - Open Drizzle Studio to inspect database
- `npm run test` - Run unit and integration tests
- `npm run test:coverage` - Run tests with coverage report
