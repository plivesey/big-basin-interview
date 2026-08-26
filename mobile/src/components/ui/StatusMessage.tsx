import { memo } from 'react';
import { View, Text } from 'react-native';
import { statusMessage } from '../../theme/classes';

export type StatusVariant = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps {
  variant?: StatusVariant;
  message: string;
}

export const StatusMessage = memo(function StatusMessage({
  variant = 'info',
  message,
}: StatusMessageProps) {
  const palette = statusMessage[variant];
  return (
    <View className={`${statusMessage.base} ${palette.container}`} accessibilityRole="alert">
      <Text className={`flex-1 text-sm ${palette.text}`}>{message}</Text>
    </View>
  );
});
