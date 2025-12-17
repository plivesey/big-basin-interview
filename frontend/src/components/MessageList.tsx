import { useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageComponent, ChatLoading } from './ChatMessage';
import { getMessageText } from '../store/chat-store';
import type { ChatMessage } from '../store/chat-store';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Format timestamp for display
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">👋</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Welcome to Service Booking Assistant
          </h3>
          <p className="text-slate-500 max-w-sm">
            Start a conversation to find and book local services like salons, mechanics, and dentists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-2"
    >
      {messages.map((message) => (
        <ChatMessageComponent
          key={message.id}
          role={message.role}
          timestamp={formatTimestamp(message.createdAt)}
        >
          {getMessageText(message)}
        </ChatMessageComponent>
      ))}

      {isLoading && <ChatLoading text="Thinking..." />}

      <div ref={messagesEndRef} />
    </div>
  );
}
