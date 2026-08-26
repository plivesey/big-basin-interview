import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  hydrateSessionId,
  getSessionIdSync,
  setSessionIdSync,
  clearSessionIdSync,
  isSessionIdHydrated,
  __resetSessionIdCacheForTests,
} from '../session-storage';

describe('session-storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetSessionIdCacheForTests();
  });

  it('is not hydrated until hydrateSessionId resolves', async () => {
    expect(isSessionIdHydrated()).toBe(false);
    await hydrateSessionId();
    expect(isSessionIdHydrated()).toBe(true);
  });

  it('reads a previously stored id', async () => {
    await AsyncStorage.setItem('chat_session_id', 'session-abc');
    await hydrateSessionId();
    expect(getSessionIdSync()).toBe('session-abc');
  });

  it('returns null when nothing is stored', async () => {
    await hydrateSessionId();
    expect(getSessionIdSync()).toBeNull();
  });

  it('serves a newly set id synchronously and persists it', async () => {
    await hydrateSessionId();
    setSessionIdSync('session-xyz');

    // Synchronous read is the whole reason this module exists: connect() must
    // not await before constructing the socket.
    expect(getSessionIdSync()).toBe('session-xyz');
    await Promise.resolve();
    expect(await AsyncStorage.getItem('chat_session_id')).toBe('session-xyz');
  });

  it('clears the id so the server mints a new session', async () => {
    await AsyncStorage.setItem('chat_session_id', 'session-abc');
    await hydrateSessionId();
    clearSessionIdSync();
    expect(getSessionIdSync()).toBeNull();
  });

  it('treats a read before hydration as absent rather than throwing', () => {
    // The warning is the point of the branch, so keep it out of the report.
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getSessionIdSync()).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
