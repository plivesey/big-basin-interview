import { google, calendar_v3 } from 'googleapis';
import {
  getConnection,
  getOAuth2Client,
  refreshTokenIfNeeded,
} from './calendar-connection-service';
import { BookingEventDetails, CalendarConflict } from '../types/calendar.types';
import { logger } from '../utils/logger';

// Default user for MVP (hardcoded, expandable later)
const DEFAULT_USER_ID = 'default_user';

/**
 * Check if the user has a calendar connected
 */
export async function isCalendarConnected(): Promise<boolean> {
  try {
    const connection = await getConnection(DEFAULT_USER_ID);
    return connection !== null;
  } catch (error) {
    logger.error('Error checking calendar connection', { error: String(error) });
    return false;
  }
}

/**
 * Get an authenticated Google Calendar client
 * Returns null if not connected or tokens are invalid
 */
export async function getCalendarClient(): Promise<calendar_v3.Calendar | null> {
  try {
    // Refresh tokens if needed
    const connection = await refreshTokenIfNeeded(DEFAULT_USER_ID);

    if (!connection) {
      logger.debug('No calendar connection found');
      return null;
    }

    const oauth2 = getOAuth2Client();
    oauth2.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken,
    });

    return google.calendar({ version: 'v3', auth: oauth2 });
  } catch (error) {
    logger.error('Failed to get calendar client', { error: String(error) });
    return null;
  }
}

/**
 * Check for conflicting events in a time range
 * Returns empty array if calendar not connected or on error
 */
export async function checkConflicts(
  startTime: Date,
  endTime: Date
): Promise<CalendarConflict[]> {
  try {
    const calendar = await getCalendarClient();

    if (!calendar) {
      return [];
    }

    const connection = await getConnection(DEFAULT_USER_ID);
    const calendarId = connection?.calendarId || 'primary';

    const response = await calendar.events.list({
      calendarId,
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    return events
      .filter((event) => event.id && event.start?.dateTime && event.end?.dateTime)
      .map((event) => ({
        id: event.id!,
        title: event.summary || 'Busy',
        start: event.start!.dateTime!,
        end: event.end!.dateTime!,
      }));
  } catch (error) {
    logger.warn('Failed to check calendar conflicts', { error: String(error) });
    return [];
  }
}

/**
 * Create a calendar event for a booking
 * Returns the event ID on success, null on failure
 */
export async function createEvent(
  details: BookingEventDetails
): Promise<string | null> {
  try {
    const calendar = await getCalendarClient();

    if (!calendar) {
      logger.debug('Cannot create event: no calendar connected');
      return null;
    }

    const connection = await getConnection(DEFAULT_USER_ID);
    const calendarId = connection?.calendarId || 'primary';

    const event: calendar_v3.Schema$Event = {
      summary: details.title,
      description: details.description,
      location: details.location,
      start: {
        dateTime: details.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: details.endTime.toISOString(),
        timeZone: 'UTC',
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    const eventId = response.data.id || null;

    if (eventId) {
      logger.info('Calendar event created', {
        eventId,
        title: details.title,
        startTime: details.startTime.toISOString(),
      });
    }

    return eventId;
  } catch (error) {
    logger.error('Failed to create calendar event', {
      error: String(error),
      title: details.title,
    });
    return null;
  }
}
