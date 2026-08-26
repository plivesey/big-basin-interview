import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useChatStore } from '../store/chat-store';
import { loadPersistedChat, persistChat } from '../storage/chat-persistence';
import { logger } from '../utils/logger';

/**
 * Keeps the chat store and disk in step.
 *
 * Hydrates once on mount so the conversation paints from disk instead of a
 * spinner, mirrors every subsequent change back to storage, and flushes once
 * more when the app goes to the background.
 */
export function useChatPersistence(): { isHydrated: boolean } {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    void loadPersistedChat().then((persisted) => {
      if (persisted) {
        logger.debug('Restoring conversation', { count: persisted.messages.length });
        useChatStore.getState().hydrate(persisted);
      }
      setIsHydrated(true);
    });
  }, []);

  // Mirror every store change to disk. Zustand's subscribe fires synchronously
  // after each set(), so this is the one place guaranteed to see every update
  // -- no debounce needed, AsyncStorage writes are already off the JS thread.
  useEffect(() => {
    const unsubscribe = useChatStore.subscribe((state) => {
      void persistChat(state);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleChange = (next: AppStateStatus) => {
      if (next !== 'background') {
        return;
      }
      // Fire and forget: iOS gives us the background event before suspending,
      // so the write lands well before the process is frozen.
      void persistChat(useChatStore.getState());
    };

    const subscription = AppState.addEventListener('change', handleChange);
    return () => subscription.remove();
  }, []);

  return { isHydrated };
}
