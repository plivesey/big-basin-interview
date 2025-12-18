import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import {
  getConnection,
  saveConnection,
  deleteConnection,
} from '../../src/services/calendar-connection-service';
import { rawDb } from '../../src/db';

// Helper to insert a test calendar connection directly
function insertTestConnection(overrides: Partial<{
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  calendarId: string;
  email: string | null;
}> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = overrides.expiresAt || new Date(Date.now() + 3600000);

  const connection = {
    id: overrides.id || uuidv4(),
    userId: overrides.userId || 'default_user',
    accessToken: overrides.accessToken || 'test_access_token',
    refreshToken: overrides.refreshToken || 'test_refresh_token',
    expiresAt: Math.floor(expiresAt.getTime() / 1000),
    calendarId: overrides.calendarId || 'primary',
    email: overrides.email !== undefined ? overrides.email : 'test@example.com',
  };

  rawDb.exec(`
    INSERT INTO calendar_connections (id, user_id, access_token, refresh_token, expires_at, calendar_id, email, created_at, updated_at)
    VALUES (
      '${connection.id}',
      '${connection.userId}',
      '${connection.accessToken}',
      '${connection.refreshToken}',
      ${connection.expiresAt},
      '${connection.calendarId}',
      ${connection.email ? `'${connection.email}'` : 'NULL'},
      ${now},
      ${now}
    )
  `);

  return connection;
}

describe('calendar-connection-service', () => {
  beforeEach(() => {
    // Clear calendar_connections table before each test
    rawDb.exec('DELETE FROM calendar_connections');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getConnection', () => {
    it('should return null when no connection exists', async () => {
      const connection = await getConnection('nonexistent_user');
      expect(connection).toBeNull();
    });

    it('should return connection when it exists', async () => {
      insertTestConnection({ userId: 'test_user', email: 'user@example.com' });

      const connection = await getConnection('test_user');

      expect(connection).not.toBeNull();
      expect(connection?.userId).toBe('test_user');
      expect(connection?.email).toBe('user@example.com');
    });

    it('should use default_user when no userId provided', async () => {
      insertTestConnection({ userId: 'default_user' });

      const connection = await getConnection();

      expect(connection).not.toBeNull();
      expect(connection?.userId).toBe('default_user');
    });
  });

  describe('saveConnection', () => {
    it('should create a new connection when none exists', async () => {
      const tokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresAt: new Date(Date.now() + 3600000),
      };

      const connection = await saveConnection('new_user', tokens, 'new@example.com');

      expect(connection.userId).toBe('new_user');
      expect(connection.accessToken).toBe('new_access_token');
      expect(connection.refreshToken).toBe('new_refresh_token');
      expect(connection.email).toBe('new@example.com');

      // Verify it's in the database
      const retrieved = await getConnection('new_user');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.accessToken).toBe('new_access_token');
    });

    it('should update an existing connection', async () => {
      insertTestConnection({ userId: 'test_user', accessToken: 'old_token' });

      const tokens = {
        accessToken: 'updated_access_token',
        refreshToken: 'updated_refresh_token',
        expiresAt: new Date(Date.now() + 7200000),
      };

      const connection = await saveConnection('test_user', tokens, 'updated@example.com');

      expect(connection.accessToken).toBe('updated_access_token');
      expect(connection.email).toBe('updated@example.com');

      // Verify it was updated in the database
      const retrieved = await getConnection('test_user');
      expect(retrieved?.accessToken).toBe('updated_access_token');
    });

    it('should handle null email', async () => {
      const tokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: new Date(Date.now() + 3600000),
      };

      const connection = await saveConnection('user_no_email', tokens, null);

      expect(connection.email).toBeNull();
    });
  });

  describe('deleteConnection', () => {
    it('should delete an existing connection', async () => {
      insertTestConnection({ userId: 'test_user' });

      const deleted = await deleteConnection('test_user');

      expect(deleted).toBe(true);

      // Verify it's gone
      const connection = await getConnection('test_user');
      expect(connection).toBeNull();
    });

    it('should return false when no connection exists to delete', async () => {
      const deleted = await deleteConnection('nonexistent_user');

      expect(deleted).toBe(false);
    });

    it('should use default_user when no userId provided', async () => {
      insertTestConnection({ userId: 'default_user' });

      const deleted = await deleteConnection();

      expect(deleted).toBe(true);

      const connection = await getConnection();
      expect(connection).toBeNull();
    });
  });
});
