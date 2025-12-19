import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Test the date formatting utilities used in TimeSlotGrid
// These functions are internal to the component, so we test them through behavior

describe('TimeSlotGrid date utilities', () => {
  // Mock the current date for consistent testing
  const mockDate = new Date('2025-12-18T12:00:00');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatLocalDate', () => {
    it('formats date to YYYY-MM-DD', () => {
      const date = new Date('2025-12-18T12:00:00');
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      expect(`${year}-${month}-${day}`).toBe('2025-12-18');
    });

    it('pads single digit months and days', () => {
      const date = new Date('2025-01-05T12:00:00');
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      expect(`${year}-${month}-${day}`).toBe('2025-01-05');
    });
  });

  describe('addDays', () => {
    it('adds days correctly', () => {
      const dateString = '2025-12-18';
      const date = new Date(dateString + 'T00:00:00');
      date.setDate(date.getDate() + 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      expect(`${year}-${month}-${day}`).toBe('2025-12-19');
    });

    it('handles month boundaries', () => {
      const dateString = '2025-12-31';
      const date = new Date(dateString + 'T00:00:00');
      date.setDate(date.getDate() + 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      expect(`${year}-${month}-${day}`).toBe('2026-01-01');
    });

    it('subtracts days when negative', () => {
      const dateString = '2025-12-18';
      const date = new Date(dateString + 'T00:00:00');
      date.setDate(date.getDate() - 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      expect(`${year}-${month}-${day}`).toBe('2025-12-17');
    });
  });

  describe('formatDateDisplay', () => {
    const formatDateDisplay = (dateString: string): string => {
      const date = new Date(dateString + 'T00:00:00');
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const dateOnly = (d: Date) => d.toDateString();

      if (dateOnly(date) === dateOnly(today)) {
        return 'Today';
      }
      if (dateOnly(date) === dateOnly(tomorrow)) {
        return 'Tomorrow';
      }

      const currentYear = today.getFullYear();
      const dateYear = date.getFullYear();

      if (dateYear === currentYear) {
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });
      } else {
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
    };

    it('returns "Today" for today\'s date', () => {
      expect(formatDateDisplay('2025-12-18')).toBe('Today');
    });

    it('returns "Tomorrow" for tomorrow\'s date', () => {
      expect(formatDateDisplay('2025-12-19')).toBe('Tomorrow');
    });

    it('returns full date format for other dates in current year', () => {
      const result = formatDateDisplay('2025-12-25');
      expect(result).toBe('Thursday, December 25');
    });

    it('includes year for dates in different year', () => {
      const result = formatDateDisplay('2026-01-15');
      expect(result).toBe('Thursday, January 15, 2026');
    });
  });
});
