import { describe, it, expect } from 'vitest';
import { hasDisplayableContent } from '../../src/websocket/chat-handler';
import type { ChatMessage } from '@asba/shared-types';

describe('chat-handler', () => {
  describe('hasDisplayableContent', () => {
    const createMessage = (content: ChatMessage['content']): ChatMessage => ({
      id: 'test-id',
      sessionId: 'test-session',
      role: 'user',
      content,
      createdAt: new Date(),
    });

    it('should return true for message with text content', () => {
      const message = createMessage([{ type: 'text', text: 'Hello, world!' }]);
      expect(hasDisplayableContent(message)).toBe(true);
    });

    it('should return true for message with mixed content including text', () => {
      const message = createMessage([
        { type: 'tool_use', id: 'tool-1', name: 'search', input: {} },
        { type: 'text', text: 'Here are the results' },
      ]);
      expect(hasDisplayableContent(message)).toBe(true);
    });

    it('should return false for message with only system_notification content', () => {
      const message = createMessage([
        { type: 'system_notification', text: 'Booking confirmed for user' },
      ]);
      expect(hasDisplayableContent(message)).toBe(false);
    });

    it('should return false for message with only tool_use content', () => {
      const message = createMessage([
        { type: 'tool_use', id: 'tool-1', name: 'search_providers', input: { query: 'salon' } },
      ]);
      expect(hasDisplayableContent(message)).toBe(false);
    });

    it('should return false for message with only tool_result content', () => {
      const message = createMessage([
        { type: 'tool_result', tool_use_id: 'tool-1', content: '{"success": true}' },
      ]);
      expect(hasDisplayableContent(message)).toBe(false);
    });

    it('should return false for message with mixed non-text content', () => {
      const message = createMessage([
        { type: 'system_notification', text: 'Internal notification' },
        { type: 'tool_use', id: 'tool-1', name: 'search', input: {} },
      ]);
      expect(hasDisplayableContent(message)).toBe(false);
    });

    it('should return false for message with empty content array', () => {
      const message = createMessage([]);
      expect(hasDisplayableContent(message)).toBe(false);
    });

    it('should return true for assistant message with text', () => {
      const message: ChatMessage = {
        id: 'test-id',
        sessionId: 'test-session',
        role: 'assistant',
        content: [{ type: 'text', text: 'I found some great options for you!' }],
        createdAt: new Date(),
      };
      expect(hasDisplayableContent(message)).toBe(true);
    });
  });
});
