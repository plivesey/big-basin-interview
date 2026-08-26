import { memo } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface CopyToastProps {
  visible: boolean;
}

/**
 * Confirmation that a message made it to the clipboard.
 *
 * Deliberately plain: one line, no icon, no action. It exists so the long-press
 * gesture has visible feedback, not to be looked at.
 */
export const CopyToast = memo(function CopyToast({ visible }: CopyToastProps) {
  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(120)}
      exiting={FadeOut.duration(200)}
      className="items-center py-3"
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
      <View className="px-4 py-2 rounded-full bg-gray-800">
        <Text className="text-sm font-medium text-white">Copied</Text>
      </View>
    </Animated.View>
  );
});
