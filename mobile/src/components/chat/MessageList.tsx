import { useCallback, useRef } from 'react';
import { ScrollView, View, Text, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { MessageBubble } from './MessageBubble';
import { ChatErrorMessage } from './ChatErrorMessage';
import {
  useChatStore,
  getMessageText,
  selectStreamingMessageId,
  selectIsAiWorking,
  selectLastError,
} from '../../store/chat-store';
import type { ChatMessage } from '../../store/chat-store';
import { formatMessageTime } from '../../utils/datetime';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onRetryMessage?: () => void;
  isRetrying?: boolean;
}

/** Only auto-scroll if the user is already near the bottom. */
const STICK_THRESHOLD = 80;

/**
 * A ScrollView, not a FlatList.
 *
 * Streaming mutates the *last* item many times a second, an `inverted` FlatList
 * uses a scale transform that fights KeyboardAvoidingView and the provider
 * sheet, and a session is small enough that virtualization buys nothing. This
 * is the direct analogue of the web's scrollIntoView. If sessions ever get long
 * (a few hundred messages), revisit with FlatList +
 * maintainVisibleContentPosition.
 */
export function MessageList({
  messages,
  isLoading,
  onRetryMessage,
  isRetrying = false,
}: MessageListProps) {
  const scrollRef = useRef<ScrollView>(null);
  const stuckToBottom = useRef(true);
  const streamingMessageId = useChatStore(selectStreamingMessageId);
  const isAiWorking = useChatStore(selectIsAiWorking);
  const lastError = useChatStore(selectLastError);
  const failedMessageIds = useChatStore((state) => state.failedMessageIds);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromEnd = contentSize.height - contentOffset.y - layoutMeasurement.height;
    stuckToBottom.current = distanceFromEnd < STICK_THRESHOLD;
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (!stuckToBottom.current) return;
    // Unanimated during streaming: a smooth scroll per token drops frames.
    scrollRef.current?.scrollToEnd({ animated: !isAiWorking });
  }, [isAiWorking]);

  if (messages.length === 0 && !isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <View className="w-16 h-16 mb-4 rounded-full bg-indigo-100 items-center justify-center">
          <Text className="text-2xl font-semibold text-indigo-600">S</Text>
        </View>
        <Text className="text-lg font-medium text-slate-700 mb-2 text-center">
          I&apos;m Scout, your guide to local services
        </Text>
        <Text className="text-slate-500 text-center max-w-sm">
          Tell me what you need, and I&apos;ll help you find and book the perfect service provider.
          Need a haircut? A plumber? House cleaning? Just describe it in your own words.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1"
      contentContainerClassName="p-4"
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onContentSizeChange={handleContentSizeChange}
      // Without this a tap on a provider card or time slot with the keyboard up
      // only dismisses the keyboard, and the user has to tap twice.
      keyboardShouldPersistTaps="handled"
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          text={getMessageText(message)}
          timestamp={formatMessageTime(message.createdAt)}
          failed={failedMessageIds.has(message.id)}
          showTypingIndicator={
            message.role === 'assistant' && message.id === streamingMessageId && isAiWorking
          }
        />
      ))}

      {lastError ? (
        <ChatErrorMessage message={lastError} onRetry={onRetryMessage} isRetrying={isRetrying} />
      ) : null}
    </ScrollView>
  );
}
