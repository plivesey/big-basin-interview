/**
 * Availability Service
 *
 * Generates time slots based on provider working hours and reconciles
 * them with provider availability to produce bookable time slots.
 */

import type { TimeSlot } from '@asba/shared-types';
import { getProviderById } from './provider-service';
import { checkConflicts } from './calendar-service';
import {
  fetchProviderAvailability,
  reconcileAvailability,
} from '../utils/provider-availability';
import { annotateWithConflicts } from '../utils/slot-conflict-checker';
import {
  getLocalDateString,
  parseTimeToMinutes,
  formatMinutesToTime,
  toLocalISOString,
} from '../utils/date-utils';
import { ProviderNotFoundError } from '../middleware/error-handler';
import type { WorkingHours } from '../db/schema';
import { logger } from '../utils/logger';

// Re-export TimeSlot for dependent files
export type { TimeSlot } from '@asba/shared-types';

export interface AvailabilityResult {
  providerId: string;
  providerName: string;
  date: string; // YYYY-MM-DD
  slots: TimeSlot[];
}

/**
 * Day name mapping for getting working hours
 */
const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * Generate time slots for a given provider and date based on working hours.
 * All slots are marked as available - actual availability is applied separately.
 *
 * @param workingHours - Provider's working hours
 * @param date - Date string in YYYY-MM-DD format
 * @param slotDurationMinutes - Duration of each slot in minutes (default 30)
 * @returns Array of time slots with available: true
 */
function generateTimeSlots(
  workingHours: WorkingHours,
  date: string,
  slotDurationMinutes: number = 30
): TimeSlot[] {
  const dateObj = new Date(date + 'T00:00:00');
  const dayIndex = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayName = DAY_NAMES[dayIndex];

  const dayHours = workingHours[dayName];

  // If closed on this day, return empty array
  if (!dayHours) {
    return [];
  }

  const openMinutes = parseTimeToMinutes(dayHours.open);
  const closeMinutes = parseTimeToMinutes(dayHours.close);

  const slots: TimeSlot[] = [];

  // Generate slots from open to close
  for (
    let startMinutes = openMinutes;
    startMinutes + slotDurationMinutes <= closeMinutes;
    startMinutes += slotDurationMinutes
  ) {
    const endMinutes = startMinutes + slotDurationMinutes;

    const startTime = formatMinutesToTime(startMinutes);
    const endTime = formatMinutesToTime(endMinutes);

    slots.push({
      start: toLocalISOString(date, startTime),
      end: toLocalISOString(date, endTime),
      available: true, // Will be reconciled against provider availability
    });
  }

  return slots;
}

/**
 * Filter out past time slots if the date is today
 *
 * @param slots - Time slots to filter
 * @param now - Current time (for testing, defaults to new Date())
 * @returns Filtered slots with past times marked as unavailable
 */
function filterPastSlots(slots: TimeSlot[], now: Date = new Date()): TimeSlot[] {
  const nowTime = now.getTime();
  return slots.filter((slot) => {
    const slotStart = new Date(slot.start).getTime();
    return slotStart > nowTime;
  });
}

/**
 * Reconcile slots against the provider's availability.
 *
 * Fetches the provider's availability for the date and reconciles the
 * generated slot grid against it, marking slots available or unavailable.
 *
 * @param slots - Time slots to reconcile
 * @param providerId - Provider ID (used for deterministic lookup)
 * @param date - Date string (used for deterministic lookup)
 * @returns Slots with availability reconciled against the provider
 */
function applyAvailability(
  slots: TimeSlot[],
  providerId: string,
  date: string
): TimeSlot[] {
  const providerAvailability = fetchProviderAvailability(providerId, date);
  return reconcileAvailability(slots, providerAvailability, providerId, date);
}

/**
 * Get available time slots for a provider on a specific date
 *
 * @param providerId - The provider ID
 * @param date - Date string in YYYY-MM-DD format
 * @param duration - Slot duration in minutes
 * @returns Availability result with slots
 * @throws Error if provider not found
 */
export async function getAvailableSlots(
  providerId: string,
  date: string,
  duration: number
): Promise<AvailabilityResult> {
  // Get provider from database
  const provider = await getProviderById(providerId);

  if (!provider) {
    throw new ProviderNotFoundError(providerId);
  }

  // Get today's date in local timezone for comparison
  const todayLocal = getLocalDateString();

  // Generate base time slots from working hours
  let slots = generateTimeSlots(provider.workingHours, date, duration);

  // Filter out past times if date is today
  if (date === todayLocal) {
    slots = filterPastSlots(slots);
  }

  // Reconcile slots against the provider's availability
  slots = applyAvailability(slots, providerId, date);

  // Check for calendar conflicts if slots exist
  // Note: checkConflicts handles errors gracefully and returns [] if calendar not connected
  if (slots.length > 0) {
    const dateObj = new Date(date + 'T00:00:00');
    const dayIndex = dateObj.getDay();
    const dayName = DAY_NAMES[dayIndex];
    const dayHours = provider.workingHours[dayName];

    if (dayHours) {
      const dayStart = new Date(`${date}T${dayHours.open}:00`);
      const dayEnd = new Date(`${date}T${dayHours.close}:00`);

      const calendarEvents = await checkConflicts(dayStart, dayEnd);
      if (calendarEvents.length > 0) {
        logger.debug('Found calendar conflicts', {
          date,
          eventCount: calendarEvents.length,
        });
        slots = annotateWithConflicts(slots, calendarEvents);
      }
    }
  }

  return {
    providerId: provider.id,
    providerName: provider.name,
    date,
    slots,
  };
}
