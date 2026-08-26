/**
 * Date and time formatting that never round-trips a slot time through `Date`.
 *
 * The backend emits slot times as *naive local* datetimes with no offset --
 * `toLocalISOString()` in backend/src/utils/date-utils.ts is literally
 * `${date}T${time}:00`, producing "2026-08-26T09:30:00" -- and
 * `POST /api/bookings` accepts exactly that shape
 * (`z.string().datetime({ local: true })`).
 *
 * The web app gets away with `new Date(slot.start).toLocaleTimeString()`
 * because V8 parses a naive datetime as local time. Two reasons not to copy
 * that here:
 *
 *  1. Hermes is a different engine with a different Intl build, and its
 *     `Intl.DateTimeFormat` support varies across builds.
 *  2. More importantly, a device in a different timezone from the server would
 *     silently shift every displayed time by hours, with no error anywhere.
 *
 * So slot strings are parsed with an explicit regex and formatted by hand.
 * `Date` is used only where the value genuinely is an instant (message
 * timestamps, session dates), never for slot times.
 */

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export interface NaiveDateTime {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
}

const NAIVE_DATETIME = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

/** Parse "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm[:ss]" without going through Date. */
export function parseNaive(value: string): NaiveDateTime | null {
  const match = NAIVE_DATETIME.exec(value);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: match[4] ? Number(match[4]) : 0,
    minute: match[5] ? Number(match[5]) : 0,
  };
}

/** "9:00 AM" */
export function formatTime(value: string): string {
  const parsed = parseNaive(value);
  if (!parsed) return '';
  return formatClock(parsed.hour, parsed.minute);
}

function formatClock(hour24: number, minute: number): string {
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

/** The device's local date as "YYYY-MM-DD". */
export function getTodayDate(): string {
  return toDateString(new Date());
}

export function toDateString(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Shift a "YYYY-MM-DD" string by whole days. */
export function addDays(dateString: string, days: number): string {
  const parsed = parseNaive(dateString);
  if (!parsed) return dateString;
  const date = new Date(parsed.year, parsed.month - 1, parsed.day + days);
  return toDateString(date);
}

/** True when the "YYYY-MM-DD" string is strictly before the device's today. */
export function isBeforeToday(dateString: string): boolean {
  return dateString < getTodayDate();
}

/** "Today" | "Tomorrow" | "Thursday, December 19" | "…, 2027" */
export function formatDateDisplay(dateString: string): string {
  const today = getTodayDate();
  if (dateString === today) return 'Today';
  if (dateString === addDays(today, 1)) return 'Tomorrow';

  const parsed = parseNaive(dateString);
  if (!parsed) return dateString;

  const weekday = DAYS[new Date(parsed.year, parsed.month - 1, parsed.day).getDay()];
  const base = `${weekday}, ${MONTHS[parsed.month - 1]} ${parsed.day}`;
  const currentYear = new Date().getFullYear();
  return parsed.year === currentYear ? base : `${base}, ${parsed.year}`;
}

/** "Tuesday, Dec 17 at 2:30 PM" -- the booking summary format. */
export function formatDateTime(value: string): string {
  const parsed = parseNaive(value);
  if (!parsed) return value;
  const weekday = DAYS[new Date(parsed.year, parsed.month - 1, parsed.day).getDay()];
  const month = MONTHS[parsed.month - 1].slice(0, 3);
  return `${weekday}, ${month} ${parsed.day} at ${formatClock(parsed.hour, parsed.minute)}`;
}

/**
 * Message timestamps are genuine instants (the server stores them as epoch
 * millis and sends ISO-8601 with an offset), so Date is correct here.
 */
export function formatMessageTime(date: Date): string {
  return formatClock(date.getHours(), date.getMinutes());
}

/** "3 DEC" -- the conversation-list format. */
export function formatSessionDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3).toUpperCase()}`;
}
