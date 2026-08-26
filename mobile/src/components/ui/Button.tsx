import { memo, type ReactNode } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { button } from '../../theme/classes';
import { tokens } from '../../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'icon';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  children?: ReactNode;
  /** Extra classes for the button surface. */
  className?: string;
  testID?: string;
}

const VARIANTS = {
  primary: { rest: button.primary, pressed: button.primaryPressed },
  secondary: { rest: button.secondary, pressed: button.secondaryPressed },
  text: { rest: button.textOnly, pressed: button.textOnlyPressed },
  icon: { rest: button.icon, pressed: button.iconPressed },
} as const;

export const Button = memo(function Button({
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  accessibilityLabel,
  children,
  className = '',
  testID,
}: ButtonProps) {
  const isInert = disabled || loading;
  const sizing = variant === 'text' || variant === 'icon' ? '' : button.size[size];

  // NativeWind's className is a plain string, so the pressed palette is applied
  // to an inner surface driven by Pressable's render prop rather than by a
  // className callback.
  return (
    <Pressable
      onPress={isInert ? undefined : onPress}
      disabled={isInert}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isInert, busy: loading }}
      testID={testID}
    >
      {({ pressed }: { pressed: boolean }) => {
        const palette = isInert
          ? button.disabled
          : pressed
            ? VARIANTS[variant].pressed
            : VARIANTS[variant].rest;

        return (
          <View className={`${button.base} ${sizing} ${palette.container} ${className}`}>
            {loading ? (
              <ActivityIndicator size="small" color={tokens.white} />
            ) : typeof children === 'string' ? (
              <Text className={`${button.textSize[size]} ${palette.text}`}>{children}</Text>
            ) : (
              children
            )}
          </View>
        );
      }}
    </Pressable>
  );
});
