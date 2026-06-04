import {
  useChatStore,
  selectMessages,
  selectIsLoading,
  selectConnectionStatus,
  selectHasConnectedOnce,
} from '../store/chat-store';
import { useBookingStore, selectIsChatDisabled } from '../store/booking-store';
import { usePanelStore } from '../store/panel-store';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ConnectionStatus } from './ConnectionStatus';
import { PanelToggleButton } from './PanelToggleButton';

interface ChatContainerProps {
  sendMessage: (message: string) => void;
  reconnect: () => void;
  retryLastMessage: () => void;
  isRetrying: boolean;
}

/**
 * Main chat container component.
 * Uses Zustand selectors to only re-render when specific state changes.
 */
export function ChatContainer({
  sendMessage,
  reconnect,
  retryLastMessage,
  isRetrying,
}: ChatContainerProps) {
  // Use selectors to subscribe to specific pieces of state
  // This prevents re-renders when unrelated state changes
  const messages = useChatStore(selectMessages);
  const isLoading = useChatStore(selectIsLoading);
  const connectionStatus = useChatStore(selectConnectionStatus);
  const hasConnectedOnce = useChatStore(selectHasConnectedOnce);
  const isModalOpen = useBookingStore(selectIsChatDisabled);

  // Panel state for toggle button
  const isProviderPanelOpen = usePanelStore((state) => state.isProviderPanelOpen);
  const displayedProviders = usePanelStore((state) => state.displayedProviders);
  const workflowState = usePanelStore((state) => state.workflowState);
  const reopenProviderPanel = usePanelStore((state) => state.reopenProviderPanel);

  const isConnected = connectionStatus === 'connected';

  // Toggle button visibility: connected, panel closed, has providers, workflow not complete
  const isWorkflowComplete = workflowState === 'COMPLETE';
  const showToggleButton =
    isConnected && !isProviderPanelOpen && displayedProviders.length > 0 && !isWorkflowComplete;

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
        <div className="flex items-center gap-2">
          <PanelToggleButton onClick={reopenProviderPanel} visible={showToggleButton} />
          <ConnectionStatus
            status={connectionStatus}
            hasConnectedOnce={hasConnectedOnce}
            onReconnect={reconnect}
          />
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onRetryMessage={retryLastMessage}
        isRetrying={isRetrying}
      />

      {/* Input */}
      <ChatInput
        onSendMessage={sendMessage}
        disabled={isLoading || isModalOpen}
        placeholder={
          isModalOpen
            ? 'Complete or close the booking to continue chatting'
            : !isConnected && hasConnectedOnce
              ? 'Connection lost. Click above to reconnect.'
              : 'What can I help you find today?'
        }
      />
    </div>
  );
}
