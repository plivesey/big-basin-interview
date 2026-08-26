import { memo } from 'react';
import { View, Text } from 'react-native';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { typography } from '../../theme/classes';
import { formatDateTime } from '../../utils/datetime';
import type { BookingResult } from '../../store/booking-store';

interface BookingSuccessProps {
  result: BookingResult;
  onDone: () => void;
}

export const BookingSuccess = memo(function BookingSuccess({
  result,
  onDone,
}: BookingSuccessProps) {
  return (
    <View className="gap-6">
      <View className="items-center">
        <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
          <Text className="text-3xl text-green-700">✓</Text>
        </View>
        <Text className={`${typography.heading3} text-center`}>You&apos;re all set!</Text>
        <Text className="text-slate-600 text-center mt-1">
          {result.serviceType} with {result.providerName}
        </Text>
      </View>

      <Card variant="info">
        <Text className="text-base text-gray-800">{formatDateTime(result.scheduledAt)}</Text>
        <Text className="text-xs text-slate-500 mt-2">Booking {result.bookingId}</Text>
        {result.calendarEventAdded ? (
          <Text className="text-sm text-green-700 mt-2">I&apos;ve added it to your calendar.</Text>
        ) : null}
      </Card>

      <Button onPress={onDone} size="large" testID="booking-done">
        Done
      </Button>
    </View>
  );
});
