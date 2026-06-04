import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'icon';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const getButtonClass = () => {
    const baseClasses: Record<ButtonVariant, string> = {
      primary:
        size === 'large'
          ? 'btn-primary-large'
          : size === 'small'
            ? 'btn-primary-small'
            : 'btn-primary',
      secondary: 'btn-secondary',
      text: 'btn-text',
      icon: 'btn-icon',
    };

    if (disabled && !loading) {
      return `btn btn-disabled ${className}`;
    }

    return `${baseClasses[variant]} ${className}`;
  };

  return (
    <button className={getButtonClass()} disabled={disabled || loading} {...props}>
      {loading && <div className="spinner-small mr-2" />}
      {children}
    </button>
  );
}
