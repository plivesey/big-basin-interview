import { describe, it, expect, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import {
  createBooking,
  getBookingById,
  getBookingsByUser,
  cancelBooking,
  checkIdempotency,
  CreateBookingData,
} from '../../src/services/booking-service';
import { rawDb } from '../../src/db';
import { ApiError } from '../../src/middleware/error-handler';

// Helper to insert a test provider
function insertTestProvider(id?: string): string {
  const providerId = id || uuidv4();
  const now = Math.floor(Date.now() / 1000);

  rawDb.exec(`
    INSERT INTO providers (id, name, category, description, address, geo, latitude, longitude, rating, review_count, working_hours, services, created_at, updated_at)
    VALUES (
      '${providerId}',
      'Test Provider',
      'salon',
      'A test provider',
      '123 Test St',
      'seattle',
      40.7128,
      -74.006,
      4.5,
      0,
      '${JSON.stringify({ monday: { open: '09:00', close: '17:00' } })}',
      '${JSON.stringify(['haircut', 'styling'])}',
      ${now},
      ${now}
    )
  `);

  return providerId;
}

// Helper to insert a test booking directly
function insertTestBooking(overrides: Partial<{
  id: string;
  userId: string;
  providerId: string;
  serviceType: string;
  scheduledAt: Date;
  duration: number;
  status: string;
  idempotencyKey: string;
}> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const scheduledAt = overrides.scheduledAt || new Date('2025-12-20T10:00:00Z');

  const booking = {
    id: overrides.id || uuidv4(),
    userId: overrides.userId || 'default_user',
    providerId: overrides.providerId || uuidv4(),
    serviceType: overrides.serviceType || 'haircut',
    scheduledAt: Math.floor(scheduledAt.getTime() / 1000),
    duration: overrides.duration || 60,
    status: overrides.status || 'confirmed',
    idempotencyKey: overrides.idempotencyKey || uuidv4(),
  };

  rawDb.exec(`
    INSERT INTO bookings (id, user_id, provider_id, service_type, scheduled_at, duration, status, idempotency_key, created_at, updated_at)
    VALUES (
      '${booking.id}',
      '${booking.userId}',
      '${booking.providerId}',
      '${booking.serviceType}',
      ${booking.scheduledAt},
      ${booking.duration},
      '${booking.status}',
      '${booking.idempotencyKey}',
      ${now},
      ${now}
    )
  `);

  return booking;
}

describe('booking-service', () => {
  beforeEach(() => {
    // Clear tables before each test (order matters due to foreign keys)
    rawDb.exec('DELETE FROM bookings');
    rawDb.exec('DELETE FROM providers');
  });

  describe('createBooking', () => {
    it('should create booking with all required fields', async () => {
      const providerId = insertTestProvider();
      const data: CreateBookingData = {
        userId: 'test_user',
        providerId,
        serviceType: 'haircut',
        scheduledAt: new Date('2025-12-20T10:00:00Z'),
        duration: 60,
      };
      const idempotencyKey = uuidv4();

      const result = await createBooking(data, idempotencyKey);

      expect(result.created).toBe(true);
      expect(result.booking.id).toBeDefined();
      expect(result.booking.userId).toBe('test_user');
      expect(result.booking.providerId).toBe(providerId);
      expect(result.booking.serviceType).toBe('haircut');
      expect(result.booking.duration).toBe(60);
      expect(result.booking.status).toBe('confirmed');
      expect(result.booking.idempotencyKey).toBe(idempotencyKey);
    });

    it('should generate unique booking ID', async () => {
      const providerId = insertTestProvider();
      const data: CreateBookingData = {
        userId: 'test_user',
        providerId,
        serviceType: 'haircut',
        scheduledAt: new Date('2025-12-20T10:00:00Z'),
        duration: 60,
      };

      const result1 = await createBooking(data, uuidv4());
      const result2 = await createBooking(data, uuidv4());

      expect(result1.booking.id).not.toBe(result2.booking.id);
    });

    it('should set status to confirmed by default', async () => {
      const providerId = insertTestProvider();
      const data: CreateBookingData = {
        userId: 'test_user',
        providerId,
        serviceType: 'haircut',
        scheduledAt: new Date('2025-12-20T10:00:00Z'),
        duration: 60,
      };

      const result = await createBooking(data, uuidv4());

      expect(result.booking.status).toBe('confirmed');
    });

    it('should set timestamps correctly', async () => {
      const providerId = insertTestProvider();
      const beforeCreate = new Date();
      const data: CreateBookingData = {
        userId: 'test_user',
        providerId,
        serviceType: 'haircut',
        scheduledAt: new Date('2025-12-20T10:00:00Z'),
        duration: 60,
      };

      const result = await createBooking(data, uuidv4());
      const afterCreate = new Date();

      expect(result.booking.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime() - 1000);
      expect(result.booking.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + 1000);
    });

    it('should return existing booking when idempotencyKey matches', async () => {
      const providerId = insertTestProvider();
      const idempotencyKey = uuidv4();
      const data: CreateBookingData = {
        userId: 'test_user',
        providerId,
        serviceType: 'haircut',
        scheduledAt: new Date('2025-12-20T10:00:00Z'),
        duration: 60,
      };

      // Create first booking
      const result1 = await createBooking(data, idempotencyKey);
      expect(result1.created).toBe(true);

      // Try to create with same idempotency key
      const result2 = await createBooking(data, idempotencyKey);
      expect(result2.created).toBe(false);
      expect(result2.booking.id).toBe(result1.booking.id);
    });

    it('should create new booking for different idempotencyKey', async () => {
      const providerId = insertTestProvider();
      const data: CreateBookingData = {
        userId: 'test_user',
        providerId,
        serviceType: 'haircut',
        scheduledAt: new Date('2025-12-20T10:00:00Z'),
        duration: 60,
      };

      const result1 = await createBooking(data, uuidv4());
      const result2 = await createBooking(data, uuidv4());

      expect(result1.created).toBe(true);
      expect(result2.created).toBe(true);
      expect(result1.booking.id).not.toBe(result2.booking.id);
    });

    it('should reject booking with non-existent providerId', async () => {
      const data: CreateBookingData = {
        userId: 'test_user',
        providerId: uuidv4(), // Non-existent
        serviceType: 'haircut',
        scheduledAt: new Date('2025-12-20T10:00:00Z'),
        duration: 60,
      };

      await expect(createBooking(data, uuidv4())).rejects.toThrow(ApiError);
      await expect(createBooking(data, uuidv4())).rejects.toThrow(/not found/);
    });
  });

  describe('getBookingById', () => {
    it('should return booking when found', async () => {
      const providerId = insertTestProvider();
      const inserted = insertTestBooking({ providerId, serviceType: 'styling' });

      const booking = await getBookingById(inserted.id);

      expect(booking).not.toBeNull();
      expect(booking?.id).toBe(inserted.id);
      expect(booking?.serviceType).toBe('styling');
    });

    it('should return null when booking not found', async () => {
      const booking = await getBookingById(uuidv4());

      expect(booking).toBeNull();
    });

    it('should return null for empty ID', async () => {
      const booking = await getBookingById('');

      expect(booking).toBeNull();
    });

    it('should return null for whitespace-only ID', async () => {
      const booking = await getBookingById('   ');

      expect(booking).toBeNull();
    });
  });

  describe('getBookingsByUser', () => {
    it('should return all bookings for user', async () => {
      const providerId = insertTestProvider();
      insertTestBooking({ providerId, userId: 'user_a' });
      insertTestBooking({ providerId, userId: 'user_a' });
      insertTestBooking({ providerId, userId: 'user_b' });

      const bookings = await getBookingsByUser('user_a');

      expect(bookings).toHaveLength(2);
      expect(bookings.every((b) => b.userId === 'user_a')).toBe(true);
    });

    it('should order by scheduledAt descending', async () => {
      const providerId = insertTestProvider();
      insertTestBooking({
        providerId,
        userId: 'test_user',
        scheduledAt: new Date('2025-12-20T10:00:00Z'),
        serviceType: 'early',
      });
      insertTestBooking({
        providerId,
        userId: 'test_user',
        scheduledAt: new Date('2025-12-25T10:00:00Z'),
        serviceType: 'late',
      });
      insertTestBooking({
        providerId,
        userId: 'test_user',
        scheduledAt: new Date('2025-12-22T10:00:00Z'),
        serviceType: 'middle',
      });

      const bookings = await getBookingsByUser('test_user');

      expect(bookings[0].serviceType).toBe('late');
      expect(bookings[1].serviceType).toBe('middle');
      expect(bookings[2].serviceType).toBe('early');
    });

    it('should return empty array for user with no bookings', async () => {
      const bookings = await getBookingsByUser('nonexistent_user');

      expect(bookings).toHaveLength(0);
    });

    it('should return empty array for empty userId', async () => {
      const bookings = await getBookingsByUser('');

      expect(bookings).toHaveLength(0);
    });
  });

  describe('cancelBooking', () => {
    it('should set status to cancelled', async () => {
      const providerId = insertTestProvider();
      const inserted = insertTestBooking({ providerId, status: 'confirmed' });

      const result = await cancelBooking(inserted.id);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('cancelled');

      // Verify it persisted
      const reloaded = await getBookingById(inserted.id);
      expect(reloaded?.status).toBe('cancelled');
    });

    it('should return the cancelled booking with its original details', async () => {
      const providerId = insertTestProvider();
      const inserted = insertTestBooking({ providerId, serviceType: 'styling' });

      const result = await cancelBooking(inserted.id);

      expect(result?.id).toBe(inserted.id);
      expect(result?.serviceType).toBe('styling');
    });

    it('should return null when booking does not exist', async () => {
      const result = await cancelBooking(uuidv4());

      expect(result).toBeNull();
    });

    it('should bump the updatedAt timestamp', async () => {
      const providerId = insertTestProvider();
      const inserted = insertTestBooking({ providerId });

      const result = await cancelBooking(inserted.id);

      expect(result?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('checkIdempotency', () => {
    it('should return booking when key exists', async () => {
      const providerId = insertTestProvider();
      const idempotencyKey = uuidv4();
      insertTestBooking({ providerId, idempotencyKey });

      const booking = await checkIdempotency(idempotencyKey);

      expect(booking).not.toBeNull();
      expect(booking?.idempotencyKey).toBe(idempotencyKey);
    });

    it('should return null when key does not exist', async () => {
      const booking = await checkIdempotency(uuidv4());

      expect(booking).toBeNull();
    });

    it('should return null for empty key', async () => {
      const booking = await checkIdempotency('');

      expect(booking).toBeNull();
    });
  });
});
