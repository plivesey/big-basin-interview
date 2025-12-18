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
