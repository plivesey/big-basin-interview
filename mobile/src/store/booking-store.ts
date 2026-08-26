import { create } from 'zustand';
import type { ProviderDetail, TimeSlot } from '@asba/shared-types';
import { logger } from '../utils/logger';
import { ERROR_MESSAGES } from '../utils/error-messages';
import { getTodayDate } from '../utils/datetime';
import { getProvider, getAvailability } from '../api/providers';
import { createBooking } from '../api/bookings';
import { selectProvider as selectProviderOnWorkflow } from '../api/workflows';

/**
 * Modal view states:
 * - 'details': Provider info + service selector + time slot grid
 * - 'confirmation': Booking summary with confirm button
 * - 'success': Booking success message with booking ID
 */
export type ModalView = 'details' | 'confirmation' | 'success';

/** Slot length the availability endpoint generates. */
const SLOT_DURATION_MINUTES = 30;

export interface BookingResult {
  bookingId: string;
  scheduledAt: string;
  providerName: string;
  serviceType: string;
  calendarEventAdded: boolean;
}

export interface BookingState {
  isModalOpen: boolean;
  modalView: ModalView;

  selectedProvider: ProviderDetail | null;

  selectedDate: string; // YYYY-MM-DD
  timeSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;

  selectedService: string | null;

  workflowId: string | null;

  bookingResult: BookingResult | null;

  error: string | null;

  isLoadingProvider: boolean;
  isLoadingSlots: boolean;
  isConfirming: boolean;

  openProviderModal: (providerId: string, workflowId?: string) => Promise<void>;
  setSelectedDate: (date: string) => Promise<void>;
  selectTimeSlot: (slot: TimeSlot) => void;
  selectService: (service: string) => void;
  proceedToConfirmation: () => void;
  confirmBooking: () => Promise<void>;
  goBackToDetails: () => void;
  closeModal: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

function generateIdempotencyKey(
  workflowId: string,
  providerId: string,
  scheduledAt: string
): string {
  return `${workflowId}:${providerId}:${scheduledAt}`;
}

const initialState = {
  isModalOpen: false,
  modalView: 'details' as ModalView,
  selectedProvider: null as ProviderDetail | null,
  selectedDate: getTodayDate(),
  timeSlots: [] as TimeSlot[],
  selectedSlot: null as TimeSlot | null,
  selectedService: null as string | null,
  workflowId: null as string | null,
  bookingResult: null as BookingResult | null,
  error: null as string | null,
  isLoadingProvider: false,
  isLoadingSlots: false,
  isConfirming: false,
};

export const useBookingStore = create<BookingState>((set, get) => ({
  ...initialState,

  openProviderModal: async (providerId: string, workflowId?: string) => {
    const today = getTodayDate();

    set({
      isModalOpen: true,
      modalView: 'details',
      selectedProvider: null,
      selectedDate: today,
      timeSlots: [],
      selectedSlot: null,
      selectedService: null,
      workflowId: workflowId ?? null,
      bookingResult: null,
      error: null,
      isLoadingProvider: true,
      isLoadingSlots: true,
    });

    try {
      // Tell the backend the user picked this provider. Not critical for
      // display, so a failure here is logged and swallowed.
      if (workflowId) {
        try {
          await selectProviderOnWorkflow(workflowId, providerId);
          logger.debug('Workflow updated for provider selection', { workflowId, providerId });
        } catch (workflowError) {
          logger.warn('Failed to update workflow state', {
            workflowId,
            error: String(workflowError),
          });
        }
      }

      // Provider first so the header paints before the slot grid resolves.
      const provider = await getProvider(providerId);
      set({ selectedProvider: provider, isLoadingProvider: false });

      const availability = await getAvailability(providerId, today);
      set({ timeSlots: availability.slots, isLoadingSlots: false });

      logger.debug('Provider modal opened', {
        providerId,
        providerName: provider.name,
        slotsCount: availability.slots.length,
      });
    } catch (error) {
      logger.error('Failed to open provider modal', {
        providerId,
        error: String(error),
      });
      set({
        error: ERROR_MESSAGES.PROVIDER_LOAD_FAILED,
        isLoadingProvider: false,
        isLoadingSlots: false,
      });
    }
  },

  setSelectedDate: async (date: string) => {
    const { selectedProvider } = get();
    if (!selectedProvider) return;

    set({
      selectedDate: date,
      selectedSlot: null,
      isLoadingSlots: true,
      error: null,
    });

    try {
      const availability = await getAvailability(selectedProvider.id, date);
      set({ timeSlots: availability.slots, isLoadingSlots: false });
      logger.debug('Availability loaded for date', {
        providerId: selectedProvider.id,
        date,
        slotsCount: availability.slots.length,
      });
    } catch (error) {
      logger.error('Failed to load availability', { date, error: String(error) });
      set({
        error: ERROR_MESSAGES.AVAILABILITY_LOAD_FAILED,
        isLoadingSlots: false,
      });
    }
  },

  selectTimeSlot: (slot: TimeSlot) => {
    set({ selectedSlot: slot, error: null });
  },

  selectService: (service: string) => {
    set({ selectedService: service, error: null });
  },

  proceedToConfirmation: () => {
    const { selectedSlot, selectedService } = get();

    if (!selectedSlot) {
      set({ error: 'Please select a time slot.' });
      return;
    }

    if (!selectedService) {
      set({ error: 'Please select a service.' });
      return;
    }

    set({ modalView: 'confirmation', error: null });
  },

  confirmBooking: async () => {
    const { selectedProvider, selectedSlot, selectedService, workflowId } = get();

    if (!selectedProvider || !selectedSlot || !selectedService) {
      set({ error: 'Missing booking information. Please try again.' });
      return;
    }

    // The backend requires workflowId as a UUID (createBookingSchema has no
    // default), so a booking opened without a workflow would 400 every time.
    // The web store sends `workflowId ?? undefined` and hits exactly that.
    // Fail fast with a message the user can act on instead.
    if (!workflowId) {
      logger.warn('Booking attempted with no workflow', { providerId: selectedProvider.id });
      set({ error: ERROR_MESSAGES.BOOKING_FAILED });
      return;
    }

    set({ isConfirming: true, error: null });

    try {
      const booking = await createBooking({
        providerId: selectedProvider.id,
        serviceType: selectedService,
        // Passed through verbatim -- the backend emits and accepts a naive
        // local datetime, so round-tripping it through Date would shift it.
        scheduledAt: selectedSlot.start,
        duration: SLOT_DURATION_MINUTES,
        idempotencyKey: generateIdempotencyKey(
          workflowId,
          selectedProvider.id,
          selectedSlot.start
        ),
        workflowId,
      });

      set({
        modalView: 'success',
        bookingResult: {
          bookingId: booking.id,
          scheduledAt: selectedSlot.start,
          providerName: selectedProvider.name,
          serviceType: selectedService,
          calendarEventAdded: !!booking.calendarEventId,
        },
        isConfirming: false,
      });

      logger.info('Booking confirmed', {
        bookingId: booking.id,
        providerId: selectedProvider.id,
        serviceType: selectedService,
      });
    } catch (error) {
      logger.error('Failed to confirm booking', { error: String(error) });
      set({
        error: ERROR_MESSAGES.BOOKING_FAILED,
        isConfirming: false,
      });
    }
  },

  goBackToDetails: () => {
    set({ modalView: 'details', error: null });
  },

  closeModal: () => {
    set({
      isModalOpen: false,
      modalView: 'details',
      selectedProvider: null,
      selectedSlot: null,
      selectedService: null,
      bookingResult: null,
      error: null,
    });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  reset: () => set(initialState),
}));

export const selectIsModalOpen = (state: BookingState) => state.isModalOpen;
export const selectModalView = (state: BookingState) => state.modalView;
export const selectSelectedProvider = (state: BookingState) => state.selectedProvider;
export const selectSelectedDate = (state: BookingState) => state.selectedDate;
export const selectTimeSlots = (state: BookingState) => state.timeSlots;
export const selectSelectedSlot = (state: BookingState) => state.selectedSlot;
export const selectSelectedService = (state: BookingState) => state.selectedService;
export const selectBookingResult = (state: BookingState) => state.bookingResult;
export const selectError = (state: BookingState) => state.error;
export const selectIsLoadingProvider = (state: BookingState) => state.isLoadingProvider;
export const selectIsLoadingSlots = (state: BookingState) => state.isLoadingSlots;
export const selectIsConfirming = (state: BookingState) => state.isConfirming;

/** The chat input is disabled while the booking flow is open, same as web. */
export const selectIsChatDisabled = (state: BookingState) => state.isModalOpen;
