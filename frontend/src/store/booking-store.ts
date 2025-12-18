import { create } from 'zustand';
import type { ProviderDetail, TimeSlot } from '@asba/shared-types';
import { logger } from '../utils/logger';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Modal view states:
 * - 'details': Provider info + service selector + time slot grid
 * - 'confirmation': Booking summary with confirm button
 * - 'success': Booking success message with booking ID
 */
export type ModalView = 'details' | 'confirmation' | 'success';

/**
 * Booking result returned after successful booking
 */
export interface BookingResult {
  bookingId: string;
  scheduledAt: string;
  providerName: string;
  serviceType: string;
  calendarEventAdded: boolean;
}

/**
 * Booking store state for managing the provider detail modal and booking flow
 */
export interface BookingState {
  // Modal state
  isModalOpen: boolean;
  modalView: ModalView;

  // Selected provider (full details for modal)
  selectedProvider: ProviderDetail | null;

  // Time slots (fetched via REST when modal opens)
  selectedDate: string; // YYYY-MM-DD
  timeSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;

  // Service type (user selects before confirming)
  selectedService: string | null;

  // Workflow ID for completing the booking workflow
  workflowId: string | null;

  // Success result
  bookingResult: BookingResult | null;

  // Error message
  error: string | null;

  // Loading states
  isLoadingProvider: boolean;
  isLoadingSlots: boolean;
  isConfirming: boolean;

  // Actions
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

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate an idempotency key for booking
 */
function generateIdempotencyKey(
  workflowId: string | null,
  providerId: string,
  scheduledAt: string
): string {
  const base = workflowId || `modal-${Date.now()}`;
  return `${base}:${providerId}:${scheduledAt}`;
}

// Initial state
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

// Create the store
export const useBookingStore = create<BookingState>((set, get) => ({
  ...initialState,

  openProviderModal: async (providerId: string, workflowId?: string) => {
    // Reset state and start loading
    set({
      isModalOpen: true,
      modalView: 'details',
      selectedProvider: null,
      selectedDate: getTodayDate(),
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
      // Notify backend that user selected this provider (updates workflow state)
      if (workflowId) {
        try {
          await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/select-provider`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ providerId }),
          });
          logger.debug('Workflow updated for provider selection', { workflowId, providerId });
        } catch (workflowError) {
          // Log but don't fail - workflow update is not critical for modal display
          logger.warn('Failed to update workflow state', { workflowId, error: String(workflowError) });
        }
      }

      const providerUrl = `${BACKEND_URL}/api/providers/${providerId}`;
      const availabilityUrl = `${BACKEND_URL}/api/providers/${providerId}/availability?date=${getTodayDate()}`;

      logger.debug('Fetching provider details', { providerUrl, availabilityUrl });

      // Fetch provider details and availability in parallel
      const [providerResponse, availabilityResponse] = await Promise.all([
        fetch(providerUrl),
        fetch(availabilityUrl),
      ]);

      if (!providerResponse.ok) {
        const errorData = await providerResponse.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP ${providerResponse.status}`;
        throw new Error(`Failed to load provider: ${errorMessage}`);
      }

      const providerData = await providerResponse.json();
      const provider = providerData.data.provider as ProviderDetail;

      // Set provider details immediately
      set({
        selectedProvider: provider,
        isLoadingProvider: false,
      });

      if (!availabilityResponse.ok) {
        const errorData = await availabilityResponse.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP ${availabilityResponse.status}`;
        throw new Error(`Failed to load availability: ${errorMessage}`);
      }

      const availabilityData = await availabilityResponse.json();
      const slots = availabilityData.data.slots as TimeSlot[];

      set({
        timeSlots: slots,
        isLoadingSlots: false,
      });

      logger.debug('Provider modal opened', {
        providerId,
        providerName: provider.name,
        slotsCount: slots.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to open provider modal', {
        providerId,
        error: errorMessage,
        backendUrl: BACKEND_URL,
      });
      set({
        error: errorMessage || 'Unable to load provider details. Please try again.',
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
      selectedSlot: null, // Clear slot selection when date changes
      isLoadingSlots: true,
      error: null,
    });

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/providers/${selectedProvider.id}/availability?date=${date}`
      );

      if (!response.ok) {
        throw new Error('Failed to load availability');
      }

      const data = await response.json();
      const slots = data.data.slots as TimeSlot[];

      set({
        timeSlots: slots,
        isLoadingSlots: false,
      });

      logger.debug('Availability loaded for date', {
        providerId: selectedProvider.id,
        date,
        slotsCount: slots.length,
      });
    } catch (error) {
      logger.error('Failed to load availability', { date, error: String(error) });
      set({
        error: 'Unable to load availability for this date. Please try again.',
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

    set({ isConfirming: true, error: null });

    try {
      const idempotencyKey = generateIdempotencyKey(
        workflowId,
        selectedProvider.id,
        selectedSlot.start
      );

      const response = await fetch(`${BACKEND_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          serviceType: selectedService,
          scheduledAt: selectedSlot.start,
          duration: 30, // Default 30-minute slots
          idempotencyKey,
          workflowId: workflowId ?? undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const data = await response.json();
      const booking = data.data.booking;

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
        error: 'Unable to complete your booking. Please try again.',
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

// Selectors for optimized subscriptions
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

// Derived selector for chat disabled state
export const selectIsChatDisabled = (state: BookingState) => state.isModalOpen;
