/**
 * Slot Conflict Checker
 *
 * Utility to annotate time slots with calendar conflict information.
 */

import type { TimeSlot } from '@asba/shared-types';
import type { CalendarConflict } from '../types/calendar.types';

/**
 * Check if two time ranges overlap.
 * Two ranges overlap if: range1.start < range2.end AND range1.end > range2.start
 */
function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Check whether two bookings occupy overlapping time on the same provider.
 *
 * Each booking is represented by its start time and a duration in minutes.
 * We compare them as wall-clock strings so the comparison reads naturally
 * in logs and lines up with how slots are rendered elsewhere in the app.
 */
export function bookingsOverlap(
  startA: Date,
  durationA: number,
  startB: Date,
  durationB: number
): boolean {
  const endA = new Date(startA.getTime() + durationA * 60 * 1000);
  const endB = new Date(startB.getTime() + durationB * 60 * 1000);

  // Build comparable wall-clock strings for each range.
  const startAStr = startA.toLocaleString();
  const endAStr = endA.toLocaleString();
  const startBStr = startB.toLocaleString();
  const endBStr = endB.toLocaleString();

  // Two ranges conflict if they share any instant, including the boundary
  // where one ends exactly as the other begins.
  return startAStr <= endBStr && endAStr >= startBStr;
}

/**
 * Annotate time slots with calendar conflict information.
 * For each slot that overlaps with a calendar event, adds the conflict info.
 *
 * @param slots - Time slots to check
 * @param calendarEvents - Calendar events to check against
 * @returns Slots with conflict information added where applicable
 */
export function annotateWithConflicts(
  slots: TimeSlot[],
  calendarEvents: CalendarConflict[]
): TimeSlot[] {
  if (calendarEvents.length === 0) {
    return slots;
  }

  return slots.map((slot) => {
    const conflictingEvent = calendarEvents.find((event) =>
      timesOverlap(slot.start, slot.end, event.start, event.end)
    );

    if (conflictingEvent) {
      return {
        ...slot,
        conflict: {
          eventTitle: conflictingEvent.title,
        },
      };
    }

    return slot;
  });
}
