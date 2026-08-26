import { useCallback, useEffect } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConversationListItem } from './ConversationListItem';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { CloseIcon } from '../../theme/icons';
import { typography } from '../../theme/classes';
import {
  useMenuStore,
  selectIsMenuOpen,
  selectSessions,
  selectIsLoadingSessions,
  selectCurrentSessionId,
  selectCalendarConnected,
  selectCalendarEmail,
} from '../../store/menu-store';

interface SideMenuProps {
  onSessionSelect: (sessionId: string) => void;
}

const PANEL_MAX_WIDTH = 320;

/**
 * A hand-rolled slide-over rather than expo-router/drawer.
 *
 * There is exactly one screen behind it, so a Drawer navigator would force a
 * Stack(Drawer(chat), provider-modal) nesting for no benefit, and its
 * edge-swipe gesture competes with both the provider sheet's pan and iOS
 * interactive-back. The web SideMenu is already just a translate-x panel plus a
 * backdrop, so this is the direct port.
 */
export function SideMenu({ onSessionSelect }: SideMenuProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const panelWidth = Math.min(width * 0.86, PANEL_MAX_WIDTH);

  const isOpen = useMenuStore(selectIsMenuOpen);
  const sessions = useMenuStore(selectSessions);
  const isLoadingSessions = useMenuStore(selectIsLoadingSessions);
  const currentSessionId = useMenuStore(selectCurrentSessionId);
  const calendarConnected = useMenuStore(selectCalendarConnected);
  const calendarEmail = useMenuStore(selectCalendarEmail);
  const closeMenu = useMenuStore((state) => state.closeMenu);
  const fetchSessions = useMenuStore((state) => state.fetchSessions);
  const fetchCalendarStatus = useMenuStore((state) => state.fetchCalendarStatus);
  const disconnectCalendar = useMenuStore((state) => state.disconnectCalendar);

  const translateX = useSharedValue(-panelWidth);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(isOpen ? 0 : -panelWidth, { duration: 220 });
    backdropOpacity.value = withTiming(isOpen ? 1 : 0, { duration: 220 });
  }, [isOpen, panelWidth, translateX, backdropOpacity]);

  // Same as web: the menu refreshes what it shows each time it is opened.
  useEffect(() => {
    if (!isOpen) return;
    void fetchSessions();
    void fetchCalendarStatus();
  }, [isOpen, fetchSessions, fetchCalendarStatus]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  const handleSelect = useCallback(
    (sessionId: string) => {
      closeMenu();
      onSessionSelect(sessionId);
    },
    [closeMenu, onSessionSelect]
  );

  if (!isOpen && backdropOpacity.value === 0) {
    return null;
  }

  return (
    <View className="absolute inset-0" pointerEvents={isOpen ? 'auto' : 'none'}>
      <Animated.View style={backdropStyle} className="absolute inset-0 bg-black/40">
        <Pressable
          className="flex-1"
          onPress={closeMenu}
          accessibilityRole="button"
          accessibilityLabel="Close conversations"
        />
      </Animated.View>

      <Animated.View
        style={[panelStyle, { width: panelWidth, paddingTop: insets.top + 12 }]}
        className="absolute left-0 top-0 bottom-0 bg-white border-r border-slate-200"
      >
        <View className="flex-row items-center justify-between px-4 pb-4">
          <Text className={typography.heading3}>Conversations</Text>
          <Pressable
            onPress={closeMenu}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <CloseIcon size={20} />
          </Pressable>
        </View>

        <View className="px-4 pb-4 border-b border-slate-200">
          <Text className="text-xs font-medium text-slate-500 uppercase mb-1">
            Google Calendar
          </Text>
          {calendarConnected ? (
            <>
              <Text className="text-sm text-gray-800">Connected{calendarEmail ? ` — ${calendarEmail}` : ''}</Text>
              <Button
                variant="text"
                size="small"
                onPress={() => void disconnectCalendar()}
                className="self-start mt-1"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Text className="text-sm text-slate-600">
              Not connected. Connect it from the web app and your bookings will sync here too.
            </Text>
          )}
        </View>

        <Text className="px-4 pt-4 pb-2 text-xs font-medium text-slate-500 uppercase">Recent</Text>

        {isLoadingSessions && sessions.length === 0 ? (
          <View className="py-8 items-center">
            <Spinner size="small" />
          </View>
        ) : sessions.length === 0 ? (
          <Text className="px-4 text-sm text-slate-500">
            No conversations yet. Start one and it&apos;ll show up here.
          </Text>
        ) : (
          <View style={{ paddingBottom: insets.bottom }}>
            {sessions.map((session) => (
              <ConversationListItem
                key={session.id}
                session={session}
                isActive={session.id === currentSessionId}
                onSelect={handleSelect}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
}
