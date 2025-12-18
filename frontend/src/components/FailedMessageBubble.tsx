import { memo } from 'react';
import { Button } from './Button';

interface FailedMessageBubbleProps {
  /** The original message text that failed to send */
  message: string;
  /** Callback when retry button is clicked */
  onRetry: () => void;
  /** Whether a retry is in progress */
  isRetrying?: boolean;
}

/**
 * User message bubble with error state.
 * Shows the original message with a "Not sent" indicator and retry button.
 * Styled as a user message (right-aligned) with error styling.
 */
export const FailedMessageBubble = memo(function FailedMessageBubble({
  message,
  onRetry,
  isRetrying = false,
}: FailedMessageBubbleProps) {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[70%]">
        {/* Message bubble with error border */}
        <div
          className="px-4 py-3 bg-indigo-600 text-white rounded-2xl rounded-tr-sm border-2 border-red-400 opacity-75"
          role="status"
          aria-label="This message couldn't be sent. Click to send it again."
        >
          <p className="text-sm whitespace-pre-wrap">{message}</p>
        </div>

        {/* Error indicator and retry */}
        <div className="flex items-center justify-end gap-2 mt-1">
          {/* Warning icon */}
          <svg
            className="w-4 h-4 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="text-xs text-red-600">Not sent</span>
          <Button
            variant="text"
            size="small"
            onClick={onRetry}
            loading={isRetrying}
            disabled={isRetrying}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 text-xs"
            title="Send this message again"
          >
            {isRetrying ? 'Sending...' : 'Retry'}
          </Button>
        </div>
      </div>
    </div>
  );
});
