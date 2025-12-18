import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { createApp } from '../../src/app';
import { rawDb } from '../../src/db';
import type { Express } from 'express';

let app: Express;

// Helper to insert test providers directly into database
function insertTestProvider(workingHours?: Record<string, { open: string; close: string }>) {
  const now = Math.floor(Date.now() / 1000);
  const id = uuidv4();
  const defaultWorkingHours = workingHours || {
    monday: { open: '09:00', close: '17:00' },
    tuesday: { open: '09:00', close: '17:00' },
  };

  rawDb.exec(`
    INSERT INTO providers (id, name, category, description, address, latitude, longitude, rating, review_count, working_hours, services, created_at, updated_at)
    VALUES (
      '${id}',
      'Test Provider',
      'salon',
      'A test provider',
      '123 Test St',
      40.7128,
      -74.006,
      4.5,
      0,
      '${JSON.stringify(defaultWorkingHours)}',
      '${JSON.stringify(['haircut', 'styling'])}',
      ${now},
      ${now}
    )
  `);

  return id;
}

describe('Availability API Integration Tests', () => {
  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    rawDb.exec('DELETE FROM providers');
  });

  it('should return slots for valid provider and 404 for non-existent', async () => {
    const providerId = insertTestProvider();

    // Test valid provider
    const validResponse = await request(app)
      .get(`/api/providers/${providerId}/availability`)
      .query({ date: '2025-06-16', duration: 30 });

    expect(validResponse.status).toBe(200);
    expect(validResponse.body.success).toBe(true);
    expect(validResponse.body.data.slots.length).toBe(16); // 9am-5pm, 30-min slots

    // Test non-existent provider
    const invalidResponse = await request(app)
      .get(`/api/providers/${uuidv4()}/availability`)
      .query({ date: '2025-06-16', duration: 30 });

    expect(invalidResponse.status).toBe(404);
    expect(invalidResponse.body.error.code).toBe('NOT_FOUND');
  });

  it('should validate input parameters', async () => {
    const providerId = insertTestProvider();

    // Invalid date format
    const dateResponse = await request(app)
      .get(`/api/providers/${providerId}/availability`)
      .query({ date: 'invalid-date', duration: 30 });

    expect(dateResponse.status).toBe(400);
    expect(dateResponse.body.error.code).toBe('VALIDATION_ERROR');

    // Duration out of range
    const durationResponse = await request(app)
      .get(`/api/providers/${providerId}/availability`)
      .query({ date: '2025-06-16', duration: 1000 });

    expect(durationResponse.status).toBe(400);
    expect(durationResponse.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return empty slots for closed day', async () => {
    const providerId = insertTestProvider({
      monday: { open: '09:00', close: '17:00' },
      // Tuesday closed
    });

    // 2025-06-17 is a Tuesday
    const response = await request(app)
      .get(`/api/providers/${providerId}/availability`)
      .query({ date: '2025-06-17', duration: 30 });

    expect(response.status).toBe(200);
    expect(response.body.data.slots).toEqual([]);
  });

  it('should return consistent patterns for same provider+date', async () => {
    const providerId = insertTestProvider();

    const response1 = await request(app)
      .get(`/api/providers/${providerId}/availability`)
      .query({ date: '2025-06-16', duration: 30 });

    const response2 = await request(app)
      .get(`/api/providers/${providerId}/availability`)
      .query({ date: '2025-06-16', duration: 30 });

    expect(response1.body.data.slots).toEqual(response2.body.data.slots);
  });
});
