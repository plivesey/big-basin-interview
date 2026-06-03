# Availability Caching

## Context

`getAvailableSlots(providerId, date, duration)` in `backend/src/services/availability-service.ts` is on the hot path — the chat assistant calls it every time a user asks "what's open?", and the date picker re-calls it as the user clicks around different days. Every call loads the provider, generates the slot grid from working hours, reconciles it against provider availability, and checks calendar conflicts. None of that output changes between two calls a few seconds apart, so we're recomputing the same slot list over and over.

The fix is a small in-memory cache in front of `getAvailableSlots`. This is backend-only and additive — the function signature and return shape don't change, so nothing downstream needs to be touched.

## Goals

- Add a reusable TTL cache utility under `backend/src/utils/`.
- Cache the computed `AvailabilityResult` from `getAvailableSlots` so a repeated lookup for the same provider and service duration is served straight from memory.
- Keep the surface small: availability only. Provider search is a separate, cheaper query and can wait.

## Non-goals

- Caching provider search — out of scope for this PR.

## Approach

### Cache utility

Add `backend/src/utils/cache.ts` exporting a small `TtlCache<T>` class. It wraps a module-level `Map` keyed by string, where each entry stores the value plus an `expiresAt` timestamp. `get` returns the value if it's still within its TTL and `undefined` otherwise; `set` writes a value with the configured TTL. Expiry is checked lazily on read, so there are no background timers to manage.

It's a simple module-level Map and entries live for the process lifetime, which is exactly what we want for a long-running server — the working set here is "providers people are actively looking at," which is small.

```typescript
export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  constructor(private ttlMs: number) {}
  get(key: string): T | undefined { /* ... */ }
  set(key: string, value: T): void { /* ... */ }
}
```

### Integrating into availability

In `availability-service.ts`, create one module-level cache instance and check it at the top of `getAvailableSlots`. On a hit, return immediately; on a miss, do the existing computation and `set` the computed `AvailabilityResult` before returning, so the next lookup is served from memory.

The natural cache key is the provider and the requested service duration:

```typescript
const cacheKey = `${providerId}:${duration}`;
const cached = availabilityCache.get(cacheKey);
if (cached) return cached;
```

A 60-second TTL feels right. Availability changes rarely, so a short TTL is enough; we don't need to actively invalidate on booking. The window where a freshly booked slot might still show as available is at most a minute, and the booking flow re-validates the slot at confirmation time anyway, so the user-visible impact is negligible. Skipping invalidation also keeps `booking-service` untouched — it doesn't need to know the cache exists.

### Why TTL over invalidation

I considered wiring `createBooking` to evict the relevant cache entry, but it adds a dependency from the booking path into the availability cache for very little benefit at this scale. The TTL approach is self-healing: stale entries age out on their own within the window, and the code stays decoupled. We can revisit explicit invalidation if we ever see real double-booking pressure.

## Files to change

- `backend/src/utils/cache.ts` — new `TtlCache<T>` utility.
- `backend/src/services/availability-service.ts` — add the module-level cache, check it in `getAvailableSlots`, populate on miss, and export a `clearAvailabilityCache()` helper for tests.

## Verification

Unit tests for `TtlCache` in `backend/tests/unit/cache.test.ts`:

- a stored value is returned before expiry and `undefined` after the TTL elapses,
- missing keys return `undefined`,
- `set` on an existing key overwrites it and refreshes the TTL,
- `clear` empties the cache.

Availability tests in `backend/tests/unit/availability-service.test.ts`:

- a repeated provider/duration request is served from cache (the provider is only fetched once),
- clearing the cache forces a recompute.

The existing availability tests clear the cache in `beforeEach` so cases stay isolated.

Then run `npm run build`, `npm run lint`, and `npm test` and confirm green before opening the PR.

## Rollout

Backend-only, no migration, no flag. The cache is transparent — worst case it's a no-op and we fall back to recomputing every call.
