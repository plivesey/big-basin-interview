/**
 * Availability Service
 *
 * Generates time slots based on provider working hours and applies
 * mock availability patterns to simulate realistic booking availability.
 */

import { getProviderById } from './provider-service';
import { getBusyLevel, applyMockPattern } from '../utils/mock-availability';
import {
  getLocalDateString,
  parseTimeToMinutes,
  formatMinutesToTime,
  toLocalISOString,
} from '../utils/date-utils';
import { ProviderNotFoundError } from '../middleware/error-handler';
import type { WorkingHours } from '../db/schema';

export interface TimeSlot {
  start: string; // ISO datetime
  end: string; // ISO datetime
  available: boolean;
}

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
      available: true, // Will be modified by mock pattern
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
 * Apply mock availability patterns to slots.
 * This simulates realistic booking availability for demo purposes.
 *
 * NOTE: This is mock functionality. In production, this would be replaced
 * with real availability data from provider calendars/booking systems.
 *
 * @param slots - Time slots to apply mock pattern to
 * @param providerId - Provider ID (used for deterministic randomness)
 * @param date - Date string (used for deterministic randomness)
 * @returns Slots with availability modified by mock pattern
 */
function applyMockAvailability(
  slots: TimeSlot[],
  providerId: string,
  date: string
): TimeSlot[] {
  const busyLevel = getBusyLevel(providerId, date);
  return applyMockPattern(slots, busyLevel, providerId, date);
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

  // Apply mock availability (in production, replace with real availability data)
  slots = applyMockAvailability(slots, providerId, date);

  return {
    providerId: provider.id,
    providerName: provider.name,
    date,
    slots,
  };
}
