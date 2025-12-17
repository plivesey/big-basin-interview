import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveMessage,
  getMessageHistory,
  deleteMessageHistory,
  getMessageById,
  getMessagesSince,
} from '../../src/services/message-service';
import { createSession } from '../../src/services/session-service';

describe('message-service', () => {
  let testSessionId: string;

  beforeEach(async () => {
    // Create a test session for each test
    const session = await createSession();
    testSessionId = session.id;
  });

  describe('saveMessage', () => {
    it('should save a message with string content', async () => {
      const message = await saveMessage({
        sessionId: testSessionId,
        role: 'user',
        content: 'Hello, world!',
      });

      expect(message).toBeDefined();
      expect(message.id).toBeDefined();
      expect(message.sessionId).toBe(testSessionId);
      expect(message.role).toBe('user');
      expect(message.content).toEqual([{ type: 'text', text: 'Hello, world!' }]);
      expect(message.createdAt).toBeInstanceOf(Date);
    });

    it('should save a message with MessageContent array', async () => {
      const content = [
        { type: 'text' as const, text: 'Here is the result' },
      ];

      const message = await saveMessage({
        sessionId: testSessionId,
        role: 'assistant',
        content,
      });

      expect(message.content).toEqual(content);
      expect(message.role).toBe('assistant');
    });

    it('should save message with correct timestamp', async () => {
      const before = new Date();
      const message = await saveMessage({
        sessionId: testSessionId,
        role: 'user',
        content: 'Test message',
      });
      const after = new Date();

      expect(message.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(message.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw error for empty session ID', async () => {
      await expect(
        saveMessage({
          sessionId: '',
          role: 'user',
          content: 'Test',
        })
      ).rejects.toThrow('Session ID is required');
    });

    it('should throw error for invalid role', async () => {
      await expect(
        saveMessage({
          sessionId: testSessionId,
          role: 'invalid' as 'user',
          content: 'Test',
        })
      ).rejects.toThrow('Role must be "user" or "assistant"');
    });

    it('should throw error for null content', async () => {
      await expect(
        saveMessage({
          sessionId: testSessionId,
          role: 'user',
          content: null as unknown as string,
        })
      ).rejects.toThrow('Content is required');
    });
  });

  describe('getMessageHistory', () => {
    it('should return empty array for session with no messages', async () => {
      const messages = await getMessageHistory(testSessionId);
      expect(messages).toEqual([]);
    });

    it('should return messages in chronological order', async () => {
      // Add messages with small delays to ensure order
      await saveMessage({ sessionId: testSessionId, role: 'user', content: 'First' });
      await saveMessage({ sessionId: testSessionId, role: 'assistant', content: 'Second' });
      await saveMessage({ sessionId: testSessionId, role: 'user', content: 'Third' });

      const messages = await getMessageHistory(testSessionId);

      expect(messages).toHaveLength(3);
      expect(messages[0].content).toEqual([{ type: 'text', text: 'First' }]);
      expect(messages[1].content).toEqual([{ type: 'text', text: 'Second' }]);
      expect(messages[2].content).toEqual([{ type: 'text', text: 'Third' }]);
    });

    it('should return empty array for empty session ID', async () => {
      const messages = await getMessageHistory('');
      expect(messages).toEqual([]);
    });

    it('should return empty array for non-existent session', async () => {
      const messages = await getMessageHistory('non-existent-session-id');
      expect(messages).toEqual([]);
    });
  });

  describe('deleteMessageHistory', () => {
    it('should delete all messages for a session', async () => {
      await saveMessage({ sessionId: testSessionId, role: 'user', content: 'Message 1' });
      await saveMessage({ sessionId: testSessionId, role: 'assistant', content: 'Message 2' });

      const deleted = await deleteMessageHistory(testSessionId);

      expect(deleted).toBe(2);

      const messages = await getMessageHistory(testSessionId);
      expect(messages).toEqual([]);
    });

    it('should return 0 for session with no messages', async () => {
      const deleted = await deleteMessageHistory(testSessionId);
      expect(deleted).toBe(0);
    });

    it('should return 0 for empty session ID', async () => {
      const deleted = await deleteMessageHistory('');
      expect(deleted).toBe(0);
    });
  });

  describe('getMessageById', () => {
    it('should return message by ID', async () => {
      const saved = await saveMessage({
        sessionId: testSessionId,
        role: 'user',
        content: 'Test message',
      });

      const retrieved = await getMessageById(saved.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(saved.id);
      expect(retrieved?.content).toEqual(saved.content);
    });

    it('should return null for non-existent message', async () => {
      const message = await getMessageById('non-existent-id');
      expect(message).toBeNull();
    });

    it('should return null for empty message ID', async () => {
      const message = await getMessageById('');
      expect(message).toBeNull();
    });
  });

  describe('getMessagesSince', () => {
    it('should return messages after a specific message', async () => {
      // Note: SQLite stores timestamps in seconds, so messages created within
      // the same second may have identical timestamps. This test verifies the
      // function works correctly when there's a time gap between messages.
      const msg1 = await saveMessage({ sessionId: testSessionId, role: 'user', content: 'First' });

      // Wait 1.1 seconds to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1100));

      await saveMessage({ sessionId: testSessionId, role: 'assistant', content: 'Second' });
      await saveMessage({ sessionId: testSessionId, role: 'user', content: 'Third' });

      const messages = await getMessagesSince(testSessionId, msg1.id);

      expect(messages).toHaveLength(2);
      expect(messages[0].content).toEqual([{ type: 'text', text: 'Second' }]);
      expect(messages[1].content).toEqual([{ type: 'text', text: 'Third' }]);
    });

    it('should return all messages if reference message not found', async () => {
      await saveMessage({ sessionId: testSessionId, role: 'user', content: 'First' });
      await saveMessage({ sessionId: testSessionId, role: 'assistant', content: 'Second' });

      const messages = await getMessagesSince(testSessionId, 'non-existent-id');

      expect(messages).toHaveLength(2);
    });

    it('should return empty array for empty session ID', async () => {
      const messages = await getMessagesSince('', 'some-id');
      expect(messages).toEqual([]);
    });
  });
});
