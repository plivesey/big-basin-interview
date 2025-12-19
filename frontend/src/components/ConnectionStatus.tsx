import { memo, useState, useEffect } from 'react';
import type { ConnectionStatus as ConnectionStatusType } from '@asba/shared-types';
import { Badge } from './Badge';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  onReconnect: () => void;
}

/**
 * Connection status indicator with reconnect functionality.
 * Displays current WebSocket connection state and allows manual reconnection.
 * The "Ready" badge fades out after 1 second to keep the UI clean.
 */
export const ConnectionStatus = memo(function ConnectionStatus({
  status,
  onReconnect,
}: ConnectionStatusProps) {
  const [showReady, setShowReady] = useState(true);

  useEffect(() => {
    if (status === 'connected') {
      // Hide the "Ready" badge after 1 second
      const timer = setTimeout(() => setShowReady(false), 1000);
      return () => clearTimeout(timer);
    } else {
      // Reset showReady for next connection (defer to avoid sync setState in effect)
      const timer = setTimeout(() => setShowReady(true), 0);
      return () => clearTimeout(timer);
    }
  }, [status]);

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
        Getting ready...
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
