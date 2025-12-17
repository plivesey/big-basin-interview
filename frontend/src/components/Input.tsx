import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

type InputVariant = 'default' | 'error' | 'success';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', label, error, helperText, className = '', ...props }, ref) => {
    const variantClasses: Record<InputVariant, string> = {
      default: 'input',
      error: 'input-error',
      success: 'input-success',
    };

    const inputVariant = error ? 'error' : variant;

    return (
      <div className="w-full">
        {label && (
          <label className="label-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${variantClasses[inputVariant]} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-slate-600">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
