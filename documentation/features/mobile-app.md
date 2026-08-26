# Mobile App

## Overview

`mobile/` is a React Native client for the same product the web app in `frontend/` serves. It talks to the same Express backend on port 3001 over the same REST endpoints and the same Socket.io protocol, and it renders the same design tokens. No backend change was required to build it.

The working reference for anyone editing it is `mobile/CLAUDE.md`. This document explains the decisions.

## Stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK 57, React Native 0.86, React 19 |
| Navigation | expo-router |
| Styling | NativeWind v5 + Tailwind CSS v4 |
| State | Zustand — the same four stores as the web app |
| Transport | socket.io-client 4.8 + `fetch` behind a small API client |
| Provider sheet | @gorhom/bottom-sheet 5 on Reanimated 4 |
| Tests | jest-expo + @testing-library/react-native |

Two version pairings are load-bearing. NativeWind v4 does not work with Metro 0.84 (SDK 57) — it fails with `Cannot read properties of undefined (reading 'transformFile')` — so the app uses the v5 preview, which is also what the production `bigb/native` app runs. And `react-native-css`, which NativeWind v5 sits on, targets lightningcss 1.30; 1.31 changed the visitor API, so `package.json` pins it with an `overrides` entry.

## What the phone does differently

The web app is a single screen 936px wide: chat in the middle, a provider panel that animates in on the right, a modal portal for booking, and a drawer on the left. Three of those four have no phone equivalent.

**Providers become a bottom sheet.** `display_providers` raises a detented sheet over the chat rather than a side panel. Index 0 is a peek detent that does the job of the web's `PanelToggleButton`: closing collapses rather than dismisses, so the list can be pulled back up. Only `clearProviders()` — which fires when a booking completes — actually dismisses it.

A pushed route was the alternative and was rejected. The server re-emits `display_providers` at arbitrary times: mid-stream while the assistant is talking, and again unprompted on reconnect when a session has an active workflow (`backend/src/websocket/chat-handler.ts`). Pushing a route from a socket callback double-pushes on reconnect and desynchronises hardware-back from `panel-store.isProviderPanelOpen`.

**Provider detail becomes a modal route.** `app/provider/[id].tsx` with `presentation: 'modal'`, which brings swipe-to-dismiss and hardware back for free. The three-view state machine is unchanged — still a switch on `booking-store.modalView`, still `details → confirmation → success`, and `success` is still terminal.

Because `openProviderModal()` is called both by a card tap and by the server's `open_provider_detail` event, neither of which can navigate, `BookingRouteHost` watches the store and drives the router. The store is the source of truth and the router follows. It uses `replace` rather than `push` when already on a provider route, since the assistant can re-select while the sheet is open.

**The side menu is a hand-rolled slide-over**, not `expo-router/drawer`. There is one screen behind it, and a Drawer navigator's edge-swipe gesture competes with both the provider sheet's pan and iOS interactive-back.

**The conflict tooltip becomes a banner.** The web draws it with `.time-slot-conflict::after` on hover. Touch has no hover, so selecting a conflicted slot surfaces a persistent banner under the grid instead.

## The session-id ordering problem

This is the one genuinely subtle part of the port.

On the web, `sessionStorage.getItem()` is synchronous, so `useWebSocket.connect()` reads the stored session id and hands it to `io(url, { query: { sessionId } })` in a single tick. AsyncStorage returns a promise. Awaiting it inside `connect()` breaks three ways:

1. **Orphaned sessions.** Construct the socket before the id resolves and the handshake carries no `sessionId`, so `getOrCreateSession(undefined)` mints a brand-new session and the conversation plus any in-flight workflow are silently abandoned. React's StrictMode double-effect is enough to trigger it.
2. **Duplicate sockets.** `connect()`'s re-entry guard is `if (socketRef.current?.connected) return` — it checks *connected*, not *connecting*. With an `await` in front of `io()`, two overlapping calls both pass it, producing two sockets, two `session_created` events, history applied twice, and interleaved duplicate `text_delta` output because the server emits to a room keyed by session id.
3. **Zombie sockets.** An unmount landing during the await still produces a connected socket afterwards, listeners and all.

The fix is `src/socket/session-storage.ts`: hydrate once at launch behind the splash screen, then serve the value synchronously. The rest of the hook ports unchanged, and a generation counter guards against stale async continuations.

This does change one behaviour deliberately. `sessionStorage` dies with the browser tab; AsyncStorage persists across launches. Closing the web tab starts a fresh conversation, whereas relaunching the app resumes the last one — which is right for mobile and consistent with the Recent list, but it is a real divergence.

## Reconnection

socket.io's `reconnectionAttempts: 5` is **terminal**. Once the manager exhausts five attempts it gives up permanently and never retries on its own. On a phone that happens routinely — a lift, a tunnel, a lock screen — so the app calls `socket.connect()` explicitly when it comes back to the foreground and when the network returns. Without that, the app is permanently disconnected until it is force-quit.

The same `AppState` effect clears the pending-message timeout on background and re-arms it with the remaining budget on resume. Otherwise a message sent seconds before backgrounding fires the 30-second `AI_TIMEOUT`, marks the user's message failed, and deletes the in-flight bubble while the assistant is still replying.

The socket is deliberately *not* disconnected on background: iOS keeps it alive for tens of seconds and a reconnect costs a full `message_history` replay.

## Time handling

The backend emits slot times as naive local datetimes with no offset — `toLocalISOString()` in `backend/src/utils/date-utils.ts` is literally `${date}T${time}:00` — and `POST /api/bookings` accepts that same shape back.

The web app gets away with `new Date(slot.start).toLocaleTimeString()` because V8 parses a naive datetime as local time. The mobile app does not copy that. Hermes is a different engine with a different `Intl` build, and more importantly a device in a different timezone from the server would silently shift every displayed time by hours with no error anywhere. `src/utils/datetime.ts` parses slot strings with an explicit regex and formats them by hand; `confirmBooking` passes `selectedSlot.start` through verbatim.

`Date` is still used where the value genuinely is an instant — message timestamps and session dates.

## Web bugs fixed in the port

- **`workflowId` was optional on the client and required on the server.** `frontend/src/store/booking-store.ts:307` sends `workflowId: workflowId ?? undefined`, but `createBookingSchema` requires a UUID with no default, so a booking opened without a workflow 400s every time. The mobile store fails fast with a user-facing message instead. The same one-line fix applies to the web file.
- **`RatingStars` used a hardcoded SVG gradient id**, so two instances on a page collided. The mobile version draws the half star by clipping a full one, which removes the bug class rather than working around it — duplicate ids are worse in react-native-svg, where Android can fail to render the shape at all.
- **`BACKEND_URL` was defined in four files** with no shared client, no timeouts and no shared error handling. On mobile that is not a tidiness issue: a `fetch` on a flaky connection can hang indefinitely without rejecting, leaving a loading flag stuck true and the user staring at a spinner. `src/api/client.ts` aborts every request after 10 seconds.

## Not built

- **Android.** No SDK on the development machine, so it is untested and should not be claimed.
- **Google Calendar connect.** Status and disconnect work. Connecting needs `GET /auth/google/callback` to redirect to a mobile scheme instead of `FRONTEND_URL`, which is a backend change; Google also rejects custom-scheme redirect URIs for the Web OAuth client type this project uses, so the redirect has to stay server-side. Since the backend is single-user, connecting once from the web app makes the mobile app report connected and start annotating slots with calendar conflicts.
- **Offline persistence.** Nothing is stored but the session id.

## Related files

- `mobile/CLAUDE.md` — the working reference
- `mobile/src/socket/session-storage.ts` — the hydration contract
- `mobile/src/hooks/useWebSocket.ts` — the client state machine
- `mobile/src/theme/classes.ts` — the RN form of `frontend/src/index.css`
- `mobile/scripts/dev-scripted-server.js` — driving the app without an Anthropic key
