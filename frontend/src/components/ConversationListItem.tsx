import { memo } from 'react';
import type { SessionListItem } from '@asba/shared-types';

interface ConversationListItemProps {
  session: SessionListItem;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Formats a date string to "3 DEC" format (day + abbreviated month uppercase)
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  return `${day} ${month}`;
}

/**
 * A single conversation item in the sidebar conversation list.
 * Shows the session title and date, with active/hover states.
 */
export const ConversationListItem = memo(function ConversationListItem({
  session,
  isActive,
  onClick,
}: ConversationListItemProps) {
  return (
    <li
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-indigo-50 border-l-2 border-indigo-600' : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex justify-between items-start">
        <span
          className={`text-sm font-medium truncate ${
            isActive ? 'text-indigo-700' : 'text-slate-700'
          }`}
        >
          {session.title}
        </span>
        <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
          {formatDate(session.date)}
        </span>
      </div>
    </li>
  );
});
