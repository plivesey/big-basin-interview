import { memo } from 'react';
import type { ConnectionStatus as ConnectionStatusType } from '@asba/shared-types';
import { Badge } from './Badge';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  onReconnect: () => void;
}

/**
 * Connection status indicator with reconnect functionality.
 * Displays current WebSocket connection state and allows manual reconnection.
 */
export const ConnectionStatus = memo(function ConnectionStatus({
  status,
  onReconnect,
}: ConnectionStatusProps) {
  if (status === 'connected') {
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
