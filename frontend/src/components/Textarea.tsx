import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const inputClass = error
      ? 'textarea border-2 border-red-500 focus:ring-red-100 focus:border-red-600'
      : 'textarea';

    return (
      <div className="w-full">
        {label && <label className="label-text">{label}</label>}
        <textarea ref={ref} className={`${inputClass} ${className}`} {...props} />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-2 text-sm text-slate-600">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
