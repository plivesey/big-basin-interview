import { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { TimeSlot } from '@asba/shared-types';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { TimeSlotButton } from './TimeSlotButton';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  selectedDate: string;
  isLoading: boolean;
  onSlotSelect: (slot: TimeSlot) => void;
  onDateChange: (date: string) => void;
}

/**
 * Format a date to YYYY-MM-DD in local timezone
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
function getTodayDate(): string {
  return formatLocalDate(new Date());
}

/**
 * Add days to a date string and return new date string
 */
function addDays(dateString: string, days: number): string {
  const date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

/**
 * Format date for display: "Today", "Tomorrow", or "Thursday, December 3rd"
 */
function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Compare date-only strings
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
    // "Thursday, December 19"
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  } else {
    // "Thursday, December 19, 2026"
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

/**
 * Grid of time slots with date picker and loading/empty states.
 */
export const TimeSlotGrid = memo(function TimeSlotGrid({
  slots,
  selectedSlot,
  selectedDate,
  isLoading,
  onSlotSelect,
  onDateChange,
}: TimeSlotGridProps) {
  const todayDate = useMemo(() => getTodayDate(), []);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Can only go back if not already on today
  const canGoBack = selectedDate > todayDate;

  const navigateDate = useCallback(
    (delta: number) => {
      const newDate = addDays(selectedDate, delta);
      // Don't allow navigating to past dates
      if (newDate >= todayDate) {
        onDateChange(newDate);
      }
    },
    [selectedDate, todayDate, onDateChange]
  );

  // Close calendar when clicking outside
  useEffect(() => {
    if (!isCalendarOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    // Add listener after a small delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Handle date selection from calendar
  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        onDateChange(formatLocalDate(date));
        setIsCalendarOpen(false);
      }
    },
    [onDateChange]
  );

  // Filter to only available slots for display count
  const availableCount = slots.filter((s) => s.available).length;

  // Parse selected date for DayPicker
  const selectedDateObj = useMemo(() => new Date(selectedDate + 'T00:00:00'), [selectedDate]);

  // Today for disabling past dates
  const today = useMemo(() => new Date(), []);

  return (
    <div className="space-y-4">
      {/* Date Picker */}
      <div className="relative">
        <label className="label-text">Pick your preferred date</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateDate(-1)}
            disabled={isLoading || !canGoBack}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-300"
            aria-label="Previous day"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Clickable date display button */}
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            disabled={isLoading}
            className="input flex-1 text-left cursor-pointer hover:border-slate-400 disabled:cursor-not-allowed"
          >
            {formatDateDisplay(selectedDate)}
          </button>

          <button
            type="button"
            onClick={() => navigateDate(1)}
            disabled={isLoading}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-300"
            aria-label="Next day"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Calendar Dropdown */}
        {isCalendarOpen && (
          <div
            ref={calendarRef}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-fit"
          >
            <DayPicker
              mode="single"
              selected={selectedDateObj}
              onSelect={handleDateSelect}
              disabled={{ before: today }}
              defaultMonth={selectedDateObj}
              className="date-picker-calendar"
            />
          </div>
        )}
      </div>

      {/* Time Slots - min height prevents layout jumps */}
      <div className="min-h-[320px]">
        <h4 className="label-text">Available times</h4>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="spinner" />
            <span className="ml-3 text-slate-600">Finding available times...</span>
          </div>
        ) : availableCount === 0 ? (
          <div className="text-center py-8 text-slate-600">
            <p>No times available on this date.</p>
            <p className="text-sm mt-1">Try choosing another day.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((slot) => (
              <TimeSlotButton
                key={slot.start}
                slot={slot}
                isSelected={selectedSlot?.start === slot.start}
                onSelect={onSlotSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
