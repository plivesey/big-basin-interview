import {
  useChatStore,
  selectMessages,
  selectIsLoading,
  selectConnectionStatus,
} from '../store/chat-store';
import { useBookingStore, selectIsChatDisabled } from '../store/booking-store';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ConnectionStatus } from './ConnectionStatus';

/**
 * Main chat container component.
 * Uses Zustand selectors to only re-render when specific state changes.
 */
export function ChatContainer() {
  // Use selectors to subscribe to specific pieces of state
  // This prevents re-renders when unrelated state changes
  const messages = useChatStore(selectMessages);
  const isLoading = useChatStore(selectIsLoading);
  const connectionStatus = useChatStore(selectConnectionStatus);
  const isModalOpen = useBookingStore(selectIsChatDisabled);

  const { sendMessage, reconnect } = useWebSocket();

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-sm font-semibold text-white">S</span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Scout</h2>
            <p className="text-xs text-slate-500">Your guide to local services</p>
          </div>
        </div>
        <ConnectionStatus
          status={connectionStatus}
          onReconnect={reconnect}
        />
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <ChatInput
        onSendMessage={sendMessage}
        disabled={!isConnected || isLoading || isModalOpen}
        placeholder={
          isModalOpen
            ? 'Complete or close the booking to continue chatting'
            : isConnecting
              ? 'Getting ready...'
              : !isConnected
                ? 'Connection lost. Click above to reconnect.'
                : 'What can I help you find today?'
        }
      />
    </div>
  );
}
