import { memo, type ReactNode } from 'react';
import { View, Text } from 'react-native';
import { badge } from '../../theme/classes';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

const DOT: Record<BadgeVariant, string> = {
  primary: 'bg-indigo-600',
  success: 'bg-green-600',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  neutral: 'bg-slate-400',
};

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: ReactNode;
}

export const Badge = memo(function Badge({
  variant = 'neutral',
  dot = false,
  children,
}: BadgeProps) {
  const palette = badge[variant];
  return (
    <View className={`${badge.base} ${palette.container}`}>
      {dot && <View className={`w-2 h-2 rounded-full mr-1.5 ${DOT[variant]}`} />}
      <Text className={`${badge.text} ${palette.text}`}>{children}</Text>
    </View>
  );
});
