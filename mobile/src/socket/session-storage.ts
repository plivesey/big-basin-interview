import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

/**
 * The session id, read once at launch and then served synchronously.
 *
 * This exists to keep `connect()` in useWebSocket synchronous. On the web,
 * `sessionStorage.getItem()` returns immediately, so the session id is read and
 * handed to `io(url, { query: { sessionId } })` in a single tick. AsyncStorage
 * returns a promise, and awaiting it inside `connect()` breaks three ways:
 *
 *  1. Orphaned sessions. If the socket is created before the stored id
 *     resolves, the handshake carries no sessionId and the server mints a brand
 *     new session -- the conversation and any in-flight booking workflow are
 *     silently abandoned. React's StrictMode double-effect is enough to trigger
 *     it.
 *  2. Two sockets. connect()'s re-entry guard checks `socket.connected`, not
 *     "connecting". With an await in front of `io()`, two overlapping calls both
 *     pass the guard, so you get two sockets, two session_created events,
 *     message_history applied twice, and -- because the server emits to a room
 *     keyed by session id -- interleaved duplicate text_delta output.
 *  3. Zombie sockets. A disconnect landing during the await still produces a
 *     socket afterwards, with every listener attached.
 *
 * So the root layout awaits hydrateSessionId() before rendering anything that
 * connects, and the hook reads getSessionIdSync().
 *
 * Note the deliberate behaviour change from web: sessionStorage dies with the
 * tab, AsyncStorage persists across launches. Closing the web tab starts a
 * fresh conversation; relaunching the app resumes the last one. That is correct
 * for mobile and matches the Recent list, but it is a real divergence.
 */

const SESSION_STORAGE_KEY = 'chat_session_id';

let cache: string | null | undefined;

export async function hydrateSessionId(): Promise<void> {
  try {
    cache = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  } catch (error) {
    logger.warn('Failed to read stored session id', { error: String(error) });
    cache = null;
  }
}

export function isSessionIdHydrated(): boolean {
  return cache !== undefined;
}

export function getSessionIdSync(): string | null {
  if (cache === undefined) {
    logger.warn('Session id read before hydration; treating as absent');
    return null;
  }
  return cache;
}

/** Writes through to disk, fire and forget -- same as the web's storeSessionId. */
export function setSessionIdSync(sessionId: string): void {
  cache = sessionId;
  AsyncStorage.setItem(SESSION_STORAGE_KEY, sessionId).catch((error) => {
    logger.warn('Failed to persist session id', { error: String(error) });
  });
}

export function clearSessionIdSync(): void {
  cache = null;
  AsyncStorage.removeItem(SESSION_STORAGE_KEY).catch((error) => {
    logger.warn('Failed to clear session id', { error: String(error) });
  });
}

/** Test-only: reset the module-level cache between cases. */
export function __resetSessionIdCacheForTests(): void {
  cache = undefined;
}
