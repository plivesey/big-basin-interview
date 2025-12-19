import { memo, useState, useEffect } from 'react';
import type { ConnectionStatus as ConnectionStatusType } from '@asba/shared-types';
import { Badge } from './Badge';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  hasConnectedOnce: boolean;
  onReconnect: () => void;
}

/**
 * Connection status indicator with reconnect functionality.
 * Displays current WebSocket connection state and allows manual reconnection.
 * The "Ready" badge fades out after 1 second to keep the UI clean.
 *
 * IMPORTANT: Only shows badges after a connection drop, not on initial load.
 * This provides a cleaner optimistic loading experience.
 */
export const ConnectionStatus = memo(function ConnectionStatus({
  status,
  hasConnectedOnce,
  onReconnect,
}: ConnectionStatusProps) {
  const [showReady, setShowReady] = useState(true);
  // Track if we've ever been disconnected after the first connection
  // This prevents showing "Ready" badge on initial connection
  const [hasDisconnected, setHasDisconnected] = useState(false);

  useEffect(() => {
    if (status === 'connected') {
      // Hide the "Ready" badge after 1 second
      const timer = setTimeout(() => setShowReady(false), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'disconnected' || status === 'error') {
      // Mark that we've disconnected - now we should show Ready on reconnect
      // Defer to avoid sync setState in effect
      const disconnectedTimer = hasConnectedOnce
        ? setTimeout(() => setHasDisconnected(true), 0)
        : null;
      // Reset showReady for next connection
      const readyTimer = setTimeout(() => setShowReady(true), 0);
      return () => {
        if (disconnectedTimer) clearTimeout(disconnectedTimer);
        clearTimeout(readyTimer);
      };
    } else {
      // connecting state - reset showReady
      const timer = setTimeout(() => setShowReady(true), 0);
      return () => clearTimeout(timer);
    }
  }, [status, hasConnectedOnce]);

  // Don't show any badges until we've had a connection drop
  if (!hasConnectedOnce || !hasDisconnected) {
    return null;
  }

  if (status === 'connected') {
    if (!showReady) return null;
    return (
      <Badge variant="success">
        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
        Ready
      </Badge>
    );
  }

  if (status === 'connecting') {
    return (
      <Badge variant="warning">
        <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
        Reconnecting...
      </Badge>
    );
  }

  if (status === 'error') {
    return (
      <button
        onClick={onReconnect}
        className="badge-error flex items-center gap-1.5 cursor-pointer hover:bg-red-200 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-red-500" />
        Having trouble - Click to retry
      </button>
    );
  }

  // disconnected
  return (
    <button
      onClick={onReconnect}
      className="badge-warning flex items-center gap-1.5 cursor-pointer hover:bg-amber-200 transition-colors"
    >
      <span className="w-2 h-2 rounded-full bg-amber-500" />
      Connection lost - Click to reconnect
    </button>
  );
});
