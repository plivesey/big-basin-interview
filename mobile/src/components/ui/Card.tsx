import { memo, type ReactNode } from 'react';
import { View } from 'react-native';
import { card } from '../../theme/classes';

export type CardVariant = 'default' | 'selected' | 'info';

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
}

export const Card = memo(function Card({
  variant = 'default',
  className = '',
  children,
}: CardProps) {
  const base = variant === 'selected' ? card.selected : variant === 'info' ? card.info : card.base;
  return <View className={`${base} ${className}`}>{children}</View>;
});
