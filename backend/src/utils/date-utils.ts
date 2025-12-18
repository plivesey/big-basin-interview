/**
 * Date and Time Utilities
 *
 * Helper functions for date/time formatting and parsing used throughout
 * the availability and booking systems.
 */

/**
 * Get today's date formatted as YYYY-MM-DD in local timezone.
 *
 * @param now - Optional Date object (defaults to current time, useful for testing)
 * @returns Date string in YYYY-MM-DD format
 */
export function getLocalDateString(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a time string (HH:MM) to minutes since midnight.
 *
 * @param time - Time string in HH:MM format (e.g., "09:30", "14:00")
 * @returns Number of minutes since midnight (e.g., 570 for "09:30")
 * @throws Error if time format is invalid
 */
export function parseTimeToMinutes(time: string): number {
  const parts = time.split(':');
  if (parts.length !== 2) {
    throw new Error(`Invalid time format: ${time}. Expected HH:MM`);
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Invalid time format: ${time}. Expected numeric HH:MM`);
  }

  if (hours < 0 || hours > 23) {
    throw new Error(`Invalid hours: ${hours}. Must be 0-23`);
  }

  if (minutes < 0 || minutes > 59) {
    throw new Error(`Invalid minutes: ${minutes}. Must be 0-59`);
  }

  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to HH:MM string.
 *
 * @param minutes - Number of minutes since midnight (0-1439)
 * @returns Time string in HH:MM format (e.g., "09:30")
 * @throws Error if minutes is out of valid range
 */
export function formatMinutesToTime(minutes: number): string {
  if (minutes < 0 || minutes > 1439) {
    throw new Error(`Invalid minutes: ${minutes}. Must be 0-1439`);
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Create a local ISO datetime string from date and time components.
 * Returns format: YYYY-MM-DDTHH:MM:SS (no timezone suffix, represents local time)
 *
 * @param date - Date string in YYYY-MM-DD format
 * @param time - Time string in HH:MM format
 * @returns ISO datetime string without timezone (e.g., "2024-06-15T09:30:00")
 */
export function toLocalISOString(date: string, time: string): string {
  return `${date}T${time}:00`;
}

/**
 * Parse a local ISO datetime string into date and time components.
 *
 * @param isoString - ISO datetime string (e.g., "2024-06-15T09:30:00")
 * @returns Object with date (YYYY-MM-DD) and time (HH:MM) components
 * @throws Error if format is invalid
 */
export function parseLocalISOString(isoString: string): { date: string; time: string } {
  const match = isoString.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):\d{2}$/);
  if (!match) {
    throw new Error(`Invalid ISO datetime format: ${isoString}. Expected YYYY-MM-DDTHH:MM:SS`);
  }
  return {
    date: match[1],
    time: match[2],
  };
}
