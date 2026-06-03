# Implementation Plan: Double-Booking Prevention

## Context

Today a user (or two different users) can book the exact same provider at the same time. `createBooking` in `backend/src/services/booking-service.ts` validates the provider and de-duplicates on the idempotency key, but it never asks "is this slot already taken?". The idempotency key only protects against the same request being replayed; it does nothing when two genuinely different requests target the same slot.

We want to reject an attempt to book a slot that overlaps an existing booking for that provider, returning an HTTP 409 so the client can prompt the user to pick another time. This keeps the provider's schedule consistent and matches user expectations: once a slot is taken, it's gone.

## Goal

Add a slot-conflict check to the booking flow so that creating a booking that overlaps an existing booking for the same provider is rejected with a clear 409 response, while bookings for different providers or non-overlapping times continue to succeed.

## Approach

The booking flow is a small, linear sequence inside `createBooking`. The cleanest place to add the conflict check is as a new step in that sequence, right alongside the existing idempotency and provider-validation steps. We already have a battle-tested overlap helper in `backend/src/utils/slot-conflict-checker.ts` (`timesOverlap`) that powers calendar conflict annotation, so we'll extend that module with a booking-oriented helper rather than inventing a second overlap implementation.

High level:

1. Add a `bookingsOverlap(startA, durationA, startB, durationB)` helper to `slot-conflict-checker.ts` that computes each booking's end time from its duration and reuses the same start-before-end / end-after-start overlap logic the calendar code uses.
2. Add a `checkSlotConflict(providerId, scheduledAt, duration)` function to `booking-service.ts` that loads the provider's existing bookings and returns the first one that overlaps the requested window (or null).
3. Wire `checkSlotConflict` into `createBooking` as a new step. If a conflict is found, throw a 409 `ApiError` with code `SLOT_UNAVAILABLE`.
4. Guard against rapid double-submits from a single user with a small in-memory lock keyed by provider, held while the external booking call is in flight.

## Overlap logic

Two bookings conflict when their time ranges intersect. Each booking is stored as a start time (`scheduledAt`) plus a `duration` in minutes, so the end time is `scheduledAt + duration * 60_000`.

We will compute the end times and compare the two ranges. Concretely, range A and range B intersect when A starts at or before B ends and A ends at or after B starts. This naturally covers the common cases: identical slots, partial overlaps on either side, and one booking fully containing the other. To keep the comparison readable in logs and consistent with how slots are rendered elsewhere, we'll compare the times as wall-clock strings using the same approach the calendar conflict checker takes.

## Where the check belongs in the flow

The booking sequence is: idempotency check, provider validation, external booking call, database insert, optional calendar event. The external call is the step that actually reserves the slot with the provider's own system, so the most accurate signal of "is this slot really free?" is available right after that call returns successfully. We'll therefore run the conflict check immediately after the external booking succeeds and before we persist our own row. If a conflict is found, we return 409 and skip the insert.

## Concurrency

The realistic risk is a user double-clicking "Confirm" and firing two near-simultaneous requests for the same slot. To handle that, we'll keep an in-memory `Set` of provider IDs that currently have an in-flight booking. We add the provider to the set before the external call and remove it once the booking is persisted (or the request fails). This serializes booking attempts per provider within the process, which is where the double-submit risk lives.

A database-level uniqueness or exclusion constraint on (providerId, time range) is overkill here and is awkward to express in SQLite, which has no range/exclusion constraint type. An application-level query check plus the in-flight lock is sufficient for our needs and keeps the schema simple.

## Files to change

- `backend/src/utils/slot-conflict-checker.ts` — add `bookingsOverlap` helper.
- `backend/src/services/booking-service.ts` — add `checkSlotConflict`, the in-flight provider lock, and wire the check into `createBooking`; throw 409 `SLOT_UNAVAILABLE` on conflict.
- `backend/tests/unit/booking-service.test.ts` — tests for conflict rejection and for the cases that should still succeed.
- `backend/tests/unit/slot-conflict-checker.test.ts` — tests for `bookingsOverlap`.

The `POST /api/bookings` route in `backend/src/routes/bookings.ts` already forwards service-layer errors through the error middleware, so a 409 `ApiError` thrown from `createBooking` will be returned to the client as a 409 with no route changes needed.

## Error response

On conflict we throw `new ApiError(409, 'SLOT_UNAVAILABLE', '...')`. The user-facing message will be reviewed for brand voice: warm and professional, no blame, pointing the user toward the next action ("That time is no longer available. Please choose another slot.").

## Testing

Unit tests in the existing `backend/tests/unit` vitest style:

- `bookingsOverlap` returns true for identical and partially overlapping ranges, false for clearly separate ranges.
- `createBooking` rejects a second booking for the same provider and time with a 409 `SLOT_UNAVAILABLE`.
- `createBooking` still allows a booking at a different time for the same provider.
- `createBooking` still allows the same time for a different provider.

This gives us confidence the conflict check fires when it should and stays out of the way when it shouldn't, without changing the existing idempotency behavior.
