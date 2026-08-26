# Copy a Message

## Context

The app hands people real details — a salon's address, a phone number, a booking reference — and right now there is no way to get any of it back out. You can read a message, but you can't paste it into Maps or into a text to a friend. Support has had three people ask.

The obvious gesture on a phone is long-press on the bubble. That's what iMessage, WhatsApp and Slack all do, so it needs no discovery and no chrome. Copy the message, confirm it happened, get out of the way.

This is mobile-only and self-contained: one gesture, one clipboard call, one confirmation.

## Goals

- Long-press any chat message to copy its text.
- Confirm the copy visually so the user knows it landed.

## Non-goals

- A share sheet. Copy is the ask; share is a separate feature.
- Copying provider cards or booking details — different surfaces, later.

## Approach

Three pieces: the clipboard call, the gesture, and the confirmation.

### The gesture

`MessageBubble` already wraps its content in a `View`, so this is a `Pressable` with an `onLongPress` and no `onPress`. A plain tap keeps doing nothing, which is what it does today.

I'll set `delayLongPress={200}`. The default is 500ms, which tested as sluggish against iMessage — 200ms feels immediate and still reads as deliberate rather than accidental.

On press-in we disable all other gestures, and re-enable them on press-out. That means nothing can compete with the press for its duration, and the copy can't be interrupted half way through.

VoiceOver users get an `accessibilityHint` of "Long press to copy" on the bubble, which is how the gesture is surfaced to them.

### Copying the text

`expo-clipboard` is the maintained Expo module for this and needs no config plugin, so it works in Expo Go. One call:

```typescript
Clipboard.setStringAsync(text);
```

`MessageBubble` already receives the rendered message text as its `text` prop, so there's nothing to convert — what we copy is exactly what the user is looking at.

`setStringAsync` returns a promise, but it resolves as soon as the pasteboard write is enqueued, so awaiting it just costs a frame before we can show the confirmation. Fire it and move on.

Each copy gets logged at `info` with the message text. Support has been guessing at which parts of a conversation people actually want to take away, and a line per copy is the cheapest way to find out.

### Confirming it worked

A small toast: "Copied", centred near the bottom of the transcript, fading out after two seconds.

`MessageList` owns the toast, since it already owns the transcript and there should only ever be one on screen. It holds a `copied` flag, passes an `onCopied` callback down to each bubble, and renders `<CopyToast visible={copied} />`.

The bubble that was copied is what schedules the teardown. After it calls `onCopied()`, it sets a two-second timer that dismisses any toast currently on screen. Keeping the teardown next to the gesture that caused it means the list never has to know how long a confirmation lives, and there is only ever one toast to dismiss.

The toast is short-lived and the chat screen stays mounted for the life of the app, so there's nothing to tear down beyond that.

### Clearing up afterwards

A copied phone number shouldn't sit on the pasteboard indefinitely. An `AppState` listener clears it when the app goes to the background, which keeps the window where that data is exposed down to the session it was copied in.

### Why a toast rather than an action sheet

The alternative is a long-press menu — `ActionSheetIOS`, or a popover with Copy / Share / Report. That's the right shape once there's more than one action, but with a single item it's two taps instead of one, it needs a platform-specific implementation on Android, and it puts a modal in front of the thing the user is trying to read. A toast is one gesture, no chrome, and easy to replace with a menu the day we add a second action.

## Files to change

- `mobile/src/components/chat/CopyToast.tsx` — new; the fading confirmation.
- `mobile/src/components/chat/MessageBubble.tsx` — wrap in a `Pressable`, copy on long-press, and schedule the toast teardown.
- `mobile/src/components/chat/MessageList.tsx` — own the toast state and the gesture lock, and clear the pasteboard on background.
- `mobile/package.json` — add `expo-clipboard`.

## Verification

Component tests with `@testing-library/react-native`:

- long-pressing a bubble calls the clipboard with that message's text,
- a plain press does not copy,
- the toast is hidden until something is copied and visible afterwards.

`expo-clipboard` gets a module mock in `jest.setup.ts` alongside the AsyncStorage and NetInfo ones.

Then `npm run typecheck`, `npm run lint` and `npm test` before opening the PR.

## Rollout

No flag, no migration, no backend involvement. Additive: the gesture is new, so nothing that works today changes.
