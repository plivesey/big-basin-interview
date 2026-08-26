import type { ProviderDetail, TimeSlot } from '@asba/shared-types';

jest.mock('../../api/providers', () => ({
  getProvider: jest.fn(),
  getAvailability: jest.fn(),
}));
jest.mock('../../api/bookings', () => ({
  createBooking: jest.fn(),
}));
jest.mock('../../api/workflows', () => ({
  selectProvider: jest.fn(),
}));

/* eslint-disable import/first -- must follow the jest.mock calls above. */
import { useBookingStore } from '../booking-store';
import { getProvider, getAvailability } from '../../api/providers';
import { createBooking } from '../../api/bookings';
import { selectProvider } from '../../api/workflows';
/* eslint-enable import/first */

const provider: ProviderDetail = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Luxe Salon',
  category: 'Salon',
  rating: 4.8,
  reviewCount: 150,
  services: ['Haircut', 'Colour'],
  address: '123 Main St',
  description: 'Premium hair styling',
  phoneNumber: null,
  email: null,
  website: null,
  workingHours: {},
};

const slot: TimeSlot = {
  start: '2026-08-26T14:30:00',
  end: '2026-08-26T15:00:00',
  available: true,
};

const WORKFLOW_ID = '22222222-2222-2222-2222-222222222222';

describe('booking-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useBookingStore.getState().reset();
    (getProvider as jest.Mock).mockResolvedValue(provider);
    (getAvailability as jest.Mock).mockResolvedValue({
      providerId: provider.id,
      providerName: provider.name,
      date: '2026-08-26',
      slots: [slot],
    });
    (selectProvider as jest.Mock).mockResolvedValue({});
    (createBooking as jest.Mock).mockResolvedValue({
      id: 'booking-1',
      providerId: provider.id,
      serviceType: 'Haircut',
      scheduledAt: slot.start,
      duration: 30,
      status: 'confirmed',
      calendarEventId: null,
    });
  });

  describe('openProviderModal', () => {
    it('loads the provider and its availability', async () => {
      await useBookingStore.getState().openProviderModal(provider.id, WORKFLOW_ID);

      const state = useBookingStore.getState();
      expect(state.isModalOpen).toBe(true);
      expect(state.selectedProvider).toEqual(provider);
      expect(state.timeSlots).toEqual([slot]);
      expect(state.isLoadingProvider).toBe(false);
      expect(state.isLoadingSlots).toBe(false);
    });

    it('tells the workflow which provider was picked', async () => {
      await useBookingStore.getState().openProviderModal(provider.id, WORKFLOW_ID);
      expect(selectProvider).toHaveBeenCalledWith(WORKFLOW_ID, provider.id);
    });

    it('still opens when the workflow update fails', async () => {
      (selectProvider as jest.Mock).mockRejectedValue(new Error('nope'));
      await useBookingStore.getState().openProviderModal(provider.id, WORKFLOW_ID);
      expect(useBookingStore.getState().selectedProvider).toEqual(provider);
    });

    it('surfaces a friendly error when the provider will not load', async () => {
      (getProvider as jest.Mock).mockRejectedValue(new Error('boom'));
      await useBookingStore.getState().openProviderModal(provider.id, WORKFLOW_ID);

      const state = useBookingStore.getState();
      expect(state.error).toBeTruthy();
      expect(state.isLoadingProvider).toBe(false);
      expect(state.isLoadingSlots).toBe(false);
    });
  });

  describe('proceedToConfirmation', () => {
    it('refuses without a slot', () => {
      useBookingStore.getState().proceedToConfirmation();
      expect(useBookingStore.getState().modalView).toBe('details');
      expect(useBookingStore.getState().error).toBeTruthy();
    });

    it('refuses without a service', () => {
      useBookingStore.getState().selectTimeSlot(slot);
      useBookingStore.getState().proceedToConfirmation();
      expect(useBookingStore.getState().modalView).toBe('details');
    });

    it('advances once both are chosen', () => {
      useBookingStore.getState().selectTimeSlot(slot);
      useBookingStore.getState().selectService('Haircut');
      useBookingStore.getState().proceedToConfirmation();
      expect(useBookingStore.getState().modalView).toBe('confirmation');
    });
  });

  describe('confirmBooking', () => {
    async function reachConfirmation(workflowId?: string) {
      await useBookingStore.getState().openProviderModal(provider.id, workflowId);
      useBookingStore.getState().selectTimeSlot(slot);
      useBookingStore.getState().selectService('Haircut');
      useBookingStore.getState().proceedToConfirmation();
    }

    it('sends the slot time through untouched', async () => {
      await reachConfirmation(WORKFLOW_ID);
      await useBookingStore.getState().confirmBooking();

      // Round-tripping through Date would shift a naive local datetime.
      expect(createBooking).toHaveBeenCalledWith(
        expect.objectContaining({ scheduledAt: '2026-08-26T14:30:00', duration: 30 })
      );
    });

    it('includes the workflow id the backend requires', async () => {
      await reachConfirmation(WORKFLOW_ID);
      await useBookingStore.getState().confirmBooking();

      expect(createBooking).toHaveBeenCalledWith(
        expect.objectContaining({ workflowId: WORKFLOW_ID })
      );
    });

    it('builds an idempotency key from workflow, provider and slot', async () => {
      await reachConfirmation(WORKFLOW_ID);
      await useBookingStore.getState().confirmBooking();

      expect(createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: `${WORKFLOW_ID}:${provider.id}:${slot.start}`,
        })
      );
    });

    it('does not fire a request that is certain to 400', async () => {
      // createBookingSchema requires workflowId as a UUID with no default. The
      // web store sends `workflowId ?? undefined` here and always 400s.
      await reachConfirmation(undefined);
      await useBookingStore.getState().confirmBooking();

      expect(createBooking).not.toHaveBeenCalled();
      expect(useBookingStore.getState().error).toBeTruthy();
      expect(useBookingStore.getState().modalView).toBe('confirmation');
    });

    it('moves to the success view with the booking result', async () => {
      await reachConfirmation(WORKFLOW_ID);
      await useBookingStore.getState().confirmBooking();

      const state = useBookingStore.getState();
      expect(state.modalView).toBe('success');
      expect(state.bookingResult).toEqual({
        bookingId: 'booking-1',
        scheduledAt: slot.start,
        providerName: 'Luxe Salon',
        serviceType: 'Haircut',
        calendarEventAdded: false,
      });
    });

    it('reports a failure without leaving the confirmation view', async () => {
      (createBooking as jest.Mock).mockRejectedValue(new Error('502'));
      await reachConfirmation(WORKFLOW_ID);
      await useBookingStore.getState().confirmBooking();

      const state = useBookingStore.getState();
      expect(state.modalView).toBe('confirmation');
      expect(state.error).toBeTruthy();
      expect(state.isConfirming).toBe(false);
    });
  });

  describe('closeModal', () => {
    it('clears the selection', async () => {
      await useBookingStore.getState().openProviderModal(provider.id, WORKFLOW_ID);
      useBookingStore.getState().closeModal();

      const state = useBookingStore.getState();
      expect(state.isModalOpen).toBe(false);
      expect(state.selectedProvider).toBeNull();
      expect(state.modalView).toBe('details');
    });
  });

  describe('selectIsChatDisabled', () => {
    it('disables the chat input while the booking flow is open', async () => {
      await useBookingStore.getState().openProviderModal(provider.id, WORKFLOW_ID);
      expect(useBookingStore.getState().isModalOpen).toBe(true);
    });
  });
});
