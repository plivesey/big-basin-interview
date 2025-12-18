import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { createApp } from '../../src/app';
import { rawDb, closeDatabase } from '../../src/db';
import type { Express } from 'express';

let app: Express;

// Helper to insert test providers directly into database
function insertTestProvider(overrides: Partial<{
  id: string;
  name: string;
  category: string;
}> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const provider = {
    id: overrides.id || uuidv4(),
    name: overrides.name || 'Test Provider',
    category: overrides.category || 'salon',
  };

  rawDb.exec(`
    INSERT INTO providers (id, name, category, description, address, latitude, longitude, rating, review_count, working_hours, services, created_at, updated_at)
    VALUES (
      '${provider.id}',
      '${provider.name}',
      '${provider.category}',
      'A test provider',
      '123 Test St',
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

  return provider;
}

// Helper to insert test booking directly
function insertTestBooking(overrides: Partial<{
  id: string;
  userId: string;
  providerId: string;
  serviceType: string;
  scheduledAt: Date;
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
      60,
      '${booking.status}',
      '${booking.idempotencyKey}',
      ${now},
      ${now}
    )
  `);

  return booking;
}

// Helper to insert test session directly
function insertTestSession(id?: string) {
  const sessionId = id || uuidv4();
  const now = Math.floor(Date.now() / 1000);

  rawDb.exec(`
    INSERT INTO sessions (id, user_id, created_at, last_activity_at)
    VALUES (
      '${sessionId}',
      'default_user',
      ${now},
      ${now}
    )
  `);

  return sessionId;
}

// Helper to insert test workflow directly
function insertTestWorkflow(sessionId: string, overrides: Partial<{
  id: string;
  currentState: string;
}> = {}) {
  const workflowId = overrides.id || uuidv4();
  const now = Math.floor(Date.now() / 1000);

  rawDb.exec(`
    INSERT INTO workflow_states (id, session_id, current_state, context, created_at, last_updated)
    VALUES (
      '${workflowId}',
      '${sessionId}',
      '${overrides.currentState || 'TIME_SELECTION'}',
      '${JSON.stringify({ serviceType: 'salon' })}',
      ${now},
      ${now}
    )
  `);

  return workflowId;
}

describe('Booking API Integration Tests', () => {
  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    // Clear tables before each test (order matters due to foreign keys)
    rawDb.exec('DELETE FROM bookings');
    rawDb.exec('DELETE FROM workflow_states');
    rawDb.exec('DELETE FROM providers');
    rawDb.exec('DELETE FROM sessions');
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('GET /api/bookings', () => {
    it('should return bookings for userId', async () => {
      const provider = insertTestProvider();
      insertTestBooking({ providerId: provider.id, userId: 'test_user' });
      insertTestBooking({ providerId: provider.id, userId: 'test_user' });

      const response = await request(app).get('/api/bookings?userId=test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should return empty array when no bookings', async () => {
      const response = await request(app).get('/api/bookings?userId=nonexistent');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });

    it('should return 400 when userId missing', async () => {
      const response = await request(app).get('/api/bookings');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should order by scheduledAt descending', async () => {
      const provider = insertTestProvider();
      insertTestBooking({
        providerId: provider.id,
        userId: 'test_user',
        scheduledAt: new Date('2025-12-20T10:00:00Z'),
        serviceType: 'early',
      });
      insertTestBooking({
        providerId: provider.id,
        userId: 'test_user',
        scheduledAt: new Date('2025-12-25T10:00:00Z'),
        serviceType: 'late',
      });

      const response = await request(app).get('/api/bookings?userId=test_user');

      expect(response.status).toBe(200);
      expect(response.body.data.bookings[0].serviceType).toBe('late');
      expect(response.body.data.bookings[1].serviceType).toBe('early');
    });
  });

  describe('POST /api/bookings', () => {
    it('should create booking and return 201', async () => {
      const provider = insertTestProvider();
      const sessionId = insertTestSession();
      const workflowId = insertTestWorkflow(sessionId);
      const idempotencyKey = uuidv4();

      const response = await request(app)
        .post('/api/bookings')
        .send({
          providerId: provider.id,
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
          duration: 60,
          idempotencyKey,
          workflowId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.providerId).toBe(provider.id);
      expect(response.body.data.booking.serviceType).toBe('haircut');
      expect(response.body.data.booking.status).toBe('confirmed');
      expect(response.body.data.booking.idempotencyKey).toBe(idempotencyKey);
    });

    it('should return existing booking with 200 on duplicate idempotencyKey', async () => {
      const provider = insertTestProvider();
      const sessionId = insertTestSession();
      const workflowId = insertTestWorkflow(sessionId);
      const idempotencyKey = uuidv4();

      // First request - should create
      const response1 = await request(app)
        .post('/api/bookings')
        .send({
          providerId: provider.id,
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
          idempotencyKey,
          workflowId,
        });

      expect(response1.status).toBe(201);
      const bookingId = response1.body.data.booking.id;

      // Second request with same key - should return existing
      const response2 = await request(app)
        .post('/api/bookings')
        .send({
          providerId: provider.id,
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
          idempotencyKey,
          workflowId,
        });

      expect(response2.status).toBe(200);
      expect(response2.body.data.booking.id).toBe(bookingId);
    });

    it('should return 400 for invalid providerId format', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send({
          providerId: 'invalid-uuid',
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
          idempotencyKey: uuidv4(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for non-existent provider', async () => {
      const sessionId = insertTestSession();
      const workflowId = insertTestWorkflow(sessionId);

      const response = await request(app)
        .post('/api/bookings')
        .send({
          providerId: uuidv4(), // Valid UUID but doesn't exist
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
          idempotencyKey: uuidv4(),
          workflowId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PROVIDER');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send({
          // Missing providerId, serviceType, scheduledAt, idempotencyKey
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid datetime format', async () => {
      const provider = insertTestProvider();

      const response = await request(app)
        .post('/api/bookings')
        .send({
          providerId: provider.id,
          serviceType: 'haircut',
          scheduledAt: 'not-a-date',
          idempotencyKey: uuidv4(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should use default duration when not provided', async () => {
      const provider = insertTestProvider();
      const sessionId = insertTestSession();
      const workflowId = insertTestWorkflow(sessionId);

      const response = await request(app)
        .post('/api/bookings')
        .send({
          providerId: provider.id,
          serviceType: 'haircut',
          scheduledAt: '2025-12-20T10:00:00Z',
          idempotencyKey: uuidv4(),
          workflowId,
          // duration not provided
        });

      expect(response.status).toBe(201);
      expect(response.body.data.booking.duration).toBe(60);
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should return booking when found', async () => {
      const provider = insertTestProvider();
      const booking = insertTestBooking({
        providerId: provider.id,
        serviceType: 'styling',
      });

      const response = await request(app).get(`/api/bookings/${booking.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.id).toBe(booking.id);
      expect(response.body.data.booking.serviceType).toBe('styling');
    });

    it('should return 404 when booking not found', async () => {
      const nonExistentId = uuidv4();

      const response = await request(app).get(`/api/bookings/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).get('/api/bookings/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should return session when found', async () => {
      const sessionId = insertTestSession();

      const response = await request(app).get(`/api/sessions/${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.session.id).toBe(sessionId);
      expect(response.body.data.session.userId).toBe('default_user');
    });

    it('should return 404 when session not found', async () => {
      const nonExistentId = uuidv4();

      const response = await request(app).get(`/api/sessions/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).get('/api/sessions/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
