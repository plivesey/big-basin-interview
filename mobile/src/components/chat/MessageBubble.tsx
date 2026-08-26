import { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MarkdownText } from './MarkdownText';
import { TypingDots } from './TypingDots';
import { message as messageClasses } from '../../theme/classes';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  showTypingIndicator?: boolean;
  failed?: boolean;
  /** Told when this bubble's text has been put on the clipboard. */
  onCopied?: () => void;
}

/**
 * Memoized on (role, text, timestamp, showTypingIndicator, failed): streaming
 * appends a delta many times a second, and without this every bubble in the
 * conversation re-renders on each one.
 */
export const MessageBubble = memo(function MessageBubble({
  role,
  text,
  timestamp,
  showTypingIndicator = false,
  failed = false,
  onCopied,
}: MessageBubbleProps) {
  const palette = failed
    ? messageClasses.failed
    : role === 'user'
      ? messageClasses.user
      : messageClasses.assistant;

  const handleLongPress = () => {
    // setStringAsync resolves once the pasteboard write is enqueued, so
    // awaiting it just costs a frame before we can show the confirmation.
    Clipboard.setStringAsync(text);
    onCopied?.();
  };

  return (
    <View className={`w-full mb-3 ${role === 'user' ? 'items-end' : 'items-start'}`}>
      <Pressable
        onLongPress={handleLongPress}
        // 500ms is the default and tested as sluggish next to iMessage.
        delayLongPress={200}
        accessibilityLabel={`${role === 'user' ? 'Your message' : 'Scout'}: ${text}`}
        accessibilityHint="Long press to copy"
        className={palette.container}
      >
        {role === 'assistant' ? (
          <MarkdownText content={text} textClassName={palette.text} />
        ) : (
          <Text className={palette.text}>{text}</Text>
        )}
        {showTypingIndicator && <TypingDots />}
        {timestamp ? (
          <Text
            className={`mt-1 text-xs text-right ${
              failed ? 'text-red-400' : role === 'user' ? 'text-indigo-100' : 'text-slate-500'
            }`}
          >
            {timestamp}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
});
