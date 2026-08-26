import Constants from 'expo-constants';

/**
 * The single definition of the backend URL.
 *
 * The web app repeats `import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'`
 * in four files (App.tsx, useWebSocket.ts, booking-store.ts, menu-store.ts,
 * SideMenu.tsx). Everything here imports this instead.
 *
 * Resolution order:
 *  1. EXPO_PUBLIC_BACKEND_URL, if set (Expo inlines EXPO_PUBLIC_* at build time).
 *  2. The dev server's own host, so a physical device on the same Wi-Fi works
 *     with no configuration.
 *  3. localhost -- correct for the iOS simulator, which shares the host's
 *     network stack. (An Android emulator would need 10.0.2.2; Android is
 *     untested here.)
 */
const hostUri =
  Constants.expoConfig?.hostUri ??
  (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
    ?.debuggerHost;

const lanHost = hostUri?.split(':')[0];

export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ??
  (lanHost ? `http://${lanHost}:3001` : 'http://localhost:3001');

/** Requests are aborted after this long. See the note in client.ts. */
export const REQUEST_TIMEOUT_MS = 10_000;
