import { memo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  useBookingStore,
  selectIsModalOpen,
  selectModalView,
  selectSelectedProvider,
  selectSelectedDate,
  selectTimeSlots,
  selectSelectedSlot,
  selectSelectedService,
  selectBookingResult,
  selectError,
  selectIsLoadingProvider,
  selectIsLoadingSlots,
  selectIsConfirming,
} from '../store/booking-store';
import { useMenuStore, selectCalendarConnected } from '../store/menu-store';
import { RatingStars } from './RatingStars';
import { TimeSlotGrid } from './TimeSlotGrid';
import { ServiceSelector } from './ServiceSelector';
import { BookingConfirmation } from './BookingConfirmation';
import { Button } from './Button';

/**
 * Modal overlay with escape key handling
 */
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Close button for the modal header
 */
function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
      aria-label="Close"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

/**
 * Provider details view with info, service selector, and time slots
 */
function DetailsView() {
  const provider = useBookingStore(selectSelectedProvider);
  const selectedDate = useBookingStore(selectSelectedDate);
  const timeSlots = useBookingStore(selectTimeSlots);
  const selectedSlot = useBookingStore(selectSelectedSlot);
  const selectedService = useBookingStore(selectSelectedService);
  const isLoadingProvider = useBookingStore(selectIsLoadingProvider);
  const isLoadingSlots = useBookingStore(selectIsLoadingSlots);
  const error = useBookingStore(selectError);
  const { selectTimeSlot, selectService, setSelectedDate, proceedToConfirmation, closeModal } =
    useBookingStore();

  if (isLoadingProvider) {
    return (
      <div className="p-6">
        <div className="flex justify-end">
          <CloseButton onClick={closeModal} />
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
          <span className="ml-3 text-slate-600">Loading provider details...</span>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="p-6">
        <div className="flex justify-end">
          <CloseButton onClick={closeModal} />
        </div>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <svg
            className="w-12 h-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-slate-600 text-center">
            {error || 'Unable to load provider details. Please try again.'}
          </p>
          <Button variant="secondary" onClick={closeModal}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  const canContinue = selectedSlot && selectedService;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="heading-2">{provider.name}</h2>
          <p className="text-sm text-slate-600 capitalize">{provider.category}</p>
        </div>
        <CloseButton onClick={closeModal} />
      </div>

      {/* Rating & Address */}
      <div className="space-y-2">
        <RatingStars rating={provider.rating} reviewCount={provider.reviewCount} />
        <div className="flex items-start gap-1.5 text-sm text-slate-600">
          <svg
            className="h-4 w-4 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
          <span>{provider.address}</span>
        </div>
        {provider.phoneNumber && (
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
              />
            </svg>
            <span>{provider.phoneNumber}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {provider.description && (
        <p className="text-slate-600 text-sm leading-relaxed">{provider.description}</p>
      )}

      <hr className="border-slate-200" />

      {/* Service Selector */}
      <ServiceSelector
        services={provider.services}
        selectedService={selectedService}
        onServiceSelect={selectService}
      />

      {/* Time Slot Grid */}
      <TimeSlotGrid
        slots={timeSlots}
        selectedSlot={selectedSlot}
        selectedDate={selectedDate}
        isLoading={isLoadingSlots}
        onSlotSelect={selectTimeSlot}
        onDateChange={setSelectedDate}
      />

      {/* Error Message */}
      {error && (
        <div className="status-error">
          <svg
            className="w-5 h-5 text-red-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Continue Button */}
      <Button
        variant="primary"
        size="large"
        onClick={proceedToConfirmation}
        disabled={!canContinue}
        className="w-full"
      >
        Continue to Confirmation
      </Button>
    </div>
  );
}

/**
 * Success view after booking is confirmed
 */
function SuccessView() {
  const bookingResult = useBookingStore(selectBookingResult);
  const { closeModal } = useBookingStore();

  if (!bookingResult) {
    return null;
  }

  return (
    <div className="p-6 space-y-6 text-center">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="heading-2 text-green-700">You're all set!</h2>
        <p className="body-small mt-2">
          Your appointment at {bookingResult.providerName} is confirmed.
        </p>
        {bookingResult.calendarEventAdded && (
          <p className="body-small mt-2 text-slate-600">I've added it to your Google Calendar.</p>
        )}
      </div>

      {/* Booking Details */}
      <div className="card-info text-left space-y-3">
        <div>
          <p className="caption uppercase tracking-wide">Service</p>
          <p className="font-semibold text-slate-900">{bookingResult.serviceType}</p>
        </div>
        <div>
          <p className="caption uppercase tracking-wide">Booking Reference</p>
          <p className="font-mono text-sm text-slate-700">{bookingResult.bookingId}</p>
        </div>
      </div>

      {/* Close Button */}
      <Button variant="primary" onClick={closeModal} className="w-full">
        Close
      </Button>
    </div>
  );
}

/**
 * Main provider detail modal that renders based on modalView state.
 */
export const ProviderDetailModal = memo(function ProviderDetailModal() {
  const isModalOpen = useBookingStore(selectIsModalOpen);
  const modalView = useBookingStore(selectModalView);
  const provider = useBookingStore(selectSelectedProvider);
  const selectedSlot = useBookingStore(selectSelectedSlot);
  const selectedService = useBookingStore(selectSelectedService);
  const isConfirming = useBookingStore(selectIsConfirming);
  const error = useBookingStore(selectError);
  const calendarConnected = useMenuStore(selectCalendarConnected);
  const { confirmBooking, goBackToDetails, closeModal } = useBookingStore();

  const handleClose = useCallback(() => {
    closeModal();
  }, [closeModal]);

  if (!isModalOpen) {
    return null;
  }

  // Render modal content based on view
  let content: React.ReactNode;

  switch (modalView) {
    case 'confirmation':
      if (provider && selectedSlot && selectedService) {
        content = (
          <div className="p-6">
            {error && (
              <div className="status-error mb-4">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            <BookingConfirmation
              provider={provider}
              service={selectedService}
              slot={selectedSlot}
              isConfirming={isConfirming}
              calendarConnected={calendarConnected}
              onConfirm={confirmBooking}
              onBack={goBackToDetails}
            />
          </div>
        );
      }
      break;

    case 'success':
      content = <SuccessView />;
      break;

    case 'details':
    default:
      content = <DetailsView />;
      break;
  }

  return createPortal(<ModalOverlay onClose={handleClose}>{content}</ModalOverlay>, document.body);
});
