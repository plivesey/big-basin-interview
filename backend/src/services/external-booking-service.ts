import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

/**
 * Response from external booking service
 */
export interface ExternalBookingResponse {
  success: boolean;
  externalBookingId: string;
  error?: string;
}

/**
 * Booking details to submit to external provider
 */
export interface ExternalBookingDetails {
  serviceType: string;
  scheduledAt: Date;
  duration: number;
  customerInfo?: {
    userId: string;
  };
}

/**
 * Mock third-party booking service
 *
 * This simulates an external API call to a provider's booking system
 * (e.g., Calendly, Square Appointments, custom provider APIs).
 *
 * In the future, this can be replaced with real integrations
 * by implementing provider-specific adapters.
 */
export async function submitBookingToProvider(
  providerId: string,
  bookingDetails: ExternalBookingDetails
): Promise<ExternalBookingResponse> {
  logger.debug('Submitting booking to external provider', {
    providerId,
    serviceType: bookingDetails.serviceType,
    scheduledAt: bookingDetails.scheduledAt.toISOString(),
  });

  // Simulate network latency (100ms)
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Generate a mock external booking ID
  const externalBookingId = `ext-${uuidv4().slice(0, 8)}`;

  logger.info('External booking submitted successfully', {
    providerId,
    externalBookingId,
  });

  return {
    success: true,
    externalBookingId,
  };
}
