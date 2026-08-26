import { renderHook, waitFor } from '@testing-library/react-native';
import { useChatPersistence } from '../useChatPersistence';
import { persistChat } from '../../storage/chat-persistence';
import { useChatStore } from '../../store/chat-store';

describe('useChatPersistence', () => {
  beforeEach(() => {
    useChatStore.getState().reset();
  });

  it('reports hydrated once the read completes', async () => {
    const { result } = renderHook(() => useChatPersistence());
    await waitFor(() => expect(result.current.isHydrated).toBe(true));
  });

  it('restores a conversation that was on disk', async () => {
    await persistChat({
      ...useChatStore.getState(),
      sessionId: 'session-7',
      messages: [
        {
          id: 'm1',
          sessionId: 'session-7',
          role: 'user',
          content: [{ type: 'text', text: 'earlier' }],
          createdAt: new Date('2026-08-26T14:30:00.000Z'),
        },
      ],
    });

    renderHook(() => useChatPersistence());

    await waitFor(() => expect(useChatStore.getState().messages).toHaveLength(1));
    expect(useChatStore.getState().sessionId).toBe('session-7');
  });
});
