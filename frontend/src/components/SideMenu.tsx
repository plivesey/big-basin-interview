import { memo, useEffect, useCallback } from 'react';
import {
  useMenuStore,
  selectIsMenuOpen,
  selectCalendarConnected,
  selectCalendarEmail,
  selectIsLoadingCalendarStatus,
} from '../store/menu-store';
import { Button } from './Button';
import { Spinner } from './Spinner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Side menu that slides in from the left.
 * Contains calendar settings and connection options.
 */
export const SideMenu = memo(function SideMenu() {
  const isMenuOpen = useMenuStore(selectIsMenuOpen);
  const calendarConnected = useMenuStore(selectCalendarConnected);
  const calendarEmail = useMenuStore(selectCalendarEmail);
  const isLoadingCalendarStatus = useMenuStore(selectIsLoadingCalendarStatus);
  const closeMenu = useMenuStore((state) => state.closeMenu);
  const setCalendarStatus = useMenuStore((state) => state.setCalendarStatus);
  const setLoadingCalendarStatus = useMenuStore((state) => state.setLoadingCalendarStatus);

  // Fetch calendar status on mount and when menu opens
  useEffect(() => {
    if (isMenuOpen) {
      fetchCalendarStatus();
    }
  }, [isMenuOpen]);

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

  const fetchCalendarStatus = useCallback(async () => {
    setLoadingCalendarStatus(true);
    try {
      const response = await fetch(`${BACKEND_URL}/auth/google/status`);
      if (response.ok) {
        const data = await response.json();
        setCalendarStatus(data.connected, data.email || null);
      } else {
        setCalendarStatus(false, null);
      }
    } catch {
      setCalendarStatus(false, null);
    }
  }, [setCalendarStatus, setLoadingCalendarStatus]);

  const handleConnect = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/google/url`);
      if (response.ok) {
        const data = await response.json();
        // Redirect to Google OAuth
        window.location.href = data.url;
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
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Settings menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Calendar Settings</h2>
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

        {/* Content */}
        <div className="p-4">
          {/* Description */}
          <p className="text-sm text-slate-600 mb-6">
            Connect your calendar and I'll save your appointments automatically. One less thing to
            remember.
          </p>

          {/* Calendar connection status */}
          {isLoadingCalendarStatus ? (
            <div className="flex items-center justify-center py-4">
              <Spinner />
            </div>
          ) : calendarConnected ? (
            <div className="space-y-4">
              {/* Connected status */}
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <svg
                  className="w-5 h-5 text-green-600 flex-shrink-0"
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
                  <p className="text-sm font-medium text-green-800">Connected</p>
                  {calendarEmail && (
                    <p className="text-xs text-green-600 truncate">{calendarEmail}</p>
                  )}
                </div>
              </div>

              {/* Disconnect button */}
              <Button variant="secondary" onClick={handleDisconnect} className="w-full">
                Disconnect
              </Button>
            </div>
          ) : (
            <Button variant="primary" onClick={handleConnect} className="w-full">
              Connect Google Calendar
            </Button>
          )}
        </div>
      </div>
    </>
  );
});
