/**
 * Availability Service
 *
 * Generates time slots based on provider working hours and applies
 * mock availability patterns to simulate realistic booking availability.
 */

import { getProviderById } from './provider-service';
import { getBusyLevel, applyMockPattern } from '../utils/mock-availability';
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
 * Parse a time string (HH:MM) to minutes since midnight
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to HH:MM
 */
function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Generate time slots for a given provider and date
 *
 * @param workingHours - Provider's working hours
 * @param date - Date string in YYYY-MM-DD format
 * @param slotDurationMinutes - Duration of each slot in minutes (default 30)
 * @returns Array of time slots
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

    // Create ISO datetime strings (local time, no timezone suffix)
    const startISO = `${date}T${startTime}:00`;
    const endISO = `${date}T${endTime}:00`;

    slots.push({
      start: startISO,
      end: endISO,
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
    throw new Error(`Provider not found: ${providerId}`);
  }

  // Get today's date in local timezone for comparison
  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Generate base time slots from working hours
  let slots = generateTimeSlots(provider.workingHours, date, duration);

  // Filter out past times if date is today
  if (date === todayLocal) {
    slots = filterPastSlots(slots);
  }

  // Apply mock availability pattern
  // Note: We do NOT filter real bookings - providers can serve multiple customers
  // at the same time (e.g., nail salons). Mock API is the source of truth.
  const busyLevel = getBusyLevel(providerId, date);
  slots = applyMockPattern(slots, busyLevel, providerId, date);

  return {
    providerId: provider.id,
    providerName: provider.name,
    date,
    slots,
  };
}

/**
 * Get only available slots (convenience method)
 */
export async function getOnlyAvailableSlots(
  providerId: string,
  date: string,
  duration: number
): Promise<AvailabilityResult> {
  const result = await getAvailableSlots(providerId, date, duration);

  return {
    ...result,
    slots: result.slots.filter((slot) => slot.available),
  };
}
