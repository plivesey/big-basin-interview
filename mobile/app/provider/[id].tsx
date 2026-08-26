import { useCallback } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RatingStars } from '../../src/components/providers/RatingStars';
import { ServiceSelector } from '../../src/components/booking/ServiceSelector';
import { TimeSlotGrid } from '../../src/components/booking/TimeSlotGrid';
import { BookingConfirmation } from '../../src/components/booking/BookingConfirmation';
import { BookingSuccess } from '../../src/components/booking/BookingSuccess';
import { Button } from '../../src/components/ui/Button';
import { Spinner } from '../../src/components/ui/Spinner';
import { StatusMessage } from '../../src/components/ui/StatusMessage';
import { CloseIcon, PinIcon } from '../../src/theme/icons';
import { typography } from '../../src/theme/classes';
import { useBookingStore } from '../../src/store/booking-store';

/**
 * The web app's ProviderDetailModal is a portal with three internal views. Here
 * it is a modal *route* (presentation: 'modal' in app/_layout.tsx) so it gets
 * swipe-to-dismiss and hardware back for free, and its content can scroll with
 * its own safe area.
 *
 * The three-view state machine is unchanged: it is still a switch on
 * booking-store.modalView. Note 'success' is terminal -- there is no way back
 * to 'confirmation', because the workflow is already COMPLETE and re-submitting
 * would replay the idempotency key.
 */
export default function ProviderRoute() {
  const insets = useSafeAreaInsets();

  const modalView = useBookingStore((s) => s.modalView);
  const provider = useBookingStore((s) => s.selectedProvider);
  const selectedDate = useBookingStore((s) => s.selectedDate);
  const timeSlots = useBookingStore((s) => s.timeSlots);
  const selectedSlot = useBookingStore((s) => s.selectedSlot);
  const selectedService = useBookingStore((s) => s.selectedService);
  const bookingResult = useBookingStore((s) => s.bookingResult);
  const error = useBookingStore((s) => s.error);
  const isLoadingProvider = useBookingStore((s) => s.isLoadingProvider);
  const isLoadingSlots = useBookingStore((s) => s.isLoadingSlots);
  const isConfirming = useBookingStore((s) => s.isConfirming);

  const setSelectedDate = useBookingStore((s) => s.setSelectedDate);
  const selectTimeSlot = useBookingStore((s) => s.selectTimeSlot);
  const selectService = useBookingStore((s) => s.selectService);
  const proceedToConfirmation = useBookingStore((s) => s.proceedToConfirmation);
  const confirmBooking = useBookingStore((s) => s.confirmBooking);
  const goBackToDetails = useBookingStore((s) => s.goBackToDetails);
  const closeModal = useBookingStore((s) => s.closeModal);

  const handleDateChange = useCallback(
    (date: string) => {
      void setSelectedDate(date);
    },
    [setSelectedDate]
  );

  const handleConfirm = useCallback(() => {
    void confirmBooking();
  }, [confirmBooking]);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top ? 0 : 12 }}>
      <View className="flex-row items-center justify-end px-4 py-3">
        <Pressable
          onPress={closeModal}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          testID="close-booking"
        >
          <CloseIcon />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 24) + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {modalView === 'success' && bookingResult ? (
          <BookingSuccess result={bookingResult} onDone={closeModal} />
        ) : isLoadingProvider ? (
          <View className="items-center py-16">
            <Spinner />
          </View>
        ) : !provider ? (
          <StatusMessage
            variant="error"
            message={error ?? "I couldn't load that provider. Try again from the list."}
          />
        ) : modalView === 'confirmation' && selectedSlot && selectedService ? (
          <BookingConfirmation
            providerName={provider.name}
            serviceType={selectedService}
            scheduledAt={selectedSlot.start}
            address={provider.address}
            isConfirming={isConfirming}
            onConfirm={handleConfirm}
            onBack={goBackToDetails}
          />
        ) : (
          <View className="gap-6">
            <View>
              <Text className={typography.heading2}>{provider.name}</Text>
              <Text className="text-sm text-slate-600 capitalize mt-0.5">{provider.category}</Text>
              <View className="mt-2">
                <RatingStars rating={provider.rating} reviewCount={provider.reviewCount} />
              </View>
              <View className="mt-3 flex-row items-start gap-1.5">
                <View className="mt-0.5">
                  <PinIcon />
                </View>
                <Text className="flex-1 text-sm text-slate-500">{provider.address}</Text>
              </View>
              {provider.description ? (
                <Text className="text-base text-slate-600 mt-3 leading-relaxed">
                  {provider.description}
                </Text>
              ) : null}
            </View>

            <ServiceSelector
              services={provider.services}
              selectedService={selectedService}
              onServiceSelect={selectService}
            />

            <TimeSlotGrid
              date={selectedDate}
              slots={timeSlots}
              selectedSlot={selectedSlot}
              isLoading={isLoadingSlots}
              onDateChange={handleDateChange}
              onSlotSelect={selectTimeSlot}
            />

            {error ? <StatusMessage variant="error" message={error} /> : null}

            <Button
              onPress={proceedToConfirmation}
              size="large"
              disabled={!selectedSlot || !selectedService}
              testID="review-booking"
            >
              Review booking
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
