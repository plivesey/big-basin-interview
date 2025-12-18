/**
 * Represents a conflicting calendar event
 */
export interface CalendarConflict {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
}

/**
 * Details for creating a calendar event from a booking
 */
export interface BookingEventDetails {
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  description?: string;
}
