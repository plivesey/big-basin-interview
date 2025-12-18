import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore, getMessageText, parseMessage } from './chat-store';
import type { ChatMessage } from './chat-store';

describe('chat-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useChatStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useChatStore.getState();

      expect(state.sessionId).toBeNull();
      expect(state.connectionStatus).toBe('disconnected');
      expect(state.messages).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.isAiWorking).toBe(false);
    });
  });

  describe('setSessionId', () => {
    it('should update sessionId', () => {
      useChatStore.getState().setSessionId('test-session-123');

      expect(useChatStore.getState().sessionId).toBe('test-session-123');
    });
  });

  describe('setConnectionStatus', () => {
    it('should update connection status to connected', () => {
      useChatStore.getState().setConnectionStatus('connected');

      expect(useChatStore.getState().connectionStatus).toBe('connected');
    });

    it('should update connection status to connecting', () => {
      useChatStore.getState().setConnectionStatus('connecting');

      expect(useChatStore.getState().connectionStatus).toBe('connecting');
    });

    it('should update connection status to error', () => {
      useChatStore.getState().setConnectionStatus('error');

      expect(useChatStore.getState().connectionStatus).toBe('error');
    });
  });

  describe('setMessages', () => {
    it('should replace all messages', () => {
      const messages: ChatMessage[] = [
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

      useChatStore.getState().setMessages(messages);

      expect(useChatStore.getState().messages).toHaveLength(2);
      expect(useChatStore.getState().messages).toEqual(messages);
    });
  });

  describe('addMessage', () => {
    it('should add a message to the end', () => {
      const message: ChatMessage = {
        id: '1',
        sessionId: 'session-1',
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
        createdAt: new Date(),
      };

      useChatStore.getState().addMessage(message);

      expect(useChatStore.getState().messages).toHaveLength(1);
      expect(useChatStore.getState().messages[0]).toEqual(message);
    });

    it('should append to existing messages', () => {
      const message1: ChatMessage = {
        id: '1',
        sessionId: 'session-1',
        role: 'user',
        content: [{ type: 'text', text: 'First' }],
        createdAt: new Date(),
      };
      const message2: ChatMessage = {
        id: '2',
        sessionId: 'session-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'Second' }],
        createdAt: new Date(),
      };

      useChatStore.getState().addMessage(message1);
      useChatStore.getState().addMessage(message2);

      expect(useChatStore.getState().messages).toHaveLength(2);
      expect(useChatStore.getState().messages[0].id).toBe('1');
      expect(useChatStore.getState().messages[1].id).toBe('2');
    });
  });

  describe('updateMessage', () => {
    it('should update an existing message', () => {
      const message: ChatMessage = {
        id: '1',
        sessionId: 'session-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'Original' }],
        createdAt: new Date(),
      };

      useChatStore.getState().addMessage(message);
      useChatStore.getState().updateMessage('1', {
        content: [{ type: 'text', text: 'Updated' }],
      });

      const updated = useChatStore.getState().messages[0];
      expect(updated.content).toEqual([{ type: 'text', text: 'Updated' }]);
    });

    it('should not modify other messages', () => {
      const message1: ChatMessage = {
        id: '1',
        sessionId: 'session-1',
        role: 'user',
        content: [{ type: 'text', text: 'First' }],
        createdAt: new Date(),
      };
      const message2: ChatMessage = {
        id: '2',
        sessionId: 'session-1',
        role: 'assistant',
        content: [{ type: 'text', text: 'Second' }],
        createdAt: new Date(),
      };

      useChatStore.getState().addMessage(message1);
      useChatStore.getState().addMessage(message2);
      useChatStore.getState().updateMessage('2', {
        content: [{ type: 'text', text: 'Modified' }],
      });

      expect(useChatStore.getState().messages[0].content).toEqual([{ type: 'text', text: 'First' }]);
      expect(useChatStore.getState().messages[1].content).toEqual([{ type: 'text', text: 'Modified' }]);
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      const message: ChatMessage = {
        id: '1',
        sessionId: 'session-1',
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
        createdAt: new Date(),
      };

      useChatStore.getState().addMessage(message);
      useChatStore.getState().clearMessages();

      expect(useChatStore.getState().messages).toEqual([]);
    });
  });

  describe('setIsLoading', () => {
    it('should update loading state to true', () => {
      useChatStore.getState().setIsLoading(true);

      expect(useChatStore.getState().isLoading).toBe(true);
    });

    it('should update loading state to false', () => {
      useChatStore.getState().setIsLoading(true);
      useChatStore.getState().setIsLoading(false);

      expect(useChatStore.getState().isLoading).toBe(false);
    });
  });

  describe('setIsAiWorking', () => {
    it('should update AI working state to true', () => {
      useChatStore.getState().setIsAiWorking(true);

      expect(useChatStore.getState().isAiWorking).toBe(true);
    });

    it('should update AI working state to false', () => {
      useChatStore.getState().setIsAiWorking(true);
      useChatStore.getState().setIsAiWorking(false);

      expect(useChatStore.getState().isAiWorking).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Set some state
      useChatStore.getState().setSessionId('session-123');
      useChatStore.getState().setConnectionStatus('connected');
      useChatStore.getState().addMessage({
        id: '1',
        sessionId: 'session-123',
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
        createdAt: new Date(),
      });
      useChatStore.getState().setIsLoading(true);
      useChatStore.getState().setIsAiWorking(true);

      // Reset
      useChatStore.getState().reset();

      // Verify all state is reset
      const state = useChatStore.getState();
      expect(state.sessionId).toBeNull();
      expect(state.connectionStatus).toBe('disconnected');
      expect(state.messages).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.isAiWorking).toBe(false);
    });
  });
});

describe('getMessageText', () => {
  it('should extract text from a message with text content', () => {
    const message: ChatMessage = {
      id: '1',
      sessionId: 'session-1',
      role: 'user',
      content: [{ type: 'text', text: 'Hello, world!' }],
      createdAt: new Date(),
    };

    expect(getMessageText(message)).toBe('Hello, world!');
  });

  it('should join multiple text blocks with newlines', () => {
    const message: ChatMessage = {
      id: '1',
      sessionId: 'session-1',
      role: 'assistant',
      content: [
        { type: 'text', text: 'First line' },
        { type: 'text', text: 'Second line' },
      ],
      createdAt: new Date(),
    };

    expect(getMessageText(message)).toBe('First line\nSecond line');
  });

  it('should ignore non-text content blocks', () => {
    const message: ChatMessage = {
      id: '1',
      sessionId: 'session-1',
      role: 'assistant',
      content: [
        { type: 'text', text: 'Hello' },
        { type: 'tool_use', id: 'tool-1', name: 'search', input: {} },
        { type: 'text', text: 'World' },
      ],
      createdAt: new Date(),
    };

    expect(getMessageText(message)).toBe('Hello\nWorld');
  });

  it('should return empty string for message with no text content', () => {
    const message: ChatMessage = {
      id: '1',
      sessionId: 'session-1',
      role: 'assistant',
      content: [{ type: 'tool_use', id: 'tool-1', name: 'search', input: {} }],
      createdAt: new Date(),
    };

    expect(getMessageText(message)).toBe('');
  });
});

describe('parseMessage', () => {
  it('should parse raw message data with string date', () => {
    const raw = {
      id: '1',
      sessionId: 'session-1',
      role: 'user' as const,
      content: [{ type: 'text' as const, text: 'Hello' }],
      createdAt: '2024-01-15T10:30:00Z',
    };

    const parsed = parseMessage(raw);

    expect(parsed.id).toBe('1');
    expect(parsed.sessionId).toBe('session-1');
    expect(parsed.role).toBe('user');
    expect(parsed.content).toEqual([{ type: 'text', text: 'Hello' }]);
    expect(parsed.createdAt).toBeInstanceOf(Date);
    expect(parsed.createdAt.toISOString()).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should parse raw message data with ISO date string', () => {
    const dateString = new Date().toISOString();
    const raw = {
      id: '2',
      sessionId: 'session-2',
      role: 'assistant' as const,
      content: [{ type: 'text' as const, text: 'Hi' }],
      createdAt: dateString,
    };

    const parsed = parseMessage(raw);

    expect(parsed.createdAt).toBeInstanceOf(Date);
    expect(parsed.createdAt.toISOString()).toBe(dateString);
  });
});

describe('error state', () => {
  beforeEach(() => {
    useChatStore.getState().reset();
  });

  describe('initial error state', () => {
    it('should have empty failedMessageIds set', () => {
      const state = useChatStore.getState();
      expect(state.failedMessageIds).toBeInstanceOf(Set);
      expect(state.failedMessageIds.size).toBe(0);
    });

    it('should have null lastError', () => {
      expect(useChatStore.getState().lastError).toBeNull();
    });

    it('should have null lastAttemptedMessage', () => {
      expect(useChatStore.getState().lastAttemptedMessage).toBeNull();
    });
  });

  describe('markMessageFailed', () => {
    it('should add message ID to failedMessageIds', () => {
      useChatStore.getState().markMessageFailed('msg-1', 'Test error');

      expect(useChatStore.getState().failedMessageIds.has('msg-1')).toBe(true);
    });

    it('should set lastError', () => {
      useChatStore.getState().markMessageFailed('msg-1', 'Test error');

      expect(useChatStore.getState().lastError).toBe('Test error');
    });

    it('should allow marking multiple messages as failed', () => {
      useChatStore.getState().markMessageFailed('msg-1', 'Error 1');
      useChatStore.getState().markMessageFailed('msg-2', 'Error 2');

      const state = useChatStore.getState();
      expect(state.failedMessageIds.has('msg-1')).toBe(true);
      expect(state.failedMessageIds.has('msg-2')).toBe(true);
      expect(state.failedMessageIds.size).toBe(2);
    });
  });

  describe('clearMessageError', () => {
    it('should remove message ID from failedMessageIds', () => {
      useChatStore.getState().markMessageFailed('msg-1', 'Test error');
      useChatStore.getState().clearMessageError('msg-1');

      expect(useChatStore.getState().failedMessageIds.has('msg-1')).toBe(false);
    });

    it('should clear lastError when no more failed messages', () => {
      useChatStore.getState().markMessageFailed('msg-1', 'Test error');
      useChatStore.getState().clearMessageError('msg-1');

      expect(useChatStore.getState().lastError).toBeNull();
    });

    it('should keep lastError when other messages still failed', () => {
      useChatStore.getState().markMessageFailed('msg-1', 'Error 1');
      useChatStore.getState().markMessageFailed('msg-2', 'Error 2');
      useChatStore.getState().clearMessageError('msg-1');

      expect(useChatStore.getState().lastError).toBe('Error 2');
    });
  });

  describe('setLastError', () => {
    it('should set lastError', () => {
      useChatStore.getState().setLastError('New error');

      expect(useChatStore.getState().lastError).toBe('New error');
    });

    it('should clear lastError when set to null', () => {
      useChatStore.getState().setLastError('Some error');
      useChatStore.getState().setLastError(null);

      expect(useChatStore.getState().lastError).toBeNull();
    });
  });

  describe('setLastAttemptedMessage', () => {
    it('should set lastAttemptedMessage', () => {
      useChatStore.getState().setLastAttemptedMessage('Hello, world!');

      expect(useChatStore.getState().lastAttemptedMessage).toBe('Hello, world!');
    });

    it('should clear lastAttemptedMessage when set to null', () => {
      useChatStore.getState().setLastAttemptedMessage('Test message');
      useChatStore.getState().setLastAttemptedMessage(null);

      expect(useChatStore.getState().lastAttemptedMessage).toBeNull();
    });
  });

  describe('reset should clear error state', () => {
    it('should clear failedMessageIds on reset', () => {
      useChatStore.getState().markMessageFailed('msg-1', 'Test error');
      useChatStore.getState().reset();

      expect(useChatStore.getState().failedMessageIds.size).toBe(0);
    });

    it('should clear lastError on reset', () => {
      useChatStore.getState().setLastError('Test error');
      useChatStore.getState().reset();

      expect(useChatStore.getState().lastError).toBeNull();
    });

    it('should clear lastAttemptedMessage on reset', () => {
      useChatStore.getState().setLastAttemptedMessage('Test message');
      useChatStore.getState().reset();

      expect(useChatStore.getState().lastAttemptedMessage).toBeNull();
    });
  });
});
