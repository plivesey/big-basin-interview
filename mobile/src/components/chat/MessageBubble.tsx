import { memo } from 'react';
import { View, Text } from 'react-native';
import { MarkdownText } from './MarkdownText';
import { TypingDots } from './TypingDots';
import { message as messageClasses } from '../../theme/classes';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  showTypingIndicator?: boolean;
  failed?: boolean;
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
}: MessageBubbleProps) {
  const palette = failed
    ? messageClasses.failed
    : role === 'user'
      ? messageClasses.user
      : messageClasses.assistant;

  return (
    <View className={`w-full mb-3 ${role === 'user' ? 'items-end' : 'items-start'}`}>
      <View className={palette.container}>
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
      </View>
    </View>
  );
});
