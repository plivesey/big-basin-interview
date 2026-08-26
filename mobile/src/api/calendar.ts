import { apiGet, apiPost } from './client';

export interface CalendarStatus {
  connected: boolean;
  email: string | null;
}

export function getCalendarStatus(): Promise<CalendarStatus> {
  return apiGet<CalendarStatus>('/auth/google/status');
}

export function disconnectCalendar(): Promise<{ disconnected: boolean }> {
  return apiPost<{ disconnected: boolean }>('/auth/google/disconnect');
}
