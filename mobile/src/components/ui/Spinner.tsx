import { memo } from 'react';
import { ActivityIndicator } from 'react-native';
import { tokens } from '../../theme/tokens';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

/**
 * The web spinner is a CSS `animate-spin` border trick. RN has no CSS
 * keyframes, and ActivityIndicator is native, free and platform-correct.
 */
export const Spinner = memo(function Spinner({
  size = 'large',
  color = tokens.indigo600,
}: SpinnerProps) {
  return <ActivityIndicator size={size} color={color} />;
});
