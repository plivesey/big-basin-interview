import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '@asba/shared-types';
import type { ChatState } from '../../store/chat-store';
import { persistChat, loadPersistedChat, clearPersistedChat } from '../chat-persistence';

function makeMessage(id: string): ChatMessage {
  return {
    id,
    sessionId: 'session-1',
    role: 'user',
    content: [{ type: 'text', text: `message ${id}` }],
    createdAt: new Date('2026-08-26T14:30:00.000Z'),
  };
}

function makeState(overrides: Partial<ChatState> = {}): ChatState {
  return {
    sessionId: 'session-1',
    messages: [],
    failedMessageIds: new Set<string>(),
    ...overrides,
  } as ChatState;
}

describe('chat-persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips messages through storage', async () => {
    await persistChat(makeState({ messages: [makeMessage('m1'), makeMessage('m2')] }));

    const loaded = await loadPersistedChat();

    expect(loaded?.messages.map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  it('keeps the session id', async () => {
    await persistChat(makeState({ sessionId: 'session-9' }));
    expect((await loadPersistedChat())?.sessionId).toBe('session-9');
  });

  it('returns null when nothing is stored', async () => {
    expect(await loadPersistedChat()).toBeNull();
  });

  it('returns null on corrupt JSON rather than throwing', async () => {
    await AsyncStorage.setItem('chat_history', '{not json');
    expect(await loadPersistedChat()).toBeNull();
  });

  it('clears the stored conversation', async () => {
    await persistChat(makeState({ messages: [makeMessage('m1')] }));
    await clearPersistedChat();
    expect(await loadPersistedChat()).toBeNull();
  });
});
