import { memo } from 'react';
import type { ReactNode } from 'react';
import { MarkdownMessage } from './MarkdownMessage';
import { TypingIndicator } from './TypingIndicator';

type MessageRole = 'user' | 'assistant';

interface ChatMessageProps {
  role: MessageRole;
  children: ReactNode;
  timestamp?: string;
  showTypingIndicator?: boolean;
}

/**
 * Individual chat message bubble.
 * Memoized to prevent unnecessary re-renders when parent updates.
 */
export const ChatMessage = memo(function ChatMessage({
  role,
  children,
  timestamp,
  showTypingIndicator = false,
}: ChatMessageProps) {
  const containerClass = role === 'user' ? 'flex justify-end mb-4' : 'flex justify-start mb-4';
  const messageClass = role === 'user' ? 'message-user' : 'message-assistant';

  return (
    <div className={containerClass}>
      <div className={messageClass}>
        <div className="text-base leading-relaxed">
          {role === 'assistant' && typeof children === 'string' ? (
            <MarkdownMessage content={children} />
          ) : (
            children
          )}
          {showTypingIndicator && <TypingIndicator />}
        </div>
        {timestamp && (
          <div className="mt-1 text-xs opacity-70 text-right">{timestamp}</div>
        )}
      </div>
    </div>
  );
});

interface ChatTimestampProps {
  children: ReactNode;
}

/**
 * Timestamp separator between message groups.
 * Memoized to prevent unnecessary re-renders.
 */
export const ChatTimestamp = memo(function ChatTimestamp({ children }: ChatTimestampProps) {
  return (
    <div className="flex justify-center mb-6">
      <span className="message-timestamp">{children}</span>
    </div>
  );
});
