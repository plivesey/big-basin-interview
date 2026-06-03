# Implementation Plan: Booking Cancellation + Chat Notification

## Context

Today a user can search for a provider, pick a time slot, and confirm a booking. Once a booking is confirmed there is no way to cancel it. Support has flagged this as the single most common request, and the product team wants cancellation to feel just as conversational as booking does. When a user cancels, the assistant should acknowledge the cancellation in the chat so the experience stays consistent with the rest of the flow.

The `bookings` table already has a `status` column that supports `'pending'`, `'confirmed'`, and `'cancelled'`, so no schema migration is needed. We just need an endpoint that flips a booking to `'cancelled'` and a way to push a friendly acknowledgment back into the active chat session.

## Goals

- Add a REST endpoint to cancel a confirmed booking.
- Update the booking's `status` to `'cancelled'` in the database.
- Notify the user's chat session so the assistant acknowledges the cancellation in natural language, matching how booking confirmation already works.

## Non-Goals

- Cancellation policies, fees, or time-window restrictions (out of scope for the MVP).
- Notifying the external provider system of the cancellation (the `external-booking-service` does not yet expose a cancel call; tracked separately).
- A cancellation UI in the frontend (this PR is backend-only; the frontend team will wire up a button against the new endpoint).

## Approach

### Endpoint

We will add `POST /api/bookings/:id/cancel` to the existing bookings router. We use `POST` with a `/cancel` sub-resource rather than `DELETE` because cancellation is a state transition, not a hard delete: we keep the row for history and analytics, we just change its status.

The request body carries the `workflowId` so we can find the chat session the cancellation belongs to. This mirrors how `POST /api/bookings` already accepts a `workflowId` to tie the booking back to a conversation.

Request:

```
POST /api/bookings/:id/cancel
{
  "workflowId": "..."
}
```

Response (200):

```
{
  "success": true,
  "data": { "booking": { ...updated booking... } }
}
```

### Service layer

We add a `cancelBooking(id)` function to `booking-service.ts`. It looks up the booking by ID, sets `status` to `'cancelled'`, bumps `updatedAt`, and returns the updated booking. If the booking does not exist it returns `null`, consistent with how `getBookingById` signals "not found" by returning `null`.

### Chat notification

When a booking is confirmed today, `bookings.ts` triggers an AI acknowledgment that streams back into the chat. We want the exact same behavior for cancellation: save a hidden system-notification message so Claude has context, then stream a warm acknowledgment back to the user's session.

The booking confirmation path goes through the event bus, but for cancellation we can take a more direct route. The Socket.io server instance is already created at startup in `index.ts`, so we will expose it through a small singleton holder (`socket-instance.ts`) and have the cancel route grab the live server, look up the session from the workflow, and stream the acknowledgment directly. This keeps the notification logic right next to the cancellation logic where it is easy to read, and it avoids having to thread a new event type through the event map and the websocket handler just to send one message. The flow is:

1. Cancel route calls `cancelBooking(id)`.
2. Route looks up the workflow to get the `sessionId`.
3. Route saves a hidden `system_notification` message describing the cancellation.
4. Route emits `message_start`, calls the AI service with a streaming callback that emits `text_delta`, saves the assistant response, and emits `message_complete`.

This is essentially the same sequence `handleBookingConfirmation` already performs, so we will follow that implementation closely.

## Files to Change

- `backend/src/validation/booking-schemas.ts` — add `cancelBookingSchema` validating the request body (`workflowId`).
- `backend/src/services/booking-service.ts` — add `cancelBooking(id)`.
- `backend/src/websocket/socket-instance.ts` — new module holding the Socket.io server instance so routes can reach it.
- `backend/src/websocket/chat-handler.ts` — store the server instance via `setSocketInstance(io)` during initialization.
- `backend/src/routes/bookings.ts` — add the `POST /:id/cancel` route and the chat-notification helper.

## Error Handling

The cancellation itself is the important part, so the notification is best-effort: if the chat acknowledgment fails (AI service down, session gone), we log the error but still return success to the caller, since the booking really was cancelled. This matches the existing booking-confirmation behavior, where a failed acknowledgment does not invalidate the booking.

## Testing

- Unit tests for `cancelBooking` in `booking-service.test.ts`: cancelling a booking sets status to `'cancelled'`, the change persists, and a non-existent booking returns `null`.
- Integration tests for `POST /api/bookings/:id/cancel` in `bookings.integration.test.ts`: a successful cancel returns 200 with the updated booking, the status persists across a follow-up `GET`, an invalid booking ID returns 400, and a missing `workflowId` returns 400.

These cover the request/response contract and the database state change, which are the behaviors the frontend and support teams care about.

## Rollout

Backend-only change, no migration. The frontend team will add a "Cancel booking" button in a follow-up that calls the new endpoint. No feature flag needed since the endpoint is additive and unused until the frontend ships.
