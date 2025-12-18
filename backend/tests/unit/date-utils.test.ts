import { describe, it, expect } from 'vitest';
import {
  getLocalDateString,
  parseTimeToMinutes,
  formatMinutesToTime,
  toLocalISOString,
  parseLocalISOString,
} from '../../src/utils/date-utils';

describe('Date Utils', () => {
  describe('getLocalDateString', () => {
    it('should format a date as YYYY-MM-DD', () => {
      const date = new Date(2024, 5, 15); // June 15, 2024 (month is 0-indexed)
      expect(getLocalDateString(date)).toBe('2024-06-15');
    });

    it('should pad single-digit months with leading zero', () => {
      const date = new Date(2024, 0, 20); // January 20, 2024
      expect(getLocalDateString(date)).toBe('2024-01-20');
    });

    it('should pad single-digit days with leading zero', () => {
      const date = new Date(2024, 11, 5); // December 5, 2024
      expect(getLocalDateString(date)).toBe('2024-12-05');
    });

    it('should handle first day of year', () => {
      const date = new Date(2024, 0, 1); // January 1, 2024
      expect(getLocalDateString(date)).toBe('2024-01-01');
    });

    it('should handle last day of year', () => {
      const date = new Date(2024, 11, 31); // December 31, 2024
      expect(getLocalDateString(date)).toBe('2024-12-31');
    });

    it('should handle leap year February 29', () => {
      const date = new Date(2024, 1, 29); // February 29, 2024
      expect(getLocalDateString(date)).toBe('2024-02-29');
    });

    it('should default to current date when no argument provided', () => {
      const result = getLocalDateString();
      // Result should match YYYY-MM-DD format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle dates in different years', () => {
      expect(getLocalDateString(new Date(1999, 11, 31))).toBe('1999-12-31');
      expect(getLocalDateString(new Date(2000, 0, 1))).toBe('2000-01-01');
      expect(getLocalDateString(new Date(2099, 5, 15))).toBe('2099-06-15');
    });
  });

  describe('parseTimeToMinutes', () => {
    describe('valid inputs', () => {
      it('should parse midnight (00:00) to 0 minutes', () => {
        expect(parseTimeToMinutes('00:00')).toBe(0);
      });

      it('should parse 1:00 AM to 60 minutes', () => {
        expect(parseTimeToMinutes('01:00')).toBe(60);
      });

      it('should parse 9:30 AM to 570 minutes', () => {
        expect(parseTimeToMinutes('09:30')).toBe(570);
      });

      it('should parse noon (12:00) to 720 minutes', () => {
        expect(parseTimeToMinutes('12:00')).toBe(720);
      });

      it('should parse 2:00 PM (14:00) to 840 minutes', () => {
        expect(parseTimeToMinutes('14:00')).toBe(840);
      });

      it('should parse 6:30 PM (18:30) to 1110 minutes', () => {
        expect(parseTimeToMinutes('18:30')).toBe(1110);
      });

      it('should parse 11:59 PM (23:59) to 1439 minutes', () => {
        expect(parseTimeToMinutes('23:59')).toBe(1439);
      });

      it('should handle minutes correctly', () => {
        expect(parseTimeToMinutes('10:15')).toBe(615);
        expect(parseTimeToMinutes('10:30')).toBe(630);
        expect(parseTimeToMinutes('10:45')).toBe(645);
      });
    });

    describe('edge cases', () => {
      it('should parse times at hour boundaries', () => {
        expect(parseTimeToMinutes('00:59')).toBe(59);
        expect(parseTimeToMinutes('23:00')).toBe(1380);
      });

      it('should handle single digit hours without leading zero in split', () => {
        // Note: Our implementation expects HH:MM format with padding
        expect(parseTimeToMinutes('09:00')).toBe(540);
      });
    });

    describe('invalid inputs', () => {
      it('should throw error for invalid format (no colon)', () => {
        expect(() => parseTimeToMinutes('0930')).toThrow('Invalid time format: 0930');
      });

      it('should throw error for empty string', () => {
        expect(() => parseTimeToMinutes('')).toThrow('Invalid time format');
      });

      it('should throw error for non-numeric values', () => {
        expect(() => parseTimeToMinutes('ab:cd')).toThrow('Invalid time format: ab:cd');
      });

      it('should throw error for hours out of range (> 23)', () => {
        expect(() => parseTimeToMinutes('24:00')).toThrow('Invalid hours: 24');
        expect(() => parseTimeToMinutes('25:30')).toThrow('Invalid hours: 25');
      });

      it('should throw error for negative hours', () => {
        expect(() => parseTimeToMinutes('-1:00')).toThrow('Invalid hours: -1');
      });

      it('should throw error for minutes out of range (> 59)', () => {
        expect(() => parseTimeToMinutes('10:60')).toThrow('Invalid minutes: 60');
        expect(() => parseTimeToMinutes('10:99')).toThrow('Invalid minutes: 99');
      });

      it('should throw error for negative minutes', () => {
        expect(() => parseTimeToMinutes('10:-5')).toThrow('Invalid minutes: -5');
      });

      it('should throw error for multiple colons', () => {
        expect(() => parseTimeToMinutes('10:30:00')).toThrow('Invalid time format');
      });
    });
  });

  describe('formatMinutesToTime', () => {
    describe('valid inputs', () => {
      it('should format 0 minutes to 00:00', () => {
        expect(formatMinutesToTime(0)).toBe('00:00');
      });

      it('should format 60 minutes to 01:00', () => {
        expect(formatMinutesToTime(60)).toBe('01:00');
      });

      it('should format 570 minutes to 09:30', () => {
        expect(formatMinutesToTime(570)).toBe('09:30');
      });

      it('should format 720 minutes to 12:00 (noon)', () => {
        expect(formatMinutesToTime(720)).toBe('12:00');
      });

      it('should format 840 minutes to 14:00 (2 PM)', () => {
        expect(formatMinutesToTime(840)).toBe('14:00');
      });

      it('should format 1110 minutes to 18:30', () => {
        expect(formatMinutesToTime(1110)).toBe('18:30');
      });

      it('should format 1439 minutes to 23:59', () => {
        expect(formatMinutesToTime(1439)).toBe('23:59');
      });

      it('should pad single-digit hours with leading zero', () => {
        expect(formatMinutesToTime(30)).toBe('00:30');
        expect(formatMinutesToTime(90)).toBe('01:30');
        expect(formatMinutesToTime(540)).toBe('09:00');
      });

      it('should pad single-digit minutes with leading zero', () => {
        expect(formatMinutesToTime(61)).toBe('01:01');
        expect(formatMinutesToTime(605)).toBe('10:05');
      });
    });

    describe('edge cases', () => {
      it('should handle exact hour values', () => {
        for (let hour = 0; hour < 24; hour++) {
          const minutes = hour * 60;
          const expected = `${hour.toString().padStart(2, '0')}:00`;
          expect(formatMinutesToTime(minutes)).toBe(expected);
        }
      });

      it('should handle end of day', () => {
        expect(formatMinutesToTime(1439)).toBe('23:59');
      });
    });

    describe('invalid inputs', () => {
      it('should throw error for negative minutes', () => {
        expect(() => formatMinutesToTime(-1)).toThrow('Invalid minutes: -1');
        expect(() => formatMinutesToTime(-60)).toThrow('Invalid minutes: -60');
      });

      it('should throw error for minutes exceeding 23:59', () => {
        expect(() => formatMinutesToTime(1440)).toThrow('Invalid minutes: 1440');
        expect(() => formatMinutesToTime(1500)).toThrow('Invalid minutes: 1500');
      });
    });
  });

  describe('parseTimeToMinutes and formatMinutesToTime roundtrip', () => {
    it('should be reversible for all valid times', () => {
      const testTimes = [
        '00:00',
        '00:30',
        '01:00',
        '09:30',
        '12:00',
        '14:15',
        '18:45',
        '23:59',
      ];

      for (const time of testTimes) {
        const minutes = parseTimeToMinutes(time);
        const formatted = formatMinutesToTime(minutes);
        expect(formatted).toBe(time);
      }
    });

    it('should be reversible for all minute values', () => {
      for (let m = 0; m < 1440; m += 15) {
        const time = formatMinutesToTime(m);
        const parsed = parseTimeToMinutes(time);
        expect(parsed).toBe(m);
      }
    });
  });

  describe('toLocalISOString', () => {
    it('should combine date and time into ISO format', () => {
      expect(toLocalISOString('2024-06-15', '09:30')).toBe('2024-06-15T09:30:00');
    });

    it('should handle midnight', () => {
      expect(toLocalISOString('2024-01-01', '00:00')).toBe('2024-01-01T00:00:00');
    });

    it('should handle end of day', () => {
      expect(toLocalISOString('2024-12-31', '23:59')).toBe('2024-12-31T23:59:00');
    });

    it('should handle various dates and times', () => {
      expect(toLocalISOString('2024-02-29', '12:00')).toBe('2024-02-29T12:00:00');
      expect(toLocalISOString('1999-12-31', '18:30')).toBe('1999-12-31T18:30:00');
      expect(toLocalISOString('2099-07-04', '14:15')).toBe('2099-07-04T14:15:00');
    });
  });

  describe('parseLocalISOString', () => {
    it('should parse ISO string into date and time components', () => {
      const result = parseLocalISOString('2024-06-15T09:30:00');
      expect(result.date).toBe('2024-06-15');
      expect(result.time).toBe('09:30');
    });

    it('should handle midnight', () => {
      const result = parseLocalISOString('2024-01-01T00:00:00');
      expect(result.date).toBe('2024-01-01');
      expect(result.time).toBe('00:00');
    });

    it('should handle end of day', () => {
      const result = parseLocalISOString('2024-12-31T23:59:00');
      expect(result.date).toBe('2024-12-31');
      expect(result.time).toBe('23:59');
    });

    it('should handle various dates and times', () => {
      expect(parseLocalISOString('2024-02-29T12:00:00')).toEqual({
        date: '2024-02-29',
        time: '12:00',
      });
      expect(parseLocalISOString('1999-12-31T18:30:00')).toEqual({
        date: '1999-12-31',
        time: '18:30',
      });
    });

    describe('invalid inputs', () => {
      it('should throw error for missing T separator', () => {
        expect(() => parseLocalISOString('2024-06-15 09:30:00')).toThrow(
          'Invalid ISO datetime format'
        );
      });

      it('should throw error for missing seconds', () => {
        expect(() => parseLocalISOString('2024-06-15T09:30')).toThrow(
          'Invalid ISO datetime format'
        );
      });

      it('should throw error for timezone suffix', () => {
        expect(() => parseLocalISOString('2024-06-15T09:30:00Z')).toThrow(
          'Invalid ISO datetime format'
        );
      });

      it('should throw error for empty string', () => {
        expect(() => parseLocalISOString('')).toThrow('Invalid ISO datetime format');
      });

      it('should throw error for date only', () => {
        expect(() => parseLocalISOString('2024-06-15')).toThrow('Invalid ISO datetime format');
      });

      it('should throw error for time only', () => {
        expect(() => parseLocalISOString('09:30:00')).toThrow('Invalid ISO datetime format');
      });
    });
  });

  describe('toLocalISOString and parseLocalISOString roundtrip', () => {
    it('should be reversible for all valid date/time combinations', () => {
      const testCases = [
        { date: '2024-01-01', time: '00:00' },
        { date: '2024-06-15', time: '09:30' },
        { date: '2024-12-31', time: '23:59' },
        { date: '2024-02-29', time: '12:00' },
        { date: '1999-12-31', time: '18:30' },
        { date: '2099-07-04', time: '14:15' },
      ];

      for (const { date, time } of testCases) {
        const isoString = toLocalISOString(date, time);
        const parsed = parseLocalISOString(isoString);
        expect(parsed.date).toBe(date);
        expect(parsed.time).toBe(time);
      }
    });

    it('should roundtrip all hours of a day', () => {
      const date = '2024-06-15';
      for (let hour = 0; hour < 24; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        const isoString = toLocalISOString(date, time);
        const parsed = parseLocalISOString(isoString);
        expect(parsed.date).toBe(date);
        expect(parsed.time).toBe(time);
      }
    });

    it('should roundtrip various minute values', () => {
      const date = '2024-06-15';
      const minutes = ['00', '15', '30', '45', '59'];
      for (const min of minutes) {
        const time = `10:${min}`;
        const isoString = toLocalISOString(date, time);
        const parsed = parseLocalISOString(isoString);
        expect(parsed.date).toBe(date);
        expect(parsed.time).toBe(time);
      }
    });
  });
});
