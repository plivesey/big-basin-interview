import { memo } from 'react';
import { View, Text } from 'react-native';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { typography } from '../../theme/classes';
import { formatDateTime } from '../../utils/datetime';

interface BookingConfirmationProps {
  providerName: string;
  serviceType: string;
  scheduledAt: string;
  address: string;
  isConfirming: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

export const BookingConfirmation = memo(function BookingConfirmation({
  providerName,
  serviceType,
  scheduledAt,
  address,
  isConfirming,
  onConfirm,
  onBack,
}: BookingConfirmationProps) {
  return (
    <View className="gap-6">
      <Text className={typography.heading3}>Confirm your booking</Text>

      <Card variant="info">
        <Row label="Provider" value={providerName} />
        <Row label="Service" value={serviceType} />
        <Row label="When" value={formatDateTime(scheduledAt)} />
        <Row label="Where" value={address} last />
      </Card>

      <View className="gap-3">
        <Button onPress={onConfirm} loading={isConfirming} size="large" testID="confirm-booking">
          Confirm booking
        </Button>
        <Button variant="secondary" onPress={onBack} disabled={isConfirming}>
          Back
        </Button>
      </View>
    </View>
  );
});

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={last ? '' : 'mb-3'}>
      <Text className="text-xs font-medium text-slate-500 uppercase">{label}</Text>
      <Text className="text-base text-gray-800 mt-0.5">{value}</Text>
    </View>
  );
}
