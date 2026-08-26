import { memo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { TimeSlot } from '@asba/shared-types';
import { timeSlot as slotClasses } from '../../theme/classes';
import { formatTime } from '../../utils/datetime';

interface TimeSlotButtonProps {
  slot: TimeSlot;
  isSelected: boolean;
  onSelect: (slot: TimeSlot) => void;
}

/**
 * Four states, same as web. The one thing that does not port is the conflict
 * tooltip: the web draws it with `.time-slot-conflict::after` on hover, and
 * touch has no hover. Selecting a conflicted slot surfaces a persistent
 * ConflictBanner under the grid instead -- see TimeSlotGrid.
 */
export const TimeSlotButton = memo(function TimeSlotButton({
  slot,
  isSelected,
  onSelect,
}: TimeSlotButtonProps) {
  const timeDisplay = formatTime(slot.start);
  const hasConflict = !!slot.conflict;

  const handlePress = useCallback(() => onSelect(slot), [onSelect, slot]);

  if (!slot.available) {
    return (
      <View
        className={`${slotClasses.base} ${slotClasses.disabled.container} w-[31%]`}
        accessibilityLabel={`${timeDisplay} - unavailable`}
      >
        <Text className={`${slotClasses.baseText} ${slotClasses.disabled.text}`}>
          {timeDisplay}
        </Text>
      </View>
    );
  }

  const palette = isSelected
    ? slotClasses.selected
    : hasConflict
      ? slotClasses.conflict
      : slotClasses.available;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${timeDisplay}${isSelected ? ' - selected' : ''}${
        hasConflict ? ' - has calendar conflict' : ''
      }`}
      className="w-[31%]"
      testID={`slot-${slot.start}`}
    >
      <View className={`${slotClasses.base} ${palette.container}`}>
        <Text className={`${slotClasses.baseText} ${palette.text}`}>{timeDisplay}</Text>
      </View>
    </Pressable>
  );
});
