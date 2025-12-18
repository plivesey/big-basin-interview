/**
 * Mock Availability Utility
 *
 * Provides deterministic mock availability patterns for providers.
 * Uses hash-based patterns to simulate realistic and consistent availability.
 */

import type { TimeSlot } from '../services/availability-service';

/**
 * Hash a provider ID and date to get a deterministic number.
 * This ensures the same provider+date always returns the same availability pattern.
 */
export function hashProviderDate(providerId: string, date: string): number {
  let hash = 0;
  const combined = `${providerId}:${date}`;

  for (let i = 0; i < combined.length; i++) {
    hash = (hash + combined.charCodeAt(i)) % 1000000;
  }

  return hash;
}

/**
 * Get the busy level (0-3) for a provider on a specific date.
 *
 * - Level 0: Fully available (no changes)
 * - Level 1: Light busy (2-3 slots unavailable)
 * - Level 2: Moderate busy (~50% unavailable)
 * - Level 3: Heavy busy (only 2-3 slots available)
 */
export function getBusyLevel(providerId: string, date: string): 0 | 1 | 2 | 3 {
  const hash = hashProviderDate(providerId, date);
  return (hash % 4) as 0 | 1 | 2 | 3;
}

/**
 * Get deterministic indices for slots to mark as unavailable.
 * Uses the hash to generate consistent slot indices.
 */
function getUnavailableIndices(
  hash: number,
  totalSlots: number,
  count: number
): Set<number> {
  const indices = new Set<number>();

  // Use hash to seed the selection
  let seed = hash;

  while (indices.size < count && indices.size < totalSlots) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const index = seed % totalSlots;
    indices.add(index);
  }

  return indices;
}

/**
 * Apply a mock availability pattern to a set of time slots.
 *
 * @param slots - The time slots to modify
 * @param busyLevel - The busy level (0-3)
 * @param providerId - Provider ID for hash seed
 * @param date - Date string for hash seed
 * @returns Modified slots with availability applied
 */
export function applyMockPattern(
  slots: TimeSlot[],
  busyLevel: 0 | 1 | 2 | 3,
  providerId: string,
  date: string
): TimeSlot[] {
  if (slots.length === 0) {
    return slots;
  }

  const hash = hashProviderDate(providerId, date);

  switch (busyLevel) {
    case 0:
      // Fully available - no changes
      return slots;

    case 1: {
      // Light busy - mark 2-3 slots as unavailable
      const count = Math.min(2 + (hash % 2), slots.length);
      const unavailableIndices = getUnavailableIndices(hash, slots.length, count);

      return slots.map((slot, index) => ({
        ...slot,
        available: unavailableIndices.has(index) ? false : slot.available,
      }));
    }

    case 2: {
      // Moderate busy - mark ~50% as unavailable
      const count = Math.floor(slots.length / 2);
      const unavailableIndices = getUnavailableIndices(hash, slots.length, count);

      return slots.map((slot, index) => ({
        ...slot,
        available: unavailableIndices.has(index) ? false : slot.available,
      }));
    }

    case 3: {
      // Heavy busy - only 2-3 slots available
      const availableCount = Math.min(2 + (hash % 2), slots.length);
      const availableIndices = getUnavailableIndices(hash, slots.length, availableCount);

      return slots.map((slot, index) => ({
        ...slot,
        available: availableIndices.has(index) ? slot.available : false,
      }));
    }

    default:
      return slots;
  }
}
