import { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ConnectionStatus as ConnectionStatusType } from '@asba/shared-types';
import { ConnectionStatus } from './ConnectionStatus';
import { MenuIcon, NewChatIcon } from '../../theme/icons';

interface ChatHeaderProps {
  status: ConnectionStatusType;
  hasConnectedOnce: boolean;
  onReconnect: () => void;
  onOpenMenu: () => void;
  onNewConversation: () => void;
}

export const ChatHeader = memo(function ChatHeader({
  status,
  hasConnectedOnce,
  onReconnect,
  onOpenMenu,
  onNewConversation,
}: ChatHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-b border-slate-200 bg-white px-4 pb-3"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center">
        <Pressable
          onPress={onOpenMenu}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Open conversations"
        >
          <MenuIcon />
        </Pressable>

        <View className="flex-row items-center flex-1 ml-3">
          <View className="w-9 h-9 rounded-full bg-indigo-100 items-center justify-center">
            <Text className="text-base font-semibold text-indigo-600">S</Text>
          </View>
          <View className="ml-3">
            <Text className="text-base font-semibold text-gray-800">Scout</Text>
            <Text className="text-xs text-slate-500">Your guide to local services</Text>
          </View>
        </View>

        <ConnectionStatus
          status={status}
          hasConnectedOnce={hasConnectedOnce}
          onReconnect={onReconnect}
        />

        <Pressable
          onPress={onNewConversation}
          hitSlop={12}
          className="ml-3"
          accessibilityRole="button"
          accessibilityLabel="Start a new conversation"
        >
          <NewChatIcon />
        </Pressable>
      </View>
    </View>
  );
});
