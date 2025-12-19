import { memo } from 'react';
import type { ProviderDetail, TimeSlot } from '@asba/shared-types';
import { Button } from './Button';

interface BookingConfirmationProps {
  provider: ProviderDetail;
  service: string;
  slot: TimeSlot;
  isConfirming: boolean;
  calendarConnected?: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * Format datetime for display (e.g., "Tuesday, Dec 17 at 2:30 PM")
 */
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} at ${timeStr}`;
}

/**
 * Booking confirmation view with summary and confirm/back buttons.
 */
export const BookingConfirmation = memo(function BookingConfirmation({
  provider,
  service,
  slot,
  isConfirming,
  calendarConnected,
  onConfirm,
  onBack,
}: BookingConfirmationProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="heading-3">Confirm your booking</h3>
        <p className="body-small mt-1">
          Review the details below. Once you confirm, your booking will be finalized.
        </p>
        {calendarConnected && (
          <p className="body-small mt-2 text-slate-600">
            I'll add this to your Google Calendar once you confirm.
          </p>
        )}
      </div>

      {/* Booking Summary */}
      <div className="card-info space-y-4">
        {/* Provider */}
        <div>
          <p className="caption uppercase tracking-wide">Provider</p>
          <p className="font-semibold text-slate-900">{provider.name}</p>
          <p className="text-sm text-slate-600">{provider.address}</p>
        </div>

        {/* Service */}
        <div>
          <p className="caption uppercase tracking-wide">Service</p>
          <p className="font-semibold text-slate-900">{service}</p>
        </div>

        {/* Date & Time */}
        <div>
          <p className="caption uppercase tracking-wide">Date & Time</p>
          <p className="font-semibold text-slate-900">{formatDateTime(slot.start)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button variant="secondary" onClick={onBack} disabled={isConfirming} className="flex-1">
          Back
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          loading={isConfirming}
          disabled={isConfirming}
          className="flex-1"
        >
          Confirm Booking
        </Button>
      </div>
    </div>
  );
});
