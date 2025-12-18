import { memo } from 'react';

/**
 * Inline typing indicator with three bouncing dots.
 * Used inside assistant message bubble to show AI is working.
 */
export const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex space-x-1 py-1">
      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
      <div
        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
        style={{ animationDelay: '0.1s' }}
      />
      <div
        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
        style={{ animationDelay: '0.2s' }}
      />
    </div>
  );
});
