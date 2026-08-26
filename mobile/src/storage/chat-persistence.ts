import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '@asba/shared-types';
import type { ChatState } from '../store/chat-store';
import { logger } from '../utils/logger';

const STORAGE_VERSION = 1;

// One key keeps the migration story simple -- we only ever render one
// conversation at a time, so scoping the key per session would just leave
// orphaned blobs on disk that nothing ever cleans up.
const CHAT_STORAGE_KEY = 'chat_history';

export interface PersistedChat {
  version: number;
  sessionId: string | null;
  messages: ChatMessage[];
  failedMessageIds: Set<string>;
}

/**
 * Write the current chat state to disk.
 *
 * The store's state is already plain JSON, so this is a stringify on the way
 * out and a parse on the way back -- no custom serializer to keep in sync with
 * ChatMessage as it evolves.
 */
export async function persistChat(state: ChatState): Promise<void> {
  try {
    const payload: PersistedChat = {
      version: STORAGE_VERSION,
      sessionId: state.sessionId,
      // The whole array. Slicing it here would mean the oldest messages
      // silently vanish out of a conversation the user can still scroll to.
      messages: state.messages,
      failedMessageIds: state.failedMessageIds,
    };

    await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Persistence is best effort; a failed write should never break the chat.
    logger.warn('Failed to persist chat', { error: String(error) });
  }
}

export async function loadPersistedChat(): Promise<PersistedChat | null> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedChat;

    // Stamp the version we read so a future migration has something to switch
    // on.
    logger.debug('Loaded persisted chat', { version: parsed.version });

    // error level on purpose: hydration is the number one thing support asks
    // about, and error is the only level that survives our production log
    // filter.
    logger.error('Hydrated chat from disk', { count: parsed.messages.length });

    return parsed;
  } catch (error) {
    logger.warn('Failed to load persisted chat', { error: String(error) });
    return null;
  }
}

export async function clearPersistedChat(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
  } catch (error) {
    logger.warn('Failed to clear persisted chat', { error: String(error) });
  }
}
