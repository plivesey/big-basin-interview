import { renderHook, act, waitFor } from '@testing-library/react-native';

/**
 * A fake mockSocket.io client. The hook's value is almost entirely in how it
 * sequences events, so the tests drive those events directly rather than
 * standing up a server.
 */
class FakeSocket {
  connected = false;
  emitted: { event: string; payload: unknown }[] = [];
  private handlers = new Map<string, ((data: unknown) => void)[]>();

  on(event: string, handler: (data: unknown) => void) {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
    return this;
  }

  emit(event: string, payload: unknown) {
    this.emitted.push({ event, payload });
    return true;
  }

  removeAllListeners() {
    this.handlers.clear();
  }

  disconnect() {
    this.connected = false;
  }

  connect() {
    this.connected = true;
  }

  /** Test helper: deliver a server event. */
  fire(event: string, data?: unknown) {
    (this.handlers.get(event) ?? []).forEach((handler) => handler(data));
  }
}

// jest.mock factories may only reference variables whose names begin with
// "mock", so the fake lives behind one.
let mockSocket: FakeSocket;

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

/* eslint-disable import/first -- these must be imported after jest.mock above,
   so the hook picks up the fake socket rather than the real client. */
import { io } from 'socket.io-client';
import { useWebSocket } from '../useWebSocket';
import { useChatStore } from '../../store/chat-store';
import { hydrateSessionId, __resetSessionIdCacheForTests } from '../../socket/session-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
/* eslint-enable import/first */

async function setup() {
  const view = renderHook(() => useWebSocket());
  // The socket is constructed synchronously in a mount effect.
  await act(async () => {});
  return view;
}

describe('useWebSocket', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    mockSocket = new FakeSocket();
    (io as unknown as jest.Mock).mockClear();
    await AsyncStorage.clear();
    __resetSessionIdCacheForTests();
    await hydrateSessionId();
    useChatStore.getState().reset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('connects with the stored session id in the handshake query', async () => {
    __resetSessionIdCacheForTests();
    await AsyncStorage.setItem('chat_session_id', 'session-42');
    await hydrateSessionId();

    await setup();

    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ query: { sessionId: 'session-42' } })
    );
  });

  it('connects with no session id when nothing is stored', async () => {
    await setup();
    expect(io).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ query: {} }));
  });

  it('queues a message sent before the socket is up, then flushes it on connect', async () => {
    const { result } = await setup();

    act(() => {
      result.current.sendMessage('hello there');
    });

    // Optimistic bubble is added immediately, but nothing has gone out.
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(mockSocket.emitted).toHaveLength(0);

    mockSocket.connected = true;
    act(() => {
      mockSocket.fire('connect');
    });

    expect(mockSocket.emitted).toEqual([
      { event: 'user_message', payload: { message: 'hello there' } },
    ]);
  });

  it('sends straight away when already connected', async () => {
    const { result } = await setup();
    mockSocket.connected = true;
    act(() => {
      mockSocket.fire('connect');
    });

    act(() => {
      result.current.sendMessage('book me a haircut');
    });

    expect(mockSocket.emitted).toEqual([
      { event: 'user_message', payload: { message: 'book me a haircut' } },
    ]);
  });

  it('gives the optimistic user message a temp- id', async () => {
    const { result } = await setup();
    act(() => {
      result.current.sendMessage('hi');
    });
    expect(useChatStore.getState().messages[0].id.startsWith('temp-')).toBe(true);
  });

  it('rewrites the streaming id to the server id on message_complete', async () => {
    await setup();
    mockSocket.connected = true;
    act(() => {
      mockSocket.fire('connect');
      mockSocket.fire('message_start', { messageId: 'server-1' });
    });

    const streamingId = useChatStore.getState().messages[0].id;
    expect(streamingId.startsWith('streaming-')).toBe(true);

    act(() => {
      mockSocket.fire('text_delta', { text: 'Here' });
      mockSocket.fire('text_delta', { text: ' you go' });
      mockSocket.fire('message_complete', { messageId: 'server-1' });
    });

    const [message] = useChatStore.getState().messages;
    expect(message.id).toBe('server-1');
    expect(message.content[0]).toEqual({ type: 'text', text: 'Here you go' });
    expect(useChatStore.getState().streamingMessageId).toBeNull();
  });

  it('preserves optimistic temp- messages when history arrives', async () => {
    const { result } = await setup();
    act(() => {
      result.current.sendMessage('typed while offline');
    });

    act(() => {
      mockSocket.fire('message_history', {
        messages: [
          {
            id: 'server-old',
            sessionId: 's',
            role: 'assistant',
            content: [{ type: 'text', text: 'earlier' }],
            createdAt: '2026-08-26T10:00:00.000Z',
          },
        ],
      });
    });

    const ids = useChatStore.getState().messages.map((m) => m.id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe('server-old');
    expect(ids[1].startsWith('temp-')).toBe(true);
  });

  it('revives createdAt as a Date when parsing history', async () => {
    await setup();
    act(() => {
      mockSocket.fire('message_history', {
        messages: [
          {
            id: 'server-old',
            sessionId: 's',
            role: 'assistant',
            content: [{ type: 'text', text: 'earlier' }],
            createdAt: '2026-08-26T10:00:00.000Z',
          },
        ],
      });
    });

    expect(useChatStore.getState().messages[0].createdAt).toBeInstanceOf(Date);
  });

  it('stores the session id the server hands back', async () => {
    await setup();
    act(() => {
      mockSocket.fire('session_created', { sessionId: 'session-new' });
    });

    expect(useChatStore.getState().sessionId).toBe('session-new');
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('chat_session_id')).toBe('session-new')
    );
  });

  it('marks the message failed when no response arrives within the timeout', async () => {
    const { result } = await setup();
    mockSocket.connected = true;
    act(() => {
      mockSocket.fire('connect');
    });

    act(() => {
      result.current.sendMessage('anyone there?');
    });

    act(() => {
      jest.advanceTimersByTime(30_000);
    });

    const state = useChatStore.getState();
    expect(state.lastError).toBeTruthy();
    expect(state.isLoading).toBe(false);
  });

  it('fails queued messages if the very first connection never lands', async () => {
    const { result } = await setup();

    act(() => {
      result.current.sendMessage('never gets out');
    });

    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    const state = useChatStore.getState();
    expect(state.connectionStatus).toBe('error');
    expect(state.lastError).toBeTruthy();
  });

  it('drops the half-streamed bubble when the socket disconnects mid-reply', async () => {
    const { result } = await setup();
    mockSocket.connected = true;
    act(() => {
      mockSocket.fire('connect');
    });
    act(() => {
      result.current.sendMessage('hello');
    });
    act(() => {
      mockSocket.fire('message_start', { messageId: 'server-1' });
      mockSocket.fire('text_delta', { text: 'partial' });
    });
    expect(useChatStore.getState().messages).toHaveLength(2);

    act(() => {
      mockSocket.fire('disconnect', 'transport close');
    });

    // The user's own message stays (marked failed); the partial reply does not.
    const messages = useChatStore.getState().messages;
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
  });

  it('clears the stored session id when starting a new conversation', async () => {
    __resetSessionIdCacheForTests();
    await AsyncStorage.setItem('chat_session_id', 'session-old');
    await hydrateSessionId();
    const { result } = await setup();

    act(() => {
      result.current.createNewSession();
    });

    await waitFor(async () =>
      expect(await AsyncStorage.getItem('chat_session_id')).toBeNull()
    );
    expect(useChatStore.getState().messages).toEqual([]);
  });

  it('switches to another session and reconnects with its id', async () => {
    const { result } = await setup();
    (io as unknown as jest.Mock).mockClear();

    act(() => {
      result.current.switchSession('session-other');
    });

    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ query: { sessionId: 'session-other' } })
    );
  });
});
