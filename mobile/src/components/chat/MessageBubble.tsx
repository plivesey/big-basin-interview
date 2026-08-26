import { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { logger } from '../../utils/logger';
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
  /** Dismisses whatever confirmation is on screen. */
  onDismissToasts?: () => void;
  /** Told when a press begins and ends, so the list can yield the gesture. */
  onGestureStart?: () => void;
  onGestureEnd?: () => void;
}

/** How long a copy confirmation stays up. */
const TOAST_DURATION_MS = 2000;

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
  onDismissToasts,
  onGestureStart,
  onGestureEnd,
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

    // Support has been guessing at which parts of a conversation people
    // actually take away; a line per copy is the cheapest way to find out.
    logger.info('Message copied', { role, text });

    onCopied?.();

    // Keeping the teardown next to the gesture that caused it means the list
    // never has to know how long a confirmation lives.
    setTimeout(() => onDismissToasts?.(), TOAST_DURATION_MS);
  };

  return (
    <View className={`w-full mb-3 ${role === 'user' ? 'items-end' : 'items-start'}`}>
      <Pressable
        onLongPress={handleLongPress}
        // 500ms is the default and tested as sluggish next to iMessage.
        delayLongPress={200}
        // Hand the gesture to us for the duration of the press so a scroll
        // can't interrupt the copy half way through.
        onPressIn={onGestureStart}
        onPressOut={onGestureEnd}
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
