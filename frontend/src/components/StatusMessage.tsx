import type { ReactNode } from 'react';

type StatusVariant = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps {
  variant: StatusVariant;
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
}

export function StatusMessage({ variant, title, children, icon }: StatusMessageProps) {
  const variantClasses: Record<StatusVariant, string> = {
    success: 'status-success',
    error: 'status-error',
    warning: 'status-warning',
    info: 'status-info',
  };

  const iconColorClasses: Record<StatusVariant, string> = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-amber-600',
    info: 'text-blue-600',
  };

  const titleColorClasses: Record<StatusVariant, string> = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-amber-800',
    info: 'text-blue-800',
  };

  const textColorClasses: Record<StatusVariant, string> = {
    success: 'text-green-700',
    error: 'text-red-700',
    warning: 'text-amber-700',
    info: 'text-blue-700',
  };

  const defaultIcons: Record<StatusVariant, ReactNode> = {
    success: (
      <svg
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    error: (
      <svg
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    warning: (
      <svg
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    info: (
      <svg
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  return (
    <div className={variantClasses[variant]}>
      <div className={iconColorClasses[variant]}>{icon || defaultIcons[variant]}</div>
      <div>
        {title && (
          <p className={`text-sm font-medium ${titleColorClasses[variant]} mb-1`}>{title}</p>
        )}
        <p className={`text-sm ${textColorClasses[variant]}`}>{children}</p>
      </div>
    </div>
  );
}
