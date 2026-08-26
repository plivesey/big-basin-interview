import { memo, useCallback } from 'react';
import { Pressable, View, Text } from 'react-native';
import type { SessionListItem } from '@asba/shared-types';
import { formatSessionDate } from '../../utils/datetime';

interface ConversationListItemProps {
  session: SessionListItem;
  isActive: boolean;
  onSelect: (sessionId: string) => void;
}

export const ConversationListItem = memo(function ConversationListItem({
  session,
  isActive,
  onSelect,
}: ConversationListItemProps) {
  const handlePress = useCallback(() => onSelect(session.id), [onSelect, session.id]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`Open conversation ${session.title}`}
      testID={`session-${session.id}`}
    >
      <View
        className={`flex-row items-center justify-between px-4 py-3 ${
          isActive ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''
        }`}
      >
        <Text className="flex-1 text-base text-gray-800" numberOfLines={1}>
          {session.title}
        </Text>
        <Text className="ml-3 text-xs text-slate-500">{formatSessionDate(session.date)}</Text>
      </View>
    </Pressable>
  );
});
