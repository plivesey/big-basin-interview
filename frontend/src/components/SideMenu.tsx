import { memo, useEffect, useCallback } from 'react';
import {
  useMenuStore,
  selectIsMenuOpen,
  selectCalendarConnected,
  selectCalendarEmail,
  selectIsLoadingCalendarStatus,
  selectSessions,
  selectIsLoadingSessions,
  selectCurrentSessionId,
} from '../store/menu-store';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { ConversationListItem } from './ConversationListItem';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface SideMenuProps {
  onSessionSelect: (sessionId: string) => void;
}

/**
 * Side menu that slides in from the left.
 * Contains calendar connection and conversation history.
 */
export const SideMenu = memo(function SideMenu({ onSessionSelect }: SideMenuProps) {
  const isMenuOpen = useMenuStore(selectIsMenuOpen);
  const calendarConnected = useMenuStore(selectCalendarConnected);
  const calendarEmail = useMenuStore(selectCalendarEmail);
  const isLoadingCalendarStatus = useMenuStore(selectIsLoadingCalendarStatus);
  const sessions = useMenuStore(selectSessions);
  const isLoadingSessions = useMenuStore(selectIsLoadingSessions);
  const currentSessionId = useMenuStore(selectCurrentSessionId);
  const closeMenu = useMenuStore((state) => state.closeMenu);
  const setCalendarStatus = useMenuStore((state) => state.setCalendarStatus);
  const setLoadingCalendarStatus = useMenuStore((state) => state.setLoadingCalendarStatus);
  const fetchSessions = useMenuStore((state) => state.fetchSessions);

  const fetchCalendarStatus = useCallback(async () => {
    setLoadingCalendarStatus(true);
    try {
      const response = await fetch(`${BACKEND_URL}/auth/google/status`);
      if (response.ok) {
        const data = await response.json();
        setCalendarStatus(data.data.connected, data.data.email || null);
      } else {
        setCalendarStatus(false, null);
      }
    } catch {
      setCalendarStatus(false, null);
    }
  }, [setCalendarStatus, setLoadingCalendarStatus]);

  // Fetch calendar status and sessions when menu opens
  useEffect(() => {
    if (isMenuOpen) {
      fetchCalendarStatus();
      fetchSessions();
    }
  }, [isMenuOpen, fetchCalendarStatus, fetchSessions]);

  // Handle session selection
  const handleSessionClick = useCallback(
    (sessionId: string) => {
      onSessionSelect(sessionId);
      closeMenu();
    },
    [onSessionSelect, closeMenu]
  );

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen, closeMenu]);

  const handleConnect = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/google/url`);
      if (response.ok) {
        const data = await response.json();
        // Redirect to Google OAuth
        window.location.href = data.data.url;
      }
    } catch (error) {
      console.error('Failed to get OAuth URL:', error);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    setLoadingCalendarStatus(true);
    try {
      const response = await fetch(`${BACKEND_URL}/auth/google/disconnect`, {
        method: 'POST',
      });
      if (response.ok) {
        setCalendarStatus(false, null);
      }
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
    } finally {
      setLoadingCalendarStatus(false);
    }
  }, [setCalendarStatus, setLoadingCalendarStatus]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Side menu panel */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Settings menu"
      >
        {/* Header - close button only */}
        <div className="flex items-center justify-end px-4 pt-2">
          <button
            onClick={closeMenu}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <svg
              className="w-5 h-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Calendar connection section */}
        <div className="p-4">
          {isLoadingCalendarStatus ? (
            <div className="flex items-center justify-center py-4">
              <Spinner />
            </div>
          ) : calendarConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <svg
                  className="w-5 h-5 text-slate-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">Calendar connected</p>
                  {calendarEmail && (
                    <p className="text-xs text-slate-500 truncate">{calendarEmail}</p>
                  )}
                </div>
              </div>
              <Button variant="secondary" onClick={handleDisconnect} className="w-full">
                Disconnect
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Connect your calendar and I'll save your appointments automatically. One less thing
                to remember.
              </p>
              <Button variant="primary" onClick={handleConnect} className="w-full">
                Connect Google Calendar
              </Button>
            </>
          )}
        </div>

        {/* Delimiter */}
        <hr className="border-slate-200 mx-4" />

        {/* Conversation history section */}
        <div className="p-4 flex-1 overflow-y-auto">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Recent
          </h3>

          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-4">
              <Spinner />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No conversations yet</p>
          ) : (
            <ul className="space-y-1">
              {sessions.map((session) => (
                <ConversationListItem
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  onClick={() => handleSessionClick(session.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
});
