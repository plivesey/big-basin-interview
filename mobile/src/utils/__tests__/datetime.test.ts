import {
  addDays,
  formatDateDisplay,
  formatDateTime,
  formatMessageTime,
  formatSessionDate,
  formatTime,
  getTodayDate,
  isBeforeToday,
  parseNaive,
  toDateString,
} from '../datetime';

/**
 * These matter more than they look. The backend emits slot times as naive local
 * datetimes with no offset (backend/src/utils/date-utils.ts toLocalISOString),
 * so anything that round-trips them through Date would silently shift every
 * displayed time when the device timezone differs from the server's.
 */
describe('parseNaive', () => {
  it('parses a date-only string', () => {
    expect(parseNaive('2026-08-26')).toEqual({
      year: 2026,
      month: 8,
      day: 26,
      hour: 0,
      minute: 0,
    });
  });

  it('parses the naive datetime the backend actually sends', () => {
    expect(parseNaive('2026-08-26T09:30:00')).toEqual({
      year: 2026,
      month: 8,
      day: 26,
      hour: 9,
      minute: 30,
    });
  });

  it('returns null for something that is not a date', () => {
    expect(parseNaive('not-a-date')).toBeNull();
  });
});

describe('formatTime', () => {
  it.each([
    ['2026-08-26T09:00:00', '9:00 AM'],
    ['2026-08-26T09:30:00', '9:30 AM'],
    ['2026-08-26T12:00:00', '12:00 PM'],
    ['2026-08-26T13:05:00', '1:05 PM'],
    ['2026-08-26T00:15:00', '12:15 AM'],
    ['2026-08-26T23:45:00', '11:45 PM'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatTime(input)).toBe(expected);
  });

  it('does not depend on the device timezone', () => {
    // The whole point: the same string formats identically regardless of where
    // the phone is, because it is never interpreted as an instant.
    expect(formatTime('2026-12-31T23:30:00')).toBe('11:30 PM');
  });
});

describe('addDays', () => {
  it('moves forward', () => {
    expect(addDays('2026-08-26', 1)).toBe('2026-08-27');
  });

  it('moves backward', () => {
    expect(addDays('2026-08-01', -1)).toBe('2026-07-31');
  });

  it('crosses a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('handles a leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('formatDateDisplay', () => {
  it('says Today for today', () => {
    expect(formatDateDisplay(getTodayDate())).toBe('Today');
  });

  it('says Tomorrow for tomorrow', () => {
    expect(formatDateDisplay(addDays(getTodayDate(), 1))).toBe('Tomorrow');
  });

  it('spells out weekday and month for any other date this year', () => {
    // Relative to today so the case stays valid whatever the date is, and far
    // enough out that it is neither Today nor Tomorrow.
    const target = addDays(getTodayDate(), 5);
    const parsed = parseNaive(target)!;
    const asDate = new Date(parsed.year, parsed.month - 1, parsed.day);
    const expected = `${
      ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
        asDate.getDay()
      ]
    }, ${
      [
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
      ][parsed.month - 1]
    } ${parsed.day}`;

    const actual = formatDateDisplay(target);
    // The year suffix only appears when the date rolls into the next year.
    expect(actual.startsWith(expected)).toBe(true);
  });

  it('includes the year when it is not the current one', () => {
    const otherYear = new Date().getFullYear() + 2;
    expect(formatDateDisplay(`${otherYear}-03-05`)).toContain(String(otherYear));
  });
});

describe('formatDateTime', () => {
  it('matches the booking summary format', () => {
    expect(formatDateTime('2026-08-26T14:30:00')).toBe('Wednesday, Aug 26 at 2:30 PM');
  });
});

describe('isBeforeToday', () => {
  it('is true for yesterday', () => {
    expect(isBeforeToday(addDays(getTodayDate(), -1))).toBe(true);
  });

  it('is false for today', () => {
    expect(isBeforeToday(getTodayDate())).toBe(false);
  });
});

describe('toDateString', () => {
  it('zero-pads month and day', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('formatMessageTime', () => {
  it('formats a Date as a wall clock', () => {
    expect(formatMessageTime(new Date(2026, 7, 26, 14, 5))).toBe('2:05 PM');
  });
});

describe('formatSessionDate', () => {
  it('formats an ISO instant as day and short month', () => {
    expect(formatSessionDate('2026-12-03T18:00:00.000Z')).toMatch(/^3 DEC$|^4 DEC$/);
  });

  it('returns an empty string for garbage rather than throwing', () => {
    expect(formatSessionDate('not-a-date')).toBe('');
  });
});
