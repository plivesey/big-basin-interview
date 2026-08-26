# Mobile App (Scout for iOS)

React Native port of the web client in `frontend/`. Same backend, same Socket.io protocol, same design tokens — a phone-shaped presentation of the same product.

Read `documentation/features/mobile-app.md` for the architecture write-up. This file is the working reference.

---

## Running it

```bash
# Terminal 1 — backend (port 3001)
cd backend && npm run dev

# Terminal 2 — mobile
cd mobile && npx expo start   # press i for the iOS simulator
```

The iOS simulator shares the host's network stack, so `http://localhost:3001` resolves with no configuration. A physical device needs `EXPO_PUBLIC_BACKEND_URL` set to the machine's LAN IP; `src/api/config.ts` derives it from the dev-server host automatically in most cases.

**Node version matters.** Expo SDK 57 targets Node LTS. `mobile/.node-version` pins 24.14.1; run `fnm use` in this directory first. The repo's system Node is 25, which is not an LTS and breaks `@expo/cli` intermittently.

After changing `metro.config.js`, `global.css`, `postcss.config.mjs`, or anything under `packages/shared-types`, restart with `npx expo start --clear`. Metro's caching does not reliably invalidate on those.

---

## Scripts

```bash
npm start          # expo start
npm run ios        # expo start --ios
npm run typecheck  # tsc --noEmit
npm run lint       # expo lint
npm test           # jest
```

---

## Layout

```
app/                      expo-router routes
  _layout.tsx             providers + splash gate; holds the splash until the session id hydrates
  index.tsx               ChatScreen — the only real screen; hosts the sheet, drawer and route host
  provider/[id].tsx       booking flow, presented as a modal route (details → confirmation → success)
src/
  api/                    config.ts (the one BACKEND_URL) + client.ts + one module per resource
  socket/                 session-storage.ts (the sync session-id cache), events.ts
  hooks/                  useWebSocket.ts
  store/                  chat-store, booking-store, panel-store, menu-store (ports of frontend/src/store)
  components/             chat/ providers/ booking/ menu/ ui/
  theme/                  classes.ts (the RN form of index.css), tokens.ts, icons.tsx
  utils/                  datetime.ts, logger.ts, error-messages.ts
scripts/                  dev-scripted-server.js, seed-dev-session.js — see "Running without an API key"
```

---

## Things that will bite you

**The session id must be read synchronously.** `useWebSocket.connect()` passes the stored session id into `io(url, { query: { sessionId } })` in one tick. AsyncStorage is async, so `src/socket/session-storage.ts` hydrates once at launch (behind the splash) and serves a cached value synchronously afterwards. Awaiting inside `connect()` orphans sessions, creates duplicate sockets, and leaves zombie sockets behind — the file's header comment spells out all three.

**`AppState` handling is not optional.** socket.io's `reconnectionAttempts: 5` is terminal: once exhausted the manager never retries. On a phone that happens routinely, so the app must call `socket.connect()` explicitly on foreground or it stays dead until force-quit. The same effect also clears the pending-message timeout on background, or a message sent seconds before backgrounding trips the 30s `AI_TIMEOUT` while the assistant is still replying.

**`Text` does not inherit styling.** RN `Text` ignores `color`, `fontSize`, `fontWeight` and `lineHeight` set on an ancestor `View`. That is why every entry in `src/theme/classes.ts` is a `{ container, text }` pair — see the header comment there.

**Slot times have no timezone offset.** The backend emits `"2026-08-26T09:30:00"` — naive local, no `Z` — and accepts exactly that shape back. Never call `new Date()` on a slot string. `src/utils/datetime.ts` parses them explicitly; `confirmBooking` passes `selectedSlot.start` through verbatim.

**`flex-1` inside a shrink-to-fit row collapses.** `flex-1` sets `flex-basis: 0`, so in a row whose parent has no definite width the column measures zero and its text disappears. Give the container a width (`w-[86%]`) rather than a max-width.

**NativeWind needs PostCSS.** Tailwind v4 runs as a PostCSS plugin; without `postcss.config.mjs` the app renders completely unstyled with no error at all.

---

## Running without an Anthropic API key

`scripts/dev-scripted-server.js` speaks the same socket protocol as the real server and proxies every REST call to it, so provider search, availability and bookings are real. It replaces only the AI.

```bash
# 1. create a session + workflow row (uses the backend's Node, which built better-sqlite3)
cd mobile && node scripts/seed-dev-session.js

# 2. start it with the printed ids
DEV_SESSION_ID=... DEV_WORKFLOW_ID=... node scripts/dev-scripted-server.js

# 3. point the app at it
EXPO_PUBLIC_BACKEND_URL=http://localhost:3002 npx expo start
```

---

## Testing

`jest-expo` + `@testing-library/react-native`. Assert behaviour and accessibility labels, never styles — NativeWind compiles classNames under Jest but produces no CSS, so style assertions are meaningless.

`src/hooks/__tests__/useWebSocket.test.tsx` injects a fake socket through `jest.mock('socket.io-client')` and drives server events directly. That is where the queue, streaming-id rewrite, timeout and session-switching behaviour are covered.

---

## Known gaps

- **iOS only.** No Android SDK on the development machine, so Android is untested. Shadows, keyboard behaviour and SVG handling all differ there.
- **Google Calendar shows status and disconnect only.** Connecting needs the backend's OAuth callback to redirect to a mobile scheme, which is a backend change. Connect once from the web app and it applies here — the backend is single-user.
- **Nothing is persisted except the session id.** Chat history comes from the server on every connect.
