import { useState, useCallback } from 'react';
import { View, TextInput, type NativeSyntheticEvent, type TextInputContentSizeChangeEventData } from 'react-native';
import { Button } from '../ui/Button';
import { SendIcon } from '../../theme/icons';
import { tokens } from '../../theme/tokens';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MIN_HEIGHT = 44;
const MAX_HEIGHT = 120;

/**
 * `disabled` gates the send button, not typing -- same as web.
 *
 * Two deliberate divergences from the web input:
 *  - No Enter-to-send. There is no Shift key on a phone keyboard, so Return
 *    inserts a newline and the send button sends.
 *  - No autofocus on mount. Focusing a textarea is free on the web; on a phone
 *    it covers the empty-state onboarding copy with a keyboard.
 */
export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = 'What can I help you find today?',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [height, setHeight] = useState(MIN_HEIGHT);

  // RN hands us the content height directly, so auto-resize is simpler here
  // than the web's scrollHeight dance.
  const handleContentSizeChange = useCallback(
    (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const next = event.nativeEvent.contentSize.height;
      setHeight(Math.min(Math.max(next, MIN_HEIGHT), MAX_HEIGHT));
    },
    []
  );

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setMessage('');
    setHeight(MIN_HEIGHT);
  }, [message, disabled, onSendMessage]);

  return (
    <View className="flex-row items-end gap-3 border-t border-slate-200 bg-white px-4 pt-3">
      <TextInput
        value={message}
        onChangeText={setMessage}
        onContentSizeChange={handleContentSizeChange}
        placeholder={placeholder}
        placeholderTextColor={tokens.slate400}
        multiline
        accessibilityLabel="Message input"
        // An explicit height is required on iOS or a multiline TextInput
        // collapses to a single line.
        style={{ height }}
        className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-base text-gray-800"
      />
      <Button
        onPress={handleSend}
        disabled={disabled || !message.trim()}
        accessibilityLabel="Send message"
        testID="send-button"
      >
        <SendIcon />
      </Button>
    </View>
  );
}
