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
  description: string;
  address: string;
  rating: number;
  services: string[];
}> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const provider = {
    id: overrides.id || uuidv4(),
    name: overrides.name || 'Test Provider',
    category: overrides.category || 'salon',
    description: overrides.description || 'A test provider',
    address: overrides.address || '123 Test St',
    latitude: 40.7128,
    longitude: -74.006,
    rating: overrides.rating ?? 4.5,
    services: overrides.services || ['haircut', 'styling'],
  };

  rawDb.exec(`
    INSERT INTO providers (id, name, category, description, address, geo, latitude, longitude, rating, review_count, working_hours, services, created_at, updated_at)
    VALUES (
      '${provider.id}',
      '${provider.name}',
      '${provider.category}',
      '${provider.description}',
      '${provider.address}',
      'seattle',
      ${provider.latitude},
      ${provider.longitude},
      ${provider.rating},
      0,
      '${JSON.stringify({ monday: { open: '09:00', close: '17:00' } })}',
      '${JSON.stringify(provider.services)}',
      ${now},
      ${now}
    )
  `);

  return provider;
}

describe('Provider API Integration Tests', () => {
  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    // Clear providers table before each test
    rawDb.exec('DELETE FROM providers');
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('GET /api/providers', () => {
    it('should return all providers when no query provided', async () => {
      insertTestProvider({ name: 'Provider A', rating: 4.0 });
      insertTestProvider({ name: 'Provider B', rating: 4.5 });

      const response = await request(app).get('/api/providers');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.providers).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should return providers ordered by rating descending', async () => {
      insertTestProvider({ name: 'Low Rating', rating: 3.0 });
      insertTestProvider({ name: 'High Rating', rating: 5.0 });
      insertTestProvider({ name: 'Mid Rating', rating: 4.0 });

      const response = await request(app).get('/api/providers');

      expect(response.status).toBe(200);
      expect(response.body.data.providers[0].name).toBe('High Rating');
      expect(response.body.data.providers[1].name).toBe('Mid Rating');
      expect(response.body.data.providers[2].name).toBe('Low Rating');
    });

    it('should filter providers by category search', async () => {
      insertTestProvider({ name: 'Salon A', category: 'salon' });
      insertTestProvider({ name: 'Mechanic A', category: 'mechanic' });

      const response = await request(app).get('/api/providers?q=salon');

      expect(response.status).toBe(200);
      expect(response.body.data.providers).toHaveLength(1);
      expect(response.body.data.providers[0].name).toBe('Salon A');
    });

    it('should filter providers by service search', async () => {
      insertTestProvider({ name: 'Salon A', services: ['haircut', 'coloring'] });
      insertTestProvider({ name: 'Salon B', services: ['manicure', 'pedicure'] });

      const response = await request(app).get('/api/providers?q=haircut');

      expect(response.status).toBe(200);
      expect(response.body.data.providers).toHaveLength(1);
      expect(response.body.data.providers[0].name).toBe('Salon A');
    });

    it('should filter providers by description search', async () => {
      insertTestProvider({
        name: 'Premium Salon',
        description: 'A luxury hair experience',
      });
      insertTestProvider({
        name: 'Budget Salon',
        description: 'Affordable haircuts',
      });

      const response = await request(app).get('/api/providers?q=luxury');

      expect(response.status).toBe(200);
      expect(response.body.data.providers).toHaveLength(1);
      expect(response.body.data.providers[0].name).toBe('Premium Salon');
    });

    it('should return empty array when no matches found', async () => {
      insertTestProvider({ name: 'Salon A', category: 'salon' });

      const response = await request(app).get('/api/providers?q=nonexistent');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.providers).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });

    it('should perform case-insensitive search', async () => {
      insertTestProvider({ name: 'Salon A', category: 'Salon' });

      const responseLower = await request(app).get('/api/providers?q=salon');
      const responseUpper = await request(app).get('/api/providers?q=SALON');

      expect(responseLower.body.data.providers).toHaveLength(1);
      expect(responseUpper.body.data.providers).toHaveLength(1);
    });
  });

  describe('GET /api/providers/:id', () => {
    it('should return provider when found', async () => {
      const provider = insertTestProvider({
        name: 'Specific Salon',
        category: 'salon',
      });

      const response = await request(app).get(`/api/providers/${provider.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.provider.id).toBe(provider.id);
      expect(response.body.data.provider.name).toBe('Specific Salon');
    });

    it('should return 404 when provider not found', async () => {
      const nonExistentId = uuidv4();

      const response = await request(app).get(`/api/providers/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('not found');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).get('/api/providers/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error Handling', () => {
    it('should return proper error format for validation errors', async () => {
      const response = await request(app).get('/api/providers/not-a-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error).toHaveProperty('message');
    });
  });
});
