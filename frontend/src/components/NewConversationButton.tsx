import { memo } from 'react';

interface NewConversationButtonProps {
  onClick: () => void;
}

/**
 * Button to create a new conversation session.
 * Displays a document with plus icon.
 */
export const NewConversationButton = memo(function NewConversationButton({
  onClick,
}: NewConversationButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label="New conversation"
    >
      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* Document with plus icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </button>
  );
});
