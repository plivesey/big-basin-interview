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
 * Individual time slot button with available/selected/disabled/conflict states.
 */
export const TimeSlotButton = memo(function TimeSlotButton({
  slot,
  isSelected,
  onSelect,
}: TimeSlotButtonProps) {
  const timeDisplay = formatTime(slot.start);
  const hasConflict = !!slot.conflict;

  // Unavailable slots are disabled
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

  // Determine class based on selected/conflict state
  let className: string;
  if (isSelected) {
    className = 'time-slot-selected';
  } else if (hasConflict) {
    className = 'time-slot-conflict';
  } else {
    className = 'time-slot-available';
  }

  // Build aria-label
  const ariaLabel = `${timeDisplay}${isSelected ? ' - selected' : ''}${hasConflict ? ' - has calendar conflict' : ''}`;

  // Build tooltip text for conflicts (used as data attribute for CSS tooltip)
  const tooltipText = hasConflict
    ? `Conflicts with: ${slot.conflict!.eventTitle}`
    : undefined;

  return (
    <button
      type="button"
      onClick={() => onSelect(slot)}
      className={className}
      aria-pressed={isSelected}
      aria-label={ariaLabel}
      data-tooltip={tooltipText}
    >
      {timeDisplay}
    </button>
  );
});
