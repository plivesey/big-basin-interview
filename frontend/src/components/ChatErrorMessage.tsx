import { memo } from 'react';
import { Button } from './Button';

interface ChatErrorMessageProps {
  /** Error message to display */
  message: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Whether a retry is in progress */
  isRetrying?: boolean;
}

/**
 * Inline error message component for chat.
 * Displays a user-friendly error with optional retry button.
 * Styled to appear as an assistant message with error styling.
 */
export const ChatErrorMessage = memo(function ChatErrorMessage({
  message,
  onRetry,
  isRetrying = false,
}: ChatErrorMessageProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[70%] px-4 py-3 bg-red-50 text-red-700 rounded-2xl rounded-tl-sm border border-red-200">
        <div className="flex items-start gap-3">
          {/* Error icon */}
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm">{message}</p>
            {onRetry && (
              <Button
                variant="text"
                size="small"
                onClick={onRetry}
                loading={isRetrying}
                disabled={isRetrying}
                className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-100 px-2 py-1"
              >
                Try again
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
