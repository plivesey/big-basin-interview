import { memo } from 'react';

interface PanelToggleButtonProps {
  onClick: () => void;
  visible: boolean;
}

/**
 * Toggle button to re-open the provider panel.
 * Renders a chevron-right icon that animates in/out based on visibility.
 */
export const PanelToggleButton = memo(function PanelToggleButton({
  onClick,
  visible,
}: PanelToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-label="Open provider list"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
});
