import { beforeAll, afterAll, beforeEach } from 'vitest';

// Set test environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = './data/test.db';

beforeAll(async () => {
  // Global setup before all tests
  // Import the database to trigger initialization
  const { rawDb } = await import('../src/db');

  // Create tables if they don't exist
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      rating REAL NOT NULL,
      review_count INTEGER DEFAULT 0,
      phone_number TEXT,
      email TEXT,
      website TEXT,
      working_hours TEXT NOT NULL,
      services TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      current_workflow_id TEXT,
      created_at INTEGER NOT NULL,
      last_activity_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      provider_id TEXT NOT NULL REFERENCES providers(id),
      service_type TEXT NOT NULL,
      scheduled_at INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      status TEXT NOT NULL,
      calendar_event_id TEXT,
      idempotency_key TEXT NOT NULL UNIQUE,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflow_states (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      current_state TEXT NOT NULL,
      context TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_updated INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS workflow_session_id_idx ON workflow_states(session_id);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS messages_session_id_idx ON messages(session_id);
  `);
});

beforeEach(async () => {
  // Reset database state between tests
  const { rawDb } = await import('../src/db');

  // Clear tables in correct order (respecting foreign keys)
  rawDb.exec('DELETE FROM messages');
  rawDb.exec('DELETE FROM workflow_states');
  rawDb.exec('DELETE FROM bookings');
  rawDb.exec('DELETE FROM sessions');
});

afterAll(async () => {
  // Global cleanup after all tests
  const { closeDatabase } = await import('../src/db');
  closeDatabase();
});
