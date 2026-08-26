import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatHeader } from '../src/components/chat/ChatHeader';
import { MessageList } from '../src/components/chat/MessageList';
import { ChatInput } from '../src/components/chat/ChatInput';
import { ProviderSheet } from '../src/components/providers/ProviderSheet';
import { SideMenu } from '../src/components/menu/SideMenu';
import { BookingRouteHost } from '../src/components/booking/BookingRouteHost';
import { useWebSocket } from '../src/hooks/useWebSocket';
import { useChatPersistence } from '../src/hooks/useChatPersistence';
import {
  useChatStore,
  selectMessages,
  selectIsLoading,
  selectConnectionStatus,
  selectHasConnectedOnce,
} from '../src/store/chat-store';
import { useBookingStore, selectIsChatDisabled } from '../src/store/booking-store';
import { useMenuStore } from '../src/store/menu-store';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { isHydrated } = useChatPersistence();
  const { sendMessage, reconnect, retryLastMessage, isRetrying, createNewSession, switchSession } =
    useWebSocket();

  const messages = useChatStore(selectMessages);
  const isLoading = useChatStore(selectIsLoading);
  const connectionStatus = useChatStore(selectConnectionStatus);
  const hasConnectedOnce = useChatStore(selectHasConnectedOnce);
  const isChatDisabled = useBookingStore(selectIsChatDisabled);
  const openMenu = useMenuStore((state) => state.openMenu);

  const placeholder = isChatDisabled
    ? 'Complete or close the booking to continue chatting'
    : connectionStatus === 'connected'
      ? 'What can I help you find today?'
      : 'Connecting...';

  return (
    <View className="flex-1 bg-white">
      <ChatHeader
        status={connectionStatus}
        hasConnectedOnce={hasConnectedOnce}
        onReconnect={reconnect}
        onOpenMenu={openMenu}
        onNewConversation={createNewSession}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <MessageList
          messages={messages}
          isLoading={isLoading}
          showRestoredDivider={isHydrated}
          onRetryMessage={retryLastMessage}
          isRetrying={isRetrying}
        />

        <View style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <ChatInput
            onSendMessage={sendMessage}
            disabled={isChatDisabled}
            placeholder={placeholder}
          />
        </View>
      </KeyboardAvoidingView>

      <ProviderSheet />
      <SideMenu onSessionSelect={switchSession} />
      <BookingRouteHost />
    </View>
  );
}
