import { ReactNode, HTMLAttributes } from 'react';

type CardVariant = 'default' | 'hover' | 'selected' | 'info';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

export function Card({
  variant = 'default',
  children,
  className = '',
  ...props
}: CardProps) {
  const variantClasses: Record<CardVariant, string> = {
    default: 'card',
    hover: 'card-hover',
    selected: 'card-selected',
    info: 'card-info',
  };

  return (
    <div className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
