import { describe, it, expect } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { buildMessagesArray, AIError, isRetryableError, getRetryDelays } from '../../src/services/ai-conversation-service';
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

  describe('AIError', () => {
    it('should create error with message and code', () => {
      const error = new AIError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('AIError');
      expect(error.retryable).toBe(false);
      expect(error.statusCode).toBeUndefined();
    });

    it('should create error with retryable flag', () => {
      const error = new AIError('Timeout', 'TIMEOUT', true);

      expect(error.retryable).toBe(true);
    });

    it('should create error with status code', () => {
      const error = new AIError('Server error', 'SERVER_ERROR', true, 500);

      expect(error.statusCode).toBe(500);
    });

    it('should be an instance of Error', () => {
      const error = new AIError('Test', 'TEST');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof AIError).toBe(true);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for TIMEOUT AIError', () => {
      const error = new AIError('Timeout', 'TIMEOUT', true);

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for non-TIMEOUT AIError', () => {
      const error = new AIError('Auth failed', 'AUTH_ERROR', false);

      expect(isRetryableError(error)).toBe(false);
    });

    it('should return true for 5xx Anthropic API errors', () => {
      // Create mock errors that mimic Anthropic.APIError structure
      const createMockAPIError = (status: number) => {
        const error = new Error(`API Error ${status}`) as Error & { status: number };
        error.status = status;
        Object.setPrototypeOf(error, Anthropic.APIError.prototype);
        return error;
      };

      expect(isRetryableError(createMockAPIError(500))).toBe(true);
      expect(isRetryableError(createMockAPIError(502))).toBe(true);
      expect(isRetryableError(createMockAPIError(503))).toBe(true);
    });

    it('should return true for 429 rate limit errors', () => {
      const error = new Error('Rate limited') as Error & { status: number };
      error.status = 429;
      Object.setPrototypeOf(error, Anthropic.APIError.prototype);

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for 4xx client errors (except 429)', () => {
      const createMockAPIError = (status: number) => {
        const error = new Error(`API Error ${status}`) as Error & { status: number };
        error.status = status;
        Object.setPrototypeOf(error, Anthropic.APIError.prototype);
        return error;
      };

      expect(isRetryableError(createMockAPIError(400))).toBe(false);
      expect(isRetryableError(createMockAPIError(401))).toBe(false);
      expect(isRetryableError(createMockAPIError(403))).toBe(false);
      expect(isRetryableError(createMockAPIError(404))).toBe(false);
    });

    it('should return true for network errors', () => {
      const econnreset = new Error('ECONNRESET');
      const econnrefused = new Error('ECONNREFUSED');
      const etimedout = new Error('ETIMEDOUT');
      const networkError = new Error('Network error occurred');

      expect(isRetryableError(econnreset)).toBe(true);
      expect(isRetryableError(econnrefused)).toBe(true);
      expect(isRetryableError(etimedout)).toBe(true);
      expect(isRetryableError(networkError)).toBe(true);
    });

    it('should return false for generic errors', () => {
      const error = new Error('Something went wrong');

      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for non-Error values', () => {
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
      expect(isRetryableError('string error')).toBe(false);
      expect(isRetryableError(42)).toBe(false);
      expect(isRetryableError({})).toBe(false);
    });
  });

  describe('getRetryDelays', () => {
    it('should return correct exponential delays for 5 retries', () => {
      const delays = getRetryDelays(5);

      expect(delays).toEqual([1000, 2000, 4000, 8000, 16000]);
    });

    it('should return correct delays for 3 retries', () => {
      const delays = getRetryDelays(3);

      expect(delays).toEqual([1000, 2000, 4000]);
    });

    it('should return single delay for 1 retry', () => {
      const delays = getRetryDelays(1);

      expect(delays).toEqual([1000]);
    });

    it('should return empty array for 0 retries', () => {
      const delays = getRetryDelays(0);

      expect(delays).toEqual([]);
    });

    it('should use exponential backoff formula (1000 * 2^n)', () => {
      const delays = getRetryDelays(6);

      expect(delays[0]).toBe(1000 * Math.pow(2, 0)); // 1000
      expect(delays[1]).toBe(1000 * Math.pow(2, 1)); // 2000
      expect(delays[2]).toBe(1000 * Math.pow(2, 2)); // 4000
      expect(delays[3]).toBe(1000 * Math.pow(2, 3)); // 8000
      expect(delays[4]).toBe(1000 * Math.pow(2, 4)); // 16000
      expect(delays[5]).toBe(1000 * Math.pow(2, 5)); // 32000
    });
  });
});
