import { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import type { DisplayProvider } from '@asba/shared-types';
import { ProviderCard } from './ProviderCard';
import { CloseIcon } from '../../theme/icons';
import {
  usePanelStore,
  selectIsProviderPanelOpen,
  selectDisplayedProviders,
  selectActiveWorkflowId,
  selectWorkflowState,
} from '../../store/panel-store';
import { useBookingStore } from '../../store/booking-store';
import { tokens } from '../../theme/tokens';

/**
 * The web app renders providers in a right-hand panel that animates in beside
 * the chat. A phone has no room for two panes, so they surface as a detented
 * bottom sheet over the chat instead.
 *
 * Index 0 is the peek detent, which does the job of the web's
 * PanelToggleButton: closing the panel collapses to the peek rather than
 * dismissing, so the user can pull the list back up. clearProviders() -- which
 * only fires when a booking completes -- is what actually dismisses it.
 *
 * A pushed route would have been the other option, but the server re-emits
 * display_providers at arbitrary times (mid-stream, and again unprompted on
 * reconnect, see backend chat-handler.ts), and pushing a route from a socket
 * callback double-pushes on reconnect and desyncs hardware-back from the store.
 */

const SNAP_POINTS = ['14%', '55%', '92%'];

export function ProviderSheet() {
  const sheetRef = useRef<BottomSheet>(null);
  // The sheet fires onChange once for its initial index as it mounts. Acting on
  // that would immediately call closeProviderPanel() and collapse a sheet the
  // server just asked us to open.
  const hasSettled = useRef(false);

  const isOpen = usePanelStore(selectIsProviderPanelOpen);
  const providers = usePanelStore(selectDisplayedProviders);
  const activeWorkflowId = usePanelStore(selectActiveWorkflowId);
  const workflowState = usePanelStore(selectWorkflowState);
  const closeProviderPanel = usePanelStore((state) => state.closeProviderPanel);
  const reopenProviderPanel = usePanelStore((state) => state.reopenProviderPanel);
  const openProviderModal = useBookingStore((state) => state.openProviderModal);

  const hasProviders = providers.length > 0 && workflowState !== 'COMPLETE';

  useEffect(() => {
    if (!hasProviders) return;
    sheetRef.current?.snapToIndex(isOpen ? 1 : 0);
  }, [isOpen, hasProviders]);

  useEffect(() => {
    if (!hasProviders) hasSettled.current = false;
  }, [hasProviders]);

  const handleChange = useCallback(
    (index: number) => {
      if (!hasSettled.current) {
        hasSettled.current = true;
        return;
      }
      if (index <= 0) {
        closeProviderPanel();
      } else if (!isOpen) {
        reopenProviderPanel();
      }
    },
    [closeProviderPanel, reopenProviderPanel, isOpen]
  );

  const handleSelect = useCallback(
    (providerId: string) => {
      void openProviderModal(providerId, activeWorkflowId ?? undefined);
    },
    [openProviderModal, activeWorkflowId]
  );

  const renderItem = useCallback(
    ({ item }: { item: DisplayProvider }) => (
      <ProviderCard provider={item} onPress={handleSelect} />
    ),
    [handleSelect]
  );

  const keyExtractor = useCallback((item: DisplayProvider) => item.id, []);

  const header = useMemo(
    () => (
      <View className="flex-row items-center justify-between px-4 pb-3">
        <Text className="text-lg font-semibold text-gray-800">Your options</Text>
        <Pressable
          onPress={() => sheetRef.current?.snapToIndex(0)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Collapse provider list"
        >
          <CloseIcon size={20} />
        </Pressable>
      </View>
    ),
    []
  );

  if (!hasProviders) {
    return null;
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={1}
      snapPoints={SNAP_POINTS}
      enablePanDownToClose={false}
      onChange={handleChange}
      backgroundStyle={{ backgroundColor: tokens.white }}
      handleIndicatorStyle={{ backgroundColor: tokens.slate300 }}
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
      }}
    >
      <BottomSheetFlatList
        data={providers}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        testID="provider-list"
      />
    </BottomSheet>
  );
}
