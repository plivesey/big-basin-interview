import { memo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

/**
 * The web version uses Tailwind's `animate-bounce`. NativeWind has no CSS
 * keyframes, so this is the Reanimated equivalent.
 */
function Dot({ delay }: { delay: number }) {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(-4, { duration: 300 }), withTiming(0, { duration: 300 })), -1)
    );
    return () => cancelAnimation(offset);
  }, [delay, offset]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  return <Animated.View style={style} className="w-1.5 h-1.5 rounded-full bg-slate-400 mx-0.5" />;
}

export const TypingDots = memo(function TypingDots() {
  return (
    <View className="flex-row items-center mt-1" accessibilityLabel="Scout is typing">
      <Dot delay={0} />
      <Dot delay={100} />
      <Dot delay={200} />
    </View>
  );
});
