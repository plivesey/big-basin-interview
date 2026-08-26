import { memo, useState, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ConnectionStatus as ConnectionStatusType } from '@asba/shared-types';
import { Badge } from '../ui/Badge';
import { badge } from '../../theme/classes';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  hasConnectedOnce: boolean;
  onReconnect: () => void;
}

/**
 * Only renders after a connection has actually dropped -- never on first load
 * -- so the launch experience stays clean. The "Ready" badge self-hides after a
 * second. Ported from the web component, including that gating logic.
 */
export const ConnectionStatus = memo(function ConnectionStatus({
  status,
  hasConnectedOnce,
  onReconnect,
}: ConnectionStatusProps) {
  const [showReady, setShowReady] = useState(true);
  const [hasDisconnected, setHasDisconnected] = useState(false);

  useEffect(() => {
    if (status === 'connected') {
      const timer = setTimeout(() => setShowReady(false), 1000);
      return () => clearTimeout(timer);
    }
    if (status === 'disconnected' || status === 'error') {
      const disconnectedTimer = hasConnectedOnce
        ? setTimeout(() => setHasDisconnected(true), 0)
        : null;
      const readyTimer = setTimeout(() => setShowReady(true), 0);
      return () => {
        if (disconnectedTimer) clearTimeout(disconnectedTimer);
        clearTimeout(readyTimer);
      };
    }
    const timer = setTimeout(() => setShowReady(true), 0);
    return () => clearTimeout(timer);
  }, [status, hasConnectedOnce]);

  if (!hasConnectedOnce || !hasDisconnected) {
    return null;
  }

  if (status === 'connected') {
    if (!showReady) return null;
    return (
      <Badge variant="success" dot>
        Ready
      </Badge>
    );
  }

  if (status === 'connecting') {
    return (
      <Badge variant="warning" dot>
        Reconnecting...
      </Badge>
    );
  }

  const isError = status === 'error';
  const palette = isError ? badge.error : badge.warning;

  return (
    <Pressable
      onPress={onReconnect}
      accessibilityRole="button"
      accessibilityLabel={isError ? 'Retry connecting' : 'Reconnect'}
    >
      <View className={`${badge.base} ${palette.container}`}>
        <View className={`w-2 h-2 rounded-full mr-1.5 ${isError ? 'bg-red-500' : 'bg-amber-500'}`} />
        <Text className={`${badge.text} ${palette.text}`}>
          {isError ? 'Having trouble - tap to retry' : 'Connection lost - tap to reconnect'}
        </Text>
      </View>
    </Pressable>
  );
});
