import { describe, it, expect } from 'vitest';
import { buildMessagesArray } from '../../src/services/ai-conversation-service';
import type { ChatMessage } from '../../src/services/message-service';

describe('ai-conversation-service', () => {
  describe('buildMessagesArray', () => {
    it('should convert simple text messages to Claude API format', () => {
      const history: ChatMessage[] = [
        {
          id: '1',
          sessionId: 'session-1',
          role: 'user',
          content: [{ type: 'text', text: 'Hello' }],
          createdAt: new Date(),
        },
        {
          id: '2',
          sessionId: 'session-1',
          role: 'assistant',
          content: [{ type: 'text', text: 'Hi there!' }],
          createdAt: new Date(),
        },
      ];

      const result = buildMessagesArray(history);

      expect(result).toEqual([
        { role: 'user', content: [{ type: 'text', text: 'Hello' }] },
        { role: 'assistant', content: [{ type: 'text', text: 'Hi there!' }] },
      ]);
    });

    it('should filter out non-text content blocks', () => {
      const history: ChatMessage[] = [
        {
          id: '1',
          sessionId: 'session-1',
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me search for that' },
            { type: 'tool_use', id: 'tool-1', name: 'search', input: {} },
          ],
          createdAt: new Date(),
        },
      ];

      const result = buildMessagesArray(history);

      expect(result).toEqual([
        { role: 'assistant', content: [{ type: 'text', text: 'Let me search for that' }] },
      ]);
    });

    it('should filter out empty text blocks', () => {
      const history: ChatMessage[] = [
        {
          id: '1',
          sessionId: 'session-1',
          role: 'user',
          content: [
            { type: 'text', text: '' },
            { type: 'text', text: 'Real message' },
          ],
          createdAt: new Date(),
        },
      ];

      const result = buildMessagesArray(history);

      expect(result).toEqual([
        { role: 'user', content: [{ type: 'text', text: 'Real message' }] },
      ]);
    });

    it('should handle empty history', () => {
      const result = buildMessagesArray([]);
      expect(result).toEqual([]);
    });

    it('should handle messages with only non-text content', () => {
      const history: ChatMessage[] = [
        {
          id: '1',
          sessionId: 'session-1',
          role: 'assistant',
          content: [
            { type: 'tool_use', id: 'tool-1', name: 'search', input: {} },
          ],
          createdAt: new Date(),
        },
      ];

      const result = buildMessagesArray(history);

      // Message should still exist but with empty content array
      expect(result).toEqual([
        { role: 'assistant', content: [] },
      ]);
    });

    it('should preserve message order', () => {
      const history: ChatMessage[] = [
        {
          id: '1',
          sessionId: 'session-1',
          role: 'user',
          content: [{ type: 'text', text: 'First' }],
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          sessionId: 'session-1',
          role: 'assistant',
          content: [{ type: 'text', text: 'Second' }],
          createdAt: new Date('2024-01-01T10:00:01Z'),
        },
        {
          id: '3',
          sessionId: 'session-1',
          role: 'user',
          content: [{ type: 'text', text: 'Third' }],
          createdAt: new Date('2024-01-01T10:00:02Z'),
        },
      ];

      const result = buildMessagesArray(history);

      expect(result[0].content).toEqual([{ type: 'text', text: 'First' }]);
      expect(result[1].content).toEqual([{ type: 'text', text: 'Second' }]);
      expect(result[2].content).toEqual([{ type: 'text', text: 'Third' }]);
    });

    it('should handle tool_result content blocks', () => {
      const history: ChatMessage[] = [
        {
          id: '1',
          sessionId: 'session-1',
          role: 'user',
          content: [
            { type: 'tool_result', tool_use_id: 'tool-1', content: 'Result data' },
            { type: 'text', text: 'Here are the results' },
          ],
          createdAt: new Date(),
        },
      ];

      const result = buildMessagesArray(history);

      // Only text content should be included
      expect(result).toEqual([
        { role: 'user', content: [{ type: 'text', text: 'Here are the results' }] },
      ]);
    });

    it('should handle multiple text blocks in a single message', () => {
      const history: ChatMessage[] = [
        {
          id: '1',
          sessionId: 'session-1',
          role: 'assistant',
          content: [
            { type: 'text', text: 'First part' },
            { type: 'text', text: 'Second part' },
          ],
          createdAt: new Date(),
        },
      ];

      const result = buildMessagesArray(history);

      expect(result).toEqual([
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'First part' },
            { type: 'text', text: 'Second part' },
          ],
        },
      ]);
    });
  });
});
