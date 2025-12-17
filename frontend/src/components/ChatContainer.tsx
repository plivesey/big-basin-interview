import { useChatStore } from '../store/chat-store';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { Badge } from './Badge';

export function ChatContainer() {
  const { messages, isLoading, connectionStatus } = useChatStore();
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
        disabled={!isConnected || isLoading}
        placeholder={
          isConnecting
            ? 'Getting ready...'
            : !isConnected
              ? 'Connection lost. Click above to reconnect.'
              : 'What can I help you find today?'
        }
      />
    </div>
  );
}

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  onReconnect: () => void;
}

function ConnectionStatus({ status, onReconnect }: ConnectionStatusProps) {
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
}
