import { apiPost } from './client';

export interface CreateBookingInput {
  providerId: string;
  serviceType: string;
  /** Naive local datetime, exactly as the availability endpoint returned it. */
  scheduledAt: string;
  duration: number;
  idempotencyKey: string;
  /** Required by the backend -- see booking-store.confirmBooking. */
  workflowId: string;
}

export interface Booking {
  id: string;
  providerId: string;
  serviceType: string;
  scheduledAt: string;
  duration: number;
  status: string;
  calendarEventId: string | null;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const data = await apiPost<{ booking: Booking }>('/api/bookings', input);
  return data.booking;
}
