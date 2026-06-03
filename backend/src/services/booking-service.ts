import { v4 as uuidv4 } from 'uuid';
import { eq, desc } from 'drizzle-orm';
import { db, bookings, Booking, NewBooking } from '../db';
import { getProviderById } from './provider-service';
import { submitBookingToProvider } from './external-booking-service';
import { isCalendarConnected, createEvent } from './calendar-service';
import { ApiError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

/**
 * Data required to create a booking
 */
export interface CreateBookingData {
  userId: string;
  providerId: string;
  serviceType: string;
  scheduledAt: Date;
  duration: number;
}

/**
 * Result of creating a booking
 */
export interface CreateBookingResult {
  booking: Booking;
  created: boolean;
}

/**
 * Check if a booking with the given idempotency key exists
 */
export async function checkIdempotency(idempotencyKey: string): Promise<Booking | null> {
  if (!idempotencyKey || !idempotencyKey.trim()) {
    return null;
  }

  logger.debug('Checking idempotency', { idempotencyKey });

  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.idempotencyKey, idempotencyKey))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  logger.debug('Found existing booking with idempotency key', {
    idempotencyKey,
    bookingId: result[0].id,
  });

  return result[0];
}

/**
 * Create a new booking with idempotency check
 *
 * If a booking with the same idempotencyKey exists, returns the existing booking
 * with created=false. Otherwise creates a new booking and returns created=true.
 */
export async function createBooking(
  data: CreateBookingData,
  idempotencyKey: string
): Promise<CreateBookingResult> {
  logger.debug('Creating booking', {
    providerId: data.providerId,
    serviceType: data.serviceType,
    scheduledAt: data.scheduledAt.toISOString(),
  });

  // Step 1: Check idempotency
  const existingBooking = await checkIdempotency(idempotencyKey);
  if (existingBooking) {
    logger.info('Returning existing booking (idempotent)', {
      bookingId: existingBooking.id,
      idempotencyKey,
    });
    return { booking: existingBooking, created: false };
  }

  // Step 2: Validate provider exists
  const provider = await getProviderById(data.providerId);
  if (!provider) {
    logger.warn('Booking failed: provider not found', { providerId: data.providerId });
    throw new ApiError(400, 'INVALID_PROVIDER', `Provider with ID '${data.providerId}' not found`);
  }

  // Step 3: Call external booking service (mock 100ms delay)
  const externalResult = await submitBookingToProvider(data.providerId, {
    serviceType: data.serviceType,
    scheduledAt: data.scheduledAt,
    duration: data.duration,
    customerInfo: { userId: data.userId },
  });

  if (!externalResult.success) {
    logger.error('External booking service failed', {
      providerId: data.providerId,
      error: externalResult.error,
    });
    throw new ApiError(502, 'EXTERNAL_BOOKING_FAILED', 'Failed to book with provider');
  }

  // Step 4: Create booking in database
  const now = new Date();
  const newBooking: NewBooking = {
    id: uuidv4(),
    userId: data.userId,
    providerId: data.providerId,
    serviceType: data.serviceType,
    scheduledAt: data.scheduledAt,
    duration: data.duration,
    status: 'confirmed',
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(bookings).values(newBooking);

  let calendarEventId: string | null = null;

  // Step 5: Create calendar event if connected (non-blocking)
  try {
    const calendarConnected = await isCalendarConnected();
    if (calendarConnected) {
      const endTime = new Date(data.scheduledAt.getTime() + data.duration * 60 * 1000);

      calendarEventId = await createEvent({
        title: `${data.serviceType} at ${provider.name}`,
        startTime: data.scheduledAt,
        endTime,
        location: provider.address,
        description: `Booking ID: ${newBooking.id}\nService: ${data.serviceType}`,
      });

      if (calendarEventId) {
        // Update booking with calendar event ID
        await db
          .update(bookings)
          .set({ calendarEventId, updatedAt: new Date() })
          .where(eq(bookings.id, newBooking.id));

        logger.info('Calendar event created for booking', {
          bookingId: newBooking.id,
          calendarEventId,
        });
      }
    }
  } catch (calendarError) {
    // Log but don't fail the booking if calendar event creation fails
    logger.warn('Failed to create calendar event', {
      bookingId: newBooking.id,
      error: String(calendarError),
    });
  }

  const booking: Booking = {
    id: newBooking.id,
    userId: data.userId,
    providerId: data.providerId,
    serviceType: data.serviceType,
    scheduledAt: data.scheduledAt,
    duration: data.duration,
    status: 'confirmed',
    idempotencyKey,
    calendarEventId,
    createdAt: now,
    updatedAt: now,
  };

  logger.info('Booking created successfully', {
    bookingId: booking.id,
    providerId: data.providerId,
    scheduledAt: data.scheduledAt.toISOString(),
    calendarEventId,
  });

  return { booking, created: true };
}

/**
 * Get a booking by ID
 */
export async function getBookingById(id: string): Promise<Booking | null> {
  if (!id || !id.trim()) {
    return null;
  }

  logger.debug('Getting booking by ID', { id });

  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);

  if (result.length === 0) {
    logger.debug('Booking not found', { id });
    return null;
  }

  return result[0];
}

/**
 * Cancel a booking by setting its status to cancelled.
 *
 * Returns the updated booking, or null if no booking with the given ID exists.
 */
export async function cancelBooking(id: string): Promise<Booking | null> {
  logger.debug('Cancelling booking', { id });

  const booking = await getBookingById(id);
  if (!booking) {
    return null;
  }

  const now = new Date();

  await db
    .update(bookings)
    .set({ status: 'cancelled', updatedAt: now })
    .where(eq(bookings.id, id));

  logger.info('Booking cancelled', { bookingId: id });

  return {
    ...booking,
    status: 'cancelled',
    updatedAt: now,
  };
}

/**
 * Get all bookings for a user, ordered by scheduledAt descending
 */
export async function getBookingsByUser(userId: string): Promise<Booking[]> {
  if (!userId || !userId.trim()) {
    return [];
  }

  logger.debug('Getting bookings for user', { userId });

  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.scheduledAt));

  logger.info('Found bookings for user', { userId, count: result.length });

  return result;
}
