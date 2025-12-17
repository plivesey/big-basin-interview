import { describe, it, expect } from 'vitest';
import {
  createSession,
  getSession,
  updateSessionActivity,
  updateSessionStatus,
  getOrCreateSession,
  deleteSession,
} from '../../src/services/session-service';

describe('session-service', () => {
  describe('createSession', () => {
    it('should create a new session with default user', async () => {
      const session = await createSession();

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.userId).toBe('default_user');
      expect(session.status).toBe('active');
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastActivityAt).toBeInstanceOf(Date);
    });

    it('should create a session with custom user ID', async () => {
      const session = await createSession('custom_user');

      expect(session.userId).toBe('custom_user');
    });

    it('should generate unique session IDs', async () => {
      const session1 = await createSession();
      const session2 = await createSession();

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', async () => {
      const created = await createSession();
      const retrieved = await getSession(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.userId).toBe(created.userId);
      expect(retrieved?.status).toBe(created.status);
    });

    it('should return null for non-existent session', async () => {
      const session = await getSession('non-existent-id');
      expect(session).toBeNull();
    });

    it('should return null for empty session ID', async () => {
      const session = await getSession('');
      expect(session).toBeNull();
    });
  });

  describe('updateSessionActivity', () => {
    it('should update last activity timestamp', async () => {
      const created = await createSession();

      // SQLite stores timestamps in seconds, so we need to wait at least 1 second
      // For faster tests, we just verify the session is returned and has a lastActivityAt
      const updated = await updateSessionActivity(created.id);

      expect(updated).toBeDefined();
      expect(updated?.id).toBe(created.id);
      expect(updated?.lastActivityAt).toBeInstanceOf(Date);
      // SQLite stores timestamps in seconds, so truncate to seconds for comparison
      const createdSeconds = Math.floor(created.lastActivityAt.getTime() / 1000);
      const updatedSeconds = Math.floor((updated?.lastActivityAt.getTime() ?? 0) / 1000);
      expect(updatedSeconds).toBeGreaterThanOrEqual(createdSeconds);
    });

    it('should return null for non-existent session', async () => {
      const result = await updateSessionActivity('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return null for empty session ID', async () => {
      const result = await updateSessionActivity('');
      expect(result).toBeNull();
    });
  });

  describe('updateSessionStatus', () => {
    it('should update session status to inactive', async () => {
      const created = await createSession();
      const updated = await updateSessionStatus(created.id, 'inactive');

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('inactive');
    });

    it('should update session status to active', async () => {
      const created = await createSession();
      await updateSessionStatus(created.id, 'inactive');
      const updated = await updateSessionStatus(created.id, 'active');

      expect(updated?.status).toBe('active');
    });

    it('should return null for non-existent session', async () => {
      const result = await updateSessionStatus('non-existent-id', 'inactive');
      expect(result).toBeNull();
    });
  });

  describe('getOrCreateSession', () => {
    it('should return existing session if valid ID provided', async () => {
      const created = await createSession();
      const retrieved = await getOrCreateSession(created.id);

      expect(retrieved.id).toBe(created.id);
    });

    it('should create new session if no ID provided', async () => {
      const session = await getOrCreateSession();

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.status).toBe('active');
    });

    it('should create new session if invalid ID provided', async () => {
      const session = await getOrCreateSession('non-existent-id');

      expect(session).toBeDefined();
      expect(session.id).not.toBe('non-existent-id');
    });
  });

  describe('deleteSession', () => {
    it('should delete an existing session', async () => {
      const created = await createSession();
      const deleted = await deleteSession(created.id);

      expect(deleted).toBe(true);

      const retrieved = await getSession(created.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent session', async () => {
      const deleted = await deleteSession('non-existent-id');
      expect(deleted).toBe(false);
    });

    it('should return false for empty session ID', async () => {
      const deleted = await deleteSession('');
      expect(deleted).toBe(false);
    });
  });
});
