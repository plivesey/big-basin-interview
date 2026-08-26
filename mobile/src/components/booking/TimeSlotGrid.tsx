import { memo, useCallback, useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { TimeSlot } from '@asba/shared-types';
import { TimeSlotButton } from './TimeSlotButton';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { ChevronIcon } from '../../theme/icons';
import { typography, input as inputClasses } from '../../theme/classes';
import {
  addDays,
  formatDateDisplay,
  getTodayDate,
  isBeforeToday,
  parseNaive,
  toDateString,
} from '../../utils/datetime';

interface TimeSlotGridProps {
  date: string;
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  isLoading: boolean;
  onDateChange: (date: string) => void;
  onSlotSelect: (slot: TimeSlot) => void;
}

export const TimeSlotGrid = memo(function TimeSlotGrid({
  date,
  slots,
  selectedSlot,
  isLoading,
  onDateChange,
  onSlotSelect,
}: TimeSlotGridProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const canGoBack = !isBeforeToday(addDays(date, -1));

  const handlePrev = useCallback(() => {
    if (canGoBack) onDateChange(addDays(date, -1));
  }, [canGoBack, date, onDateChange]);

  const handleNext = useCallback(() => onDateChange(addDays(date, 1)), [date, onDateChange]);

  const handlePicked = useCallback(
    (_event: DateTimePickerEvent, picked?: Date) => {
      if (picked) onDateChange(toDateString(picked));
    },
    [onDateChange]
  );

  const parsed = parseNaive(date);
  const pickerValue = parsed
    ? new Date(parsed.year, parsed.month - 1, parsed.day)
    : new Date();

  const conflict = selectedSlot?.conflict;

  return (
    <View className="gap-4">
      <View>
        <Text className={typography.label}>Pick your preferred date</Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={handlePrev}
            disabled={!canGoBack}
            accessibilityRole="button"
            accessibilityLabel="Previous day"
          >
            <View
              className={`w-10 h-10 rounded-lg border items-center justify-center ${
                canGoBack ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <ChevronIcon direction="left" />
            </View>
          </Pressable>

          <Pressable
            className="flex-1"
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Choose a date"
            testID="date-button"
          >
            <View className={inputClasses.base}>
              <Text className="text-base text-gray-800">{formatDateDisplay(date)}</Text>
            </View>
          </Pressable>

          <Pressable onPress={handleNext} accessibilityRole="button" accessibilityLabel="Next day">
            <View className="w-10 h-10 rounded-lg border border-slate-300 bg-white items-center justify-center">
              <ChevronIcon direction="right" />
            </View>
          </Pressable>
        </View>
      </View>

      {/* min height mirrors the web's min-h-[320px]: it stops the sheet jumping
          while a new day's slots load. */}
      <View className="min-h-[320px]">
        <Text className={typography.label}>Available times</Text>

        {isLoading ? (
          <View className="flex-row items-center justify-center py-8">
            <Spinner />
            <Text className="ml-3 text-slate-600">Finding available times...</Text>
          </View>
        ) : slots.length === 0 ? (
          <View className="items-center py-8">
            <Text className="text-slate-600">No times available on this date.</Text>
            <Text className="text-sm text-slate-500 mt-1">Try choosing another day.</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {slots.map((slot) => (
              <TimeSlotButton
                key={slot.start}
                slot={slot}
                isSelected={selectedSlot?.start === slot.start}
                onSelect={onSlotSelect}
              />
            ))}
          </View>
        )}

        {conflict ? (
          <View className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <Text className="text-sm text-amber-700">
              Heads up — that time overlaps &ldquo;{conflict.eventTitle}&rdquo; on your calendar.
            </Text>
          </View>
        ) : null}
      </View>

      <Modal visible={pickerOpen} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center px-6">
          <View className="bg-white rounded-xl p-4">
            <DateTimePicker
              value={pickerValue}
              mode="date"
              display="inline"
              minimumDate={
                parseNaive(getTodayDate())
                  ? new Date(
                      parseNaive(getTodayDate())!.year,
                      parseNaive(getTodayDate())!.month - 1,
                      parseNaive(getTodayDate())!.day
                    )
                  : undefined
              }
              onChange={handlePicked}
            />
            <Button variant="secondary" onPress={() => setPickerOpen(false)} className="mt-2">
              Done
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
});
