import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import type { Express } from 'express';

describe('Observability Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  describe('Request ID Header', () => {
    it('should return X-Request-ID header in response', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
    });

    it('should generate a UUID-format request ID', async () => {
      const response = await request(app).get('/api/health');

      const requestId = response.headers['x-request-id'];
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(requestId).toMatch(uuidRegex);
    });

    it('should use provided X-Request-ID header if present', async () => {
      const customRequestId = 'custom-request-id-123';

      const response = await request(app)
        .get('/api/health')
        .set('X-Request-ID', customRequestId);

      expect(response.headers['x-request-id']).toBe(customRequestId);
    });

    it('should generate unique request IDs for each request', async () => {
      const response1 = await request(app).get('/api/health');
      const response2 = await request(app).get('/api/health');

      expect(response1.headers['x-request-id']).not.toBe(response2.headers['x-request-id']);
    });
  });

  describe('Error Response Format', () => {
    it('should include error code in validation error response', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send({}); // Empty body should cause validation error

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should include request ID in validation error response', async () => {
      const customRequestId = 'validation-error-test';

      const response = await request(app)
        .post('/api/bookings')
        .set('X-Request-ID', customRequestId)
        .send({}); // Empty body should cause validation error

      expect(response.status).toBe(400);
      expect(response.body.error.requestId).toBe(customRequestId);
    });

    it('should include error code in provider ID validation error', async () => {
      // Invalid UUID format should trigger validation error
      const response = await request(app).get('/api/providers/invalid-id-format');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Request ID Propagation', () => {
    it('should propagate request ID through the request lifecycle', async () => {
      const customRequestId = 'propagation-test-123';

      // Make a request to health endpoint
      const response = await request(app)
        .get('/api/health')
        .set('X-Request-ID', customRequestId);

      // The request ID should be in the response
      expect(response.headers['x-request-id']).toBe(customRequestId);
    });

    it('should propagate request ID through error handling', async () => {
      const customRequestId = 'error-propagation-test';

      // Make a request that triggers validation error
      const response = await request(app)
        .post('/api/bookings')
        .set('X-Request-ID', customRequestId)
        .send({});

      expect(response.headers['x-request-id']).toBe(customRequestId);
      expect(response.body.error.requestId).toBe(customRequestId);
    });
  });

  describe('Health and Status', () => {
    it('should return request ID on health endpoint', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['x-request-id']).toBeDefined();
    });
  });
});
