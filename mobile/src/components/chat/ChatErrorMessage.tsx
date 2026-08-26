import { memo } from 'react';
import { View, Text } from 'react-native';
import { Button } from '../ui/Button';
import { WarningIcon } from '../../theme/icons';

interface ChatErrorMessageProps {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ChatErrorMessage = memo(function ChatErrorMessage({
  message,
  onRetry,
  isRetrying = false,
}: ChatErrorMessageProps) {
  return (
    <View className="w-full items-start mb-3">
      <View className="w-[86%] px-4 py-3 bg-red-50 rounded-2xl rounded-tl-sm border border-red-200">
        <View className="flex-row items-start gap-3">
          <View className="mt-0.5">
            <WarningIcon />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-red-700">{message}</Text>
            {onRetry ? (
              <Button
                variant="text"
                size="small"
                onPress={onRetry}
                loading={isRetrying}
                disabled={isRetrying}
                className="mt-2 self-start"
              >
                Try again
              </Button>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
});
