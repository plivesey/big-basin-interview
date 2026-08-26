/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Creates a chat session and an active booking workflow directly in the
 * backend's SQLite database, and prints their ids.
 *
 * The scripted chat server needs a real workflow id because POST /api/bookings
 * requires one (createBookingSchema, backend/src/validation/booking-schemas.ts),
 * and workflows are normally created by the search_providers tool -- which needs
 * the AI. This is the fixture that replaces it.
 *
 * Usage: node scripts/seed-dev-session.js [providerId]
 */
const path = require('node:path');
const crypto = require('node:crypto');

const backendRoot = path.resolve(__dirname, '../../backend');
const Database = require(path.join(backendRoot, 'node_modules/better-sqlite3'));

const dbPath = process.env.DATABASE_PATH || path.join(backendRoot, 'data/app.db');
const db = new Database(dbPath);

const providerId =
  process.argv[2] ??
  db.prepare("SELECT id FROM providers WHERE geo = 'san_francisco' LIMIT 1").get()?.id;

if (!providerId) {
  console.error('No provider found. Run `npm run db:seed` in backend/ first.');
  process.exit(1);
}

// Drizzle's integer({ mode: 'timestamp' }) columns store *seconds*, not
// milliseconds -- writing Date.now() here yields dates in the year 58622.
const now = Math.floor(Date.now() / 1000);
const sessionId = crypto.randomUUID();
const workflowId = crypto.randomUUID();

db.prepare(
  `INSERT INTO sessions (id, user_id, current_workflow_id, created_at, last_activity_at)
   VALUES (?, 'default_user', ?, ?, ?)`
).run(sessionId, workflowId, now, now);

db.prepare(
  `INSERT INTO workflow_states (id, session_id, current_state, context, created_at, last_updated)
   VALUES (?, ?, 'PROVIDER_SELECTION', ?, ?, ?)`
).run(
  workflowId,
  sessionId,
  JSON.stringify({ selectedProviderId: providerId, selectedProviders: [providerId] }),
  now,
  now
);

console.log(`DEV_SESSION_ID=${sessionId}`);
console.log(`DEV_WORKFLOW_ID=${workflowId}`);
console.log(`provider=${providerId}`);
