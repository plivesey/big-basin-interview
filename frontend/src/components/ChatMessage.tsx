import { memo } from 'react';
import type { ReactNode } from 'react';

type MessageRole = 'user' | 'assistant';

interface ChatMessageProps {
  role: MessageRole;
  children: ReactNode;
  timestamp?: string;
}

/**
 * Individual chat message bubble.
 * Memoized to prevent unnecessary re-renders when parent updates.
 */
export const ChatMessage = memo(function ChatMessage({
  role,
  children,
  timestamp,
}: ChatMessageProps) {
  const containerClass = role === 'user' ? 'flex justify-end mb-4' : 'flex justify-start mb-4';
  const messageClass = role === 'user' ? 'message-user' : 'message-assistant';

  return (
    <div className={containerClass}>
      <div className={messageClass}>
        <div className="text-base leading-relaxed">{children}</div>
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

interface ChatLoadingProps {
  text?: string;
}

/**
 * Loading indicator while waiting for assistant response.
 * Memoized to prevent unnecessary re-renders.
 */
export const ChatLoading = memo(function ChatLoading({
  text = 'Let me check...',
}: ChatLoadingProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="px-4 py-3 bg-slate-50 rounded-2xl rounded-tl-sm border border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <span className="text-sm text-slate-500">{text}</span>
        </div>
      </div>
    </div>
  );
});
