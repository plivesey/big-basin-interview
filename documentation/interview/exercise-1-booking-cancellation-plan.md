# Booking Cancellation + Chat Acknowledgment

## Context

Right now a user can search for a provider, pick a slot, and confirm a booking, but once it's confirmed there's no way to back out. Support says this is the top inbound request, and the product team wants cancelling to feel as conversational as booking already does: when the user cancels, the assistant should acknowledge it in the chat in natural language rather than the UI just silently flipping a status.

I looked at the schema first. The `bookings` table in `backend/src/db/schema.ts` already has a `status` column that carries `'pending' | 'confirmed' | 'cancelled'`, so cancellation is a state transition on an existing row, not a delete and not a migration. The piece that needs building is the endpoint that performs the transition plus the chat acknowledgment that mirrors what booking confirmation does today.

This is a backend-only change. The frontend "Cancel" button is a separate follow-up that will call the new endpoint, so nothing user-facing ships here until that lands.

## Goals

- Add a REST endpoint that cancels a confirmed booking.
- Flip the booking's `status` to `'cancelled'` and persist it.
- Stream a warm assistant acknowledgment back into the user's chat session, matching the existing confirmation experience.

## Non-goals

- Cancellation policies, fees, or time-window rules — out of scope for the MVP.
- Telling the external provider system about the cancellation — `external-booking-service` doesn't expose a cancel call yet; tracked separately.
- The frontend cancel button — follow-up PR.

## How confirmation works today

The acknowledgment side of this feature should follow what already happens on confirmation, so I read that path first.

When a booking is created, the route in `backend/src/routes/bookings.ts` calls `emitBookingConfirmedEvent(...)`, which resolves the workflow + provider and emits a `booking:confirmed` domain event. The handler `handleBookingConfirmation` in `backend/src/websocket/event-handlers.ts` does the actual chat work:

1. saves a hidden `system_notification` message so Claude has context for what just happened,
2. emits `message_start` with a fresh `messageId`,
3. calls `sendAIMessage(sessionId, '', { onTextDelta })` and streams each delta as a `text_delta`,
4. saves the assistant response and emits `message_complete`.

That sequence is exactly the shape we want for cancellation — a hidden notification followed by a streamed acknowledgment. We'll reproduce it for the cancel flow.

## Approach

### Endpoint

Add `POST /api/bookings/:id/cancel` to the existing bookings router in `backend/src/routes/bookings.ts`. I'm using `POST` to a `/cancel` sub-resource rather than `DELETE` because we're recording a state transition and keeping the row for history/analytics, not hard-deleting it.

The body carries `workflowId` so we can find the chat session the cancellation belongs to — same way `POST /api/bookings` already takes a `workflowId` to tie a booking back to its conversation.

```
POST /api/bookings/:id/cancel
{ "workflowId": "..." }
```

Response (200):

```json
{ "success": true, "data": { "booking": { /* updated booking */ } } }
```

The route validates `:id` with the existing `bookingIdSchema` and the body with a new `cancelBookingSchema`, calls `cancelBooking(id)`, fires the chat notification, and returns the updated booking.

### Service layer

Add `cancelBooking(id)` to `backend/src/services/booking-service.ts`. It looks the booking up by id, and if it exists sets `status: 'cancelled'` and bumps `updatedAt`, then returns the updated row. If the booking doesn't exist it returns `null` — consistent with `getBookingById`, which already signals "not found" by returning `null`.

```typescript
export async function cancelBooking(id: string): Promise<Booking | null> {
  const booking = await getBookingById(id);
  if (!booking) {
    return null;
  }

  const now = new Date();
  await db
    .update(bookings)
    .set({ status: 'cancelled', updatedAt: now })
    .where(eq(bookings.id, id));

  return { ...booking, status: 'cancelled', updatedAt: now };
}
```

### Chat acknowledgment

This is the interesting part. The confirmation path routes its acknowledgment through the event bus, but for cancellation we can take a more direct route and keep the notification logic right next to the cancellation logic in the route, where it's easy to read. Threading a whole new event type through the event map and the websocket handler just to send one message is more indirection than this needs.

The Socket.io server is already created during startup, so we can expose it through a small singleton holder and let the cancel route grab the live server and emit to the session directly. Add `backend/src/websocket/socket-instance.ts` with `setSocketInstance(io)` / `getSocketInstance()`, call `setSocketInstance(io)` from `initializeChatHandler` in `backend/src/websocket/chat-handler.ts` so the instance is available, and have the route reach for it via `getSocketInstance()`.

The notification helper lives in the route file as `notifyChatOfCancellation(workflowId, providerId, serviceType)`:

1. grab the socket via `getSocketInstance()` (if it's not set up yet, bail quietly),
2. look up the workflow to get its `sessionId`, and resolve the provider name for a friendlier message,
3. save a hidden `system_notification` message describing the cancellation,
4. emit `message_start`, call `sendAIMessage(sessionId, '', { onTextDelta })` streaming `text_delta`s, save the assistant response, and emit `message_complete`.

```typescript
const io = getSocketInstance();
if (!io) return;

const workflow = await getWorkflow(workflowId);
// ... save system_notification, then:
io.to(sessionId).emit('message_start', { messageId });
const aiResponse = await sendAIMessage(sessionId, '', {
  onTextDelta: (text) => io.to(sessionId).emit('text_delta', { text }),
});
io.to(sessionId).emit('message_complete', { messageId });
```

This is essentially the same streaming sequence `handleBookingConfirmation` performs, so we'll follow that implementation closely.

### Validation

Add `cancelBookingSchema` to `backend/src/validation/booking-schemas.ts`:

```typescript
export const cancelBookingSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
});
```

That requires a non-empty `workflowId` in the body; the `:id` path param is already covered by `bookingIdSchema`.

## Error handling

The cancellation is the part that has to succeed; the chat acknowledgment is best-effort. If the acknowledgment fails (AI service down, session already gone), we log it and still return success to the caller, because the booking really was cancelled. This matches the confirmation behavior, where a failed acknowledgment doesn't invalidate the booking. The whole notification body is wrapped in a try/catch that logs and moves on.

## Files to change

- `backend/src/validation/booking-schemas.ts` — add `cancelBookingSchema` (`workflowId`).
- `backend/src/services/booking-service.ts` — add `cancelBooking(id)`.
- `backend/src/websocket/socket-instance.ts` — new module holding the Socket.io server instance for routes to reach.
- `backend/src/websocket/chat-handler.ts` — store the instance via `setSocketInstance(io)` during init.
- `backend/src/routes/bookings.ts` — add the `POST /:id/cancel` route and `notifyChatOfCancellation` helper.

## Verification

Unit tests for `cancelBooking` in `backend/tests/unit/booking-service.test.ts`:

- cancelling sets `status` to `'cancelled'` and the change persists,
- the returned booking keeps its original details (id, serviceType),
- `updatedAt` is bumped,
- a non-existent booking returns `null`.

Integration tests for `POST /api/bookings/:id/cancel` in `backend/tests/integration/bookings.integration.test.ts`:

- a successful cancel returns 200 with the updated booking,
- the cancelled status survives a follow-up `GET`,
- an invalid booking id returns 400,
- a missing `workflowId` returns 400.

These cover the request/response contract, the validation surface, and the persisted state change — the behaviors the frontend and support teams depend on.

Then run `npm run build`, `npm run lint`, and `npm test` and confirm they're green before opening the PR.

## Rollout

Backend-only, no migration. The endpoint is additive and unused until the frontend ships the cancel button, so no feature flag is needed.
