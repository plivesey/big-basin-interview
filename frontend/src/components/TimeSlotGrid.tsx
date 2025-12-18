import { memo, useMemo } from 'react';
import type { TimeSlot } from '@asba/shared-types';
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
 * Format date for display (e.g., "Tuesday, Dec 17")
 */
function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get the next 7 days for the date picker
 */
function getDateOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const value = date.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDateDisplay(value);
    options.push({ value, label });
  }

  return options;
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
  const dateOptions = useMemo(() => getDateOptions(), []);

  // Filter to only available slots for display count
  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className="space-y-4">
      {/* Date Picker */}
      <div>
        <label htmlFor="date-select" className="label-text">
          Pick your preferred date
        </label>
        <select
          id="date-select"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="input"
          disabled={isLoading}
        >
          {dateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Time Slots */}
      <div>
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
