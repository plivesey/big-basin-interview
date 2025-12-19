import type { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  showDot?: boolean;
}

export function Badge({
  variant = 'primary',
  children,
  className = '',
  showDot = false,
}: BadgeProps) {
  const variantClasses: Record<BadgeVariant, string> = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    neutral: 'badge-neutral',
  };

  const dotColors: Record<BadgeVariant, string> = {
    primary: 'bg-indigo-600',
    success: 'bg-green-600',
    warning: 'bg-amber-600',
    error: 'bg-red-600',
    neutral: 'bg-slate-600',
  };

  return (
    <span className={`${variantClasses[variant]} ${className}`}>
      {showDot && <div className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} mr-1.5`} />}
      {children}
    </span>
  );
}
