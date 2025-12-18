import { describe, it, expect } from 'vitest';
import { annotateWithConflicts } from '../../src/utils/slot-conflict-checker';
import type { TimeSlot } from '@asba/shared-types';
import type { CalendarConflict } from '../../src/types/calendar.types';

describe('slot-conflict-checker', () => {
  describe('annotateWithConflicts', () => {
    const createSlot = (start: string, end: string, available = true): TimeSlot => ({
      start,
      end,
      available,
    });

    const createEvent = (id: string, title: string, start: string, end: string): CalendarConflict => ({
      id,
      title,
      start,
      end,
    });

    it('should return slots unchanged when no calendar events', () => {
      const slots: TimeSlot[] = [
        createSlot('2025-12-18T09:00:00', '2025-12-18T09:30:00'),
        createSlot('2025-12-18T09:30:00', '2025-12-18T10:00:00'),
      ];

      const result = annotateWithConflicts(slots, []);

      expect(result).toEqual(slots);
      expect(result[0].conflict).toBeUndefined();
      expect(result[1].conflict).toBeUndefined();
    });

    it('should annotate slot that overlaps with calendar event', () => {
      const slots: TimeSlot[] = [
        createSlot('2025-12-18T09:00:00', '2025-12-18T09:30:00'),
        createSlot('2025-12-18T09:30:00', '2025-12-18T10:00:00'),
        createSlot('2025-12-18T10:00:00', '2025-12-18T10:30:00'),
      ];

      const events: CalendarConflict[] = [
        createEvent('evt1', 'Team Meeting', '2025-12-18T09:00:00', '2025-12-18T10:00:00'),
      ];

      const result = annotateWithConflicts(slots, events);

      expect(result[0].conflict).toEqual({ eventTitle: 'Team Meeting' });
      expect(result[1].conflict).toEqual({ eventTitle: 'Team Meeting' });
      expect(result[2].conflict).toBeUndefined();
    });

    it('should detect partial overlap at start of slot', () => {
      const slots: TimeSlot[] = [
        createSlot('2025-12-18T10:00:00', '2025-12-18T10:30:00'),
      ];

      const events: CalendarConflict[] = [
        createEvent('evt1', 'Early Meeting', '2025-12-18T09:30:00', '2025-12-18T10:15:00'),
      ];

      const result = annotateWithConflicts(slots, events);

      expect(result[0].conflict).toEqual({ eventTitle: 'Early Meeting' });
    });

    it('should detect partial overlap at end of slot', () => {
      const slots: TimeSlot[] = [
        createSlot('2025-12-18T10:00:00', '2025-12-18T10:30:00'),
      ];

      const events: CalendarConflict[] = [
        createEvent('evt1', 'Late Meeting', '2025-12-18T10:15:00', '2025-12-18T11:00:00'),
      ];

      const result = annotateWithConflicts(slots, events);

      expect(result[0].conflict).toEqual({ eventTitle: 'Late Meeting' });
    });

    it('should detect event fully contained within slot', () => {
      const slots: TimeSlot[] = [
        createSlot('2025-12-18T10:00:00', '2025-12-18T11:00:00'),
      ];

      const events: CalendarConflict[] = [
        createEvent('evt1', 'Short Call', '2025-12-18T10:15:00', '2025-12-18T10:45:00'),
      ];

      const result = annotateWithConflicts(slots, events);

      expect(result[0].conflict).toEqual({ eventTitle: 'Short Call' });
    });

    it('should detect slot fully contained within event', () => {
      const slots: TimeSlot[] = [
        createSlot('2025-12-18T10:00:00', '2025-12-18T10:30:00'),
      ];

      const events: CalendarConflict[] = [
        createEvent('evt1', 'All Day Event', '2025-12-18T09:00:00', '2025-12-18T17:00:00'),
      ];

      const result = annotateWithConflicts(slots, events);

      expect(result[0].conflict).toEqual({ eventTitle: 'All Day Event' });
    });

    it('should NOT detect adjacent events (no overlap)', () => {
      const slots: TimeSlot[] = [
        createSlot('2025-12-18T10:00:00', '2025-12-18T10:30:00'),
      ];

      // Event ends exactly when slot starts - no overlap
      const events: CalendarConflict[] = [
        createEvent('evt1', 'Previous Meeting', '2025-12-18T09:30:00', '2025-12-18T10:00:00'),
      ];

      const result = annotateWithConflicts(slots, events);

      expect(result[0].conflict).toBeUndefined();
    });

    it('should NOT detect adjacent events at slot end (no overlap)', () => {
      const slots: TimeSlot[] = [
        createSlot('2025-12-18T10:00:00', '2025-12-18T10:30:00'),
      ];

      // Event starts exactly when slot ends - no overlap
      const events: CalendarConflict[] = [
        createEvent('evt1', 'Next Meeting', '2025-12-18T10:30:00', '2025-12-18T11:00:00'),
      ];

      const result = annotateWithConflicts(slots, events);

      expect(result[0].conflict).toBeUndefined();
    });

    it('should use first conflicting event when multiple events overlap', () => {
      const slots: TimeSlot[] = [
        createSlot('2025-12-18T10:00:00', '2025-12-18T10:30:00'),
      ];

      const events: CalendarConflict[] = [
        createEvent('evt1', 'First Meeting', '2025-12-18T10:00:00', '2025-12-18T10:15:00'),
        createEvent('evt2', 'Second Meeting', '2025-12-18T10:15:00', '2025-12-18T10:30:00'),
      ];

      const result = annotateWithConflicts(slots, events);

      // Should use the first event found
      expect(result[0].conflict).toEqual({ eventTitle: 'First Meeting' });
    });

    it('should preserve other slot properties when adding conflict', () => {
      const slots: TimeSlot[] = [
        createSlot('2025-12-18T10:00:00', '2025-12-18T10:30:00', false),
      ];

      const events: CalendarConflict[] = [
        createEvent('evt1', 'Meeting', '2025-12-18T10:00:00', '2025-12-18T11:00:00'),
      ];

      const result = annotateWithConflicts(slots, events);

      expect(result[0]).toEqual({
        start: '2025-12-18T10:00:00',
        end: '2025-12-18T10:30:00',
        available: false,
        conflict: { eventTitle: 'Meeting' },
      });
    });

    it('should handle empty slots array', () => {
      const events: CalendarConflict[] = [
        createEvent('evt1', 'Meeting', '2025-12-18T10:00:00', '2025-12-18T11:00:00'),
      ];

      const result = annotateWithConflicts([], events);

      expect(result).toEqual([]);
    });

    it('should handle multiple slots with multiple events', () => {
      const slots: TimeSlot[] = [
        createSlot('2025-12-18T09:00:00', '2025-12-18T09:30:00'),
        createSlot('2025-12-18T09:30:00', '2025-12-18T10:00:00'),
        createSlot('2025-12-18T10:00:00', '2025-12-18T10:30:00'),
        createSlot('2025-12-18T10:30:00', '2025-12-18T11:00:00'),
        createSlot('2025-12-18T11:00:00', '2025-12-18T11:30:00'),
      ];

      const events: CalendarConflict[] = [
        createEvent('evt1', 'Morning Standup', '2025-12-18T09:00:00', '2025-12-18T09:15:00'),
        createEvent('evt2', 'Lunch', '2025-12-18T10:30:00', '2025-12-18T11:30:00'),
      ];

      const result = annotateWithConflicts(slots, events);

      expect(result[0].conflict).toEqual({ eventTitle: 'Morning Standup' });
      expect(result[1].conflict).toBeUndefined();
      expect(result[2].conflict).toBeUndefined();
      expect(result[3].conflict).toEqual({ eventTitle: 'Lunch' });
      expect(result[4].conflict).toEqual({ eventTitle: 'Lunch' });
    });
  });
});
