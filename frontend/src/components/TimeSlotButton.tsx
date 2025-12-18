import { memo } from 'react';
import type { TimeSlot } from '@asba/shared-types';

interface TimeSlotButtonProps {
  slot: TimeSlot;
  isSelected: boolean;
  onSelect: (slot: TimeSlot) => void;
}

/**
 * Format time from ISO string to display format (e.g., "9:00 AM")
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Individual time slot button with available/selected/disabled states.
 */
export const TimeSlotButton = memo(function TimeSlotButton({
  slot,
  isSelected,
  onSelect,
}: TimeSlotButtonProps) {
  const timeDisplay = formatTime(slot.start);

  if (!slot.available) {
    return (
      <button
        type="button"
        disabled
        className="time-slot-disabled"
        aria-label={`${timeDisplay} - unavailable`}
      >
        {timeDisplay}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(slot)}
      className={isSelected ? 'time-slot-selected' : 'time-slot-available'}
      aria-pressed={isSelected}
      aria-label={`${timeDisplay}${isSelected ? ' - selected' : ''}`}
    >
      {timeDisplay}
    </button>
  );
});
