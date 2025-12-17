# Database Operations

Manage the SQLite database schema and data using Drizzle ORM.

## Push Schema Changes

After modifying the database schema in `backend/src/db/schema.ts`, push the changes to the database:

```bash
cd backend && npm run db:push
```

This command:
- Creates new tables if they don't exist
- Adds new columns to existing tables
- Updates indexes and constraints
- **Does NOT drop existing data** (safe for development)

## Seed Database

Populate the database with mock data for testing:

```bash
cd backend && npm run db:seed
```

This creates:
- 10 mock service providers (salons, mechanics, dentists)
- Realistic working hours and services for each provider

## Inspect Database

Open Drizzle Studio to visually browse and query the database:

```bash
cd backend && npm run db:studio
```

This opens a web-based UI at `https://local.drizzle.studio` where you can:
- Browse all tables
- View and edit data
- Run custom SQL queries

## Schema Location

The database schema is defined in: `backend/src/db/schema.ts`

Current tables:
- **providers** - Service providers with working hours and services
- **bookings** - Appointments with idempotency keys
- **sessions** - Chat sessions for WebSocket connections
- **messages** - Conversation history (supports text, tool_use, tool_result)
- **workflow_states** - Booking workflow state machine

## Database File

The SQLite database file is stored at: `backend/local.db`

This file is gitignored and created locally when you first run the backend or push the schema.

## Common Issues

### "no such table" errors

If you see errors like `no such table: sessions`, the schema hasn't been pushed:

```bash
cd backend && npm run db:push
```

### Database locked errors

If the database appears locked, ensure:
1. Only one process is accessing the database
2. Drizzle Studio is closed if running tests
3. The backend server is stopped during migrations

### Reset database

To completely reset the database:

```bash
cd backend && rm -f local.db && npm run db:push && npm run db:seed
```
