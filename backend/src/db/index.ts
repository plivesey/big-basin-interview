import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { env } from '../config/env';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
function ensureDataDirectory(dbPath: string): void {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Resolve the database path (handle relative paths)
function resolveDatabasePath(dbPath: string): string {
  if (path.isAbsolute(dbPath)) {
    return dbPath;
  }
  return path.resolve(process.cwd(), dbPath);
}

// Create and configure the SQLite database connection
function createDatabase(dbPath: string): Database.Database {
  const resolvedPath = resolveDatabasePath(dbPath);
  ensureDataDirectory(resolvedPath);

  const sqlite = new Database(resolvedPath);

  // Enable foreign keys (disabled by default in SQLite)
  sqlite.pragma('foreign_keys = ON');

  // Enable WAL mode for better concurrent access
  sqlite.pragma('journal_mode = WAL');

  return sqlite;
}

// Create the SQLite connection
const sqlite = createDatabase(env.DATABASE_PATH);

// Create the Drizzle ORM instance with schema
export const db = drizzle(sqlite, { schema });

// Export the raw SQLite connection for advanced operations
export const rawDb = sqlite;

// Export schema for use in other files
export * from './schema';

// Close database connection (useful for graceful shutdown)
export function closeDatabase(): void {
  sqlite.close();
}

// Check if database is healthy
export function isDatabaseHealthy(): boolean {
  try {
    sqlite.prepare('SELECT 1').get();
    return true;
  } catch {
    return false;
  }
}
