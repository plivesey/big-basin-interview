import { describe, it, expect } from 'vitest';
import {
  submitBookingToProvider,
  ExternalBookingDetails,
} from '../../src/services/external-booking-service';
import { v4 as uuidv4 } from 'uuid';

describe('external-booking-service', () => {
  describe('submitBookingToProvider', () => {
    it('should return success after simulated delay', async () => {
      const providerId = uuidv4();
      const bookingDetails: ExternalBookingDetails = {
        serviceType: 'haircut',
        scheduledAt: new Date('2025-12-20T10:00:00Z'),
        duration: 60,
      };

      const startTime = Date.now();
      const result = await submitBookingToProvider(providerId, bookingDetails);
      const elapsed = Date.now() - startTime;

      expect(result.success).toBe(true);
      // Should take at least 100ms due to simulated latency
      expect(elapsed).toBeGreaterThanOrEqual(95); // Allow small margin
    });

    it('should return an external booking ID', async () => {
      const providerId = uuidv4();
      const bookingDetails: ExternalBookingDetails = {
        serviceType: 'oil change',
        scheduledAt: new Date('2025-12-21T14:00:00Z'),
        duration: 30,
      };

      const result = await submitBookingToProvider(providerId, bookingDetails);

      expect(result.externalBookingId).toBeDefined();
      expect(result.externalBookingId).toMatch(/^ext-[a-f0-9]{8}$/);
    });

    it('should handle booking details with customer info', async () => {
      const providerId = uuidv4();
      const bookingDetails: ExternalBookingDetails = {
        serviceType: 'dental cleaning',
        scheduledAt: new Date('2025-12-22T09:00:00Z'),
        duration: 45,
        customerInfo: {
          userId: 'default_user',
        },
      };

      const result = await submitBookingToProvider(providerId, bookingDetails);

      expect(result.success).toBe(true);
      expect(result.externalBookingId).toBeDefined();
    });

    it('should generate unique external booking IDs for each call', async () => {
      const providerId = uuidv4();
      const bookingDetails: ExternalBookingDetails = {
        serviceType: 'haircut',
        scheduledAt: new Date('2025-12-20T10:00:00Z'),
        duration: 60,
      };

      const result1 = await submitBookingToProvider(providerId, bookingDetails);
      const result2 = await submitBookingToProvider(providerId, bookingDetails);

      expect(result1.externalBookingId).not.toBe(result2.externalBookingId);
    });
  });
});
