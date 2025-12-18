import { describe, it, expect } from 'vitest';
import { ERROR_MESSAGES, getUserFriendlyError } from './error-messages';

describe('ERROR_MESSAGES', () => {
  describe('constants', () => {
    it('should have CONNECTION_LOST message', () => {
      expect(ERROR_MESSAGES.CONNECTION_LOST).toBeDefined();
      expect(typeof ERROR_MESSAGES.CONNECTION_LOST).toBe('string');
    });

    it('should have CONNECTION_FAILED message', () => {
      expect(ERROR_MESSAGES.CONNECTION_FAILED).toBeDefined();
      expect(typeof ERROR_MESSAGES.CONNECTION_FAILED).toBe('string');
    });

    it('should have AI_REQUEST_FAILED message', () => {
      expect(ERROR_MESSAGES.AI_REQUEST_FAILED).toBeDefined();
      expect(typeof ERROR_MESSAGES.AI_REQUEST_FAILED).toBe('string');
    });

    it('should have AI_TIMEOUT message', () => {
      expect(ERROR_MESSAGES.AI_TIMEOUT).toBeDefined();
      expect(typeof ERROR_MESSAGES.AI_TIMEOUT).toBe('string');
    });

    it('should have MESSAGE_SEND_FAILED message', () => {
      expect(ERROR_MESSAGES.MESSAGE_SEND_FAILED).toBeDefined();
      expect(typeof ERROR_MESSAGES.MESSAGE_SEND_FAILED).toBe('string');
    });

    it('should have BOOKING_FAILED message', () => {
      expect(ERROR_MESSAGES.BOOKING_FAILED).toBeDefined();
      expect(typeof ERROR_MESSAGES.BOOKING_FAILED).toBe('string');
    });

    it('should have PROVIDER_LOAD_FAILED message', () => {
      expect(ERROR_MESSAGES.PROVIDER_LOAD_FAILED).toBeDefined();
      expect(typeof ERROR_MESSAGES.PROVIDER_LOAD_FAILED).toBe('string');
    });

    it('should have AVAILABILITY_LOAD_FAILED message', () => {
      expect(ERROR_MESSAGES.AVAILABILITY_LOAD_FAILED).toBeDefined();
      expect(typeof ERROR_MESSAGES.AVAILABILITY_LOAD_FAILED).toBe('string');
    });

    it('should have CALENDAR_UNAVAILABLE message', () => {
      expect(ERROR_MESSAGES.CALENDAR_UNAVAILABLE).toBeDefined();
      expect(typeof ERROR_MESSAGES.CALENDAR_UNAVAILABLE).toBe('string');
    });

    it('should have CALENDAR_ADD_FAILED message', () => {
      expect(ERROR_MESSAGES.CALENDAR_ADD_FAILED).toBeDefined();
      expect(typeof ERROR_MESSAGES.CALENDAR_ADD_FAILED).toBe('string');
    });

    it('should have SOMETHING_WENT_WRONG message', () => {
      expect(ERROR_MESSAGES.SOMETHING_WENT_WRONG).toBeDefined();
      expect(typeof ERROR_MESSAGES.SOMETHING_WENT_WRONG).toBe('string');
    });

    it('should have TRY_AGAIN_LATER message', () => {
      expect(ERROR_MESSAGES.TRY_AGAIN_LATER).toBeDefined();
      expect(typeof ERROR_MESSAGES.TRY_AGAIN_LATER).toBe('string');
    });
  });

  describe('message content', () => {
    it('should not contain technical terms like HTTP', () => {
      Object.values(ERROR_MESSAGES).forEach((message) => {
        expect(message.toLowerCase()).not.toContain('http');
        expect(message.toLowerCase()).not.toContain('error code');
        expect(message.toLowerCase()).not.toContain('status code');
      });
    });

    it('should not contain emojis', () => {
      const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u;
      Object.values(ERROR_MESSAGES).forEach((message) => {
        expect(message).not.toMatch(emojiRegex);
      });
    });

    it('should be non-empty strings', () => {
      Object.values(ERROR_MESSAGES).forEach((message) => {
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('getUserFriendlyError', () => {
  it('should return default message for unknown error', () => {
    const result = getUserFriendlyError(new Error('Unknown error'));
    expect(result).toBe(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  });

  it('should return specified fallback message', () => {
    const result = getUserFriendlyError(new Error('Network issue'), 'CONNECTION_FAILED');
    expect(result).toBe(ERROR_MESSAGES.CONNECTION_FAILED);
  });

  it('should handle null error', () => {
    const result = getUserFriendlyError(null);
    expect(result).toBe(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  });

  it('should handle undefined error', () => {
    const result = getUserFriendlyError(undefined);
    expect(result).toBe(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  });

  it('should handle string error', () => {
    const result = getUserFriendlyError('Some error string');
    expect(result).toBe(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  });
});
