import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
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

// Note: These tests focus on the calendar service's connection-checking logic
// The Google Calendar API interactions are tested through integration tests
// or manual testing, as mocking the googleapis library is complex

describe('calendar-service', () => {
  // Import the actual module (which will use real googleapis)
  // We only test the connection checking parts
  let isCalendarConnected: () => Promise<boolean>;
  let checkConflicts: (start: Date, end: Date) => Promise<{ id: string; title: string; start: string; end: string }[]>;
  let createEvent: (details: { title: string; startTime: Date; endTime: Date; location?: string; description?: string }) => Promise<string | null>;
  let deleteEvent: (eventId: string) => Promise<boolean>;

  beforeEach(async () => {
    // Clear calendar_connections table before each test
    rawDb.exec('DELETE FROM calendar_connections');
    vi.clearAllMocks();

    // Import fresh module
    const calendarService = await import('../../src/services/calendar-service');
    isCalendarConnected = calendarService.isCalendarConnected;
    checkConflicts = calendarService.checkConflicts;
    createEvent = calendarService.createEvent;
    deleteEvent = calendarService.deleteEvent;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isCalendarConnected', () => {
    it('should return false when no connection exists', async () => {
      const connected = await isCalendarConnected();
      expect(connected).toBe(false);
    });

    it('should return true when connection exists', async () => {
      insertTestConnection({ userId: 'default_user' });

      const connected = await isCalendarConnected();
      expect(connected).toBe(true);
    });
  });

  describe('checkConflicts', () => {
    it('should return empty array when not connected', async () => {
      const conflicts = await checkConflicts(
        new Date('2025-12-20T10:00:00Z'),
        new Date('2025-12-20T11:00:00Z')
      );

      expect(conflicts).toEqual([]);
    });
  });

  describe('createEvent', () => {
    it('should return null when not connected', async () => {
      const eventId = await createEvent({
        title: 'Test Event',
        startTime: new Date('2025-12-20T10:00:00Z'),
        endTime: new Date('2025-12-20T11:00:00Z'),
      });

      expect(eventId).toBeNull();
    });
  });

  describe('deleteEvent', () => {
    it('should return false when not connected', async () => {
      const deleted = await deleteEvent('event123');
      expect(deleted).toBe(false);
    });
  });
});
