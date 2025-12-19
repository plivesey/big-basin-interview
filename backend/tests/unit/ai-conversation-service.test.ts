import { describe, it, expect } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import {
  buildMessagesArray,
  AIError,
  isRetryableError,
  getRetryDelays,
  shouldAddSpacingBeforeTextBlock,
} from '../../src/services/ai-conversation-service';
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

    it('should include tool_use content blocks for tool loop', () => {
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
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me search for that' },
            { type: 'tool_use', id: 'tool-1', name: 'search', input: {} },
          ],
        },
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

    it('should handle messages with only tool_use content', () => {
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

      // tool_use blocks should be preserved for the tool loop
      expect(result).toEqual([
        {
          role: 'assistant',
          content: [{ type: 'tool_use', id: 'tool-1', name: 'search', input: {} }],
        },
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

    it('should include tool_result content blocks for tool loop', () => {
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

      // tool_result blocks should be preserved for the tool loop
      expect(result).toEqual([
        {
          role: 'user',
          content: [
            { type: 'tool_result', tool_use_id: 'tool-1', content: 'Result data' },
            { type: 'text', text: 'Here are the results' },
          ],
        },
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

  describe('shouldAddSpacingBeforeTextBlock', () => {
    describe('returns false (no spacing needed)', () => {
      it('should return false for empty accumulated text (first text block)', () => {
        expect(shouldAddSpacingBeforeTextBlock('')).toBe(false);
      });

      it('should return false when text ends with newline', () => {
        expect(shouldAddSpacingBeforeTextBlock('Hello world\n')).toBe(false);
      });

      it('should return false when text ends with multiple newlines', () => {
        expect(shouldAddSpacingBeforeTextBlock('Hello world\n\n')).toBe(false);
      });

      it('should return false when text ends with carriage return and newline', () => {
        expect(shouldAddSpacingBeforeTextBlock('Hello world\r\n')).toBe(false);
      });
    });

    describe('returns true (spacing needed)', () => {
      it('should return true when text exists and ends without newline', () => {
        expect(shouldAddSpacingBeforeTextBlock('Hello world')).toBe(true);
      });

      it('should return true when text ends with period', () => {
        expect(shouldAddSpacingBeforeTextBlock('Let me search for that.')).toBe(true);
      });

      it('should return true when text ends with question mark', () => {
        expect(shouldAddSpacingBeforeTextBlock('Would you like me to help?')).toBe(true);
      });

      it('should return true when text ends with space', () => {
        // Space at the end still needs paragraph break for readability
        expect(shouldAddSpacingBeforeTextBlock('Hello world ')).toBe(true);
      });

      it('should return true for single character', () => {
        expect(shouldAddSpacingBeforeTextBlock('a')).toBe(true);
      });
    });

    describe('real-world scenarios', () => {
      it('should handle tool call interruption scenario', () => {
        // Simulates: Claude says "Let me search" → calls search tool → says "Here are results"
        const afterFirstTextBlock = 'Let me search for salons in your area.';
        expect(shouldAddSpacingBeforeTextBlock(afterFirstTextBlock)).toBe(true);
        // After adding spacing: "Let me search for salons in your area.\n\n"
        // Then "Here are the results:" gets appended
      });

      it('should handle multiple tool calls scenario', () => {
        // Simulates: text → tool → text → tool → text
        const afterSecondTextBlock = 'Let me search for salons in your area.\n\nI found 3 providers.';
        expect(shouldAddSpacingBeforeTextBlock(afterSecondTextBlock)).toBe(true);
      });

      it('should handle model that adds its own newlines', () => {
        // If Claude already adds newlines in its response, we don\'t add more
        const textWithNewline = 'Here are your options:\n';
        expect(shouldAddSpacingBeforeTextBlock(textWithNewline)).toBe(false);
      });
    });
  });
});
