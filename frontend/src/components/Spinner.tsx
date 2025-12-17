interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Spinner({ size = 'medium', className = '' }: SpinnerProps) {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner',
    large: 'w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin',
  };

  return <div className={`${sizeClasses[size]} ${className}`} />;
}
