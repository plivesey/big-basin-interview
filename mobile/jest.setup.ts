// @testing-library/react-native v13 registers its jest matchers automatically;
// there is no extend-expect entry point to import.

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

// Reanimated reaches for the worklets native module at import time, and its
// own bundled mock does too, so anything that renders an animated component
// needs a stand-in that never loads the real package. Animations are a no-op
// under test; assert behaviour, not motion.
jest.mock('react-native-reanimated', () => {
  const { View, Text } = require('react-native');
  const entry = { duration: () => entry, delay: () => entry, springify: () => entry };

  return {
    __esModule: true,
    default: { View, Text, createAnimatedComponent: (component: unknown) => component },
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    withTiming: (value: unknown) => value,
    withDelay: (_delay: number, value: unknown) => value,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    withRepeat: (value: unknown) => value,
    cancelAnimation: () => {},
    FadeIn: entry,
    FadeOut: entry,
  };
});

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
  setOptions: jest.fn(),
}));
