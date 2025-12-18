import { describe, it, expect, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import {
  searchProviders,
  getProviderById,
  getAllProviders,
  getProvidersByIds,
} from '../../src/services/provider-service';
import { rawDb } from '../../src/db';

// Helper to insert test providers
function insertTestProvider(overrides: Partial<{
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  geo: string;
  latitude: number;
  longitude: number;
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
    geo: overrides.geo || 'seattle',
    latitude: overrides.latitude || 40.7128,
    longitude: overrides.longitude || -74.006,
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
      '${provider.geo}',
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

describe('provider-service', () => {
  beforeEach(() => {
    // Clear providers table before each test
    rawDb.exec('DELETE FROM providers');
  });

  describe('searchProviders', () => {
    it('should return all providers when no query provided', async () => {
      insertTestProvider({ name: 'Provider A', rating: 4.0 });
      insertTestProvider({ name: 'Provider B', rating: 4.5 });

      const results = await searchProviders();

      expect(results).toHaveLength(2);
    });

    it('should return all providers when empty query provided', async () => {
      insertTestProvider({ name: 'Provider A' });
      insertTestProvider({ name: 'Provider B' });

      const results = await searchProviders('');
      expect(results).toHaveLength(2);

      const resultsWithSpaces = await searchProviders('   ');
      expect(resultsWithSpaces).toHaveLength(2);
    });

    it('should order results by rating descending', async () => {
      insertTestProvider({ name: 'Low Rating', rating: 3.0 });
      insertTestProvider({ name: 'High Rating', rating: 5.0 });
      insertTestProvider({ name: 'Mid Rating', rating: 4.0 });

      const results = await searchProviders();

      expect(results[0].name).toBe('High Rating');
      expect(results[1].name).toBe('Mid Rating');
      expect(results[2].name).toBe('Low Rating');
    });

    it('should find providers by category', async () => {
      insertTestProvider({ name: 'Salon A', category: 'salon' });
      insertTestProvider({ name: 'Mechanic A', category: 'mechanic' });
      insertTestProvider({ name: 'Dentist A', category: 'dentist' });

      const results = await searchProviders('salon');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Salon A');
    });

    it('should find providers by category case-insensitively', async () => {
      insertTestProvider({ name: 'Salon A', category: 'Salon' });

      const resultsLower = await searchProviders('salon');
      const resultsUpper = await searchProviders('SALON');
      const resultsMixed = await searchProviders('SaLoN');

      expect(resultsLower).toHaveLength(1);
      expect(resultsUpper).toHaveLength(1);
      expect(resultsMixed).toHaveLength(1);
    });

    it('should find providers by description', async () => {
      insertTestProvider({
        name: 'Premium Salon',
        category: 'salon',
        description: 'A luxury hair experience',
      });
      insertTestProvider({
        name: 'Budget Salon',
        category: 'salon',
        description: 'Affordable haircuts for everyone',
      });

      const results = await searchProviders('luxury');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Premium Salon');
    });

    it('should find providers by service in JSON array', async () => {
      insertTestProvider({
        name: 'Salon A',
        services: ['haircut', 'coloring', 'styling'],
      });
      insertTestProvider({
        name: 'Salon B',
        services: ['manicure', 'pedicure'],
      });

      const results = await searchProviders('haircut');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Salon A');
    });

    it('should find providers by partial service match', async () => {
      insertTestProvider({
        name: 'Mechanic A',
        category: 'mechanic',
        services: ['oil change', 'brake repair', 'tire rotation'],
      });

      const results = await searchProviders('oil');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Mechanic A');
    });

    it('should return empty array when no matches found', async () => {
      insertTestProvider({ name: 'Salon A', category: 'salon' });

      const results = await searchProviders('nonexistent');

      expect(results).toHaveLength(0);
    });

    it('should find providers matching multiple criteria', async () => {
      insertTestProvider({
        name: 'Great Salon',
        category: 'salon',
        description: 'Best in town',
        services: ['haircut'],
      });

      // All these should find the same provider
      const byCategory = await searchProviders('salon');
      const byDescription = await searchProviders('best');
      const byService = await searchProviders('haircut');

      expect(byCategory).toHaveLength(1);
      expect(byDescription).toHaveLength(1);
      expect(byService).toHaveLength(1);
    });

    it('should trim whitespace from query', async () => {
      insertTestProvider({ name: 'Salon A', category: 'salon' });

      const results = await searchProviders('  salon  ');

      expect(results).toHaveLength(1);
    });

    it('should filter by geo when provided', async () => {
      insertTestProvider({ name: 'Seattle Salon', category: 'salon', geo: 'seattle' });
      insertTestProvider({ name: 'SF Salon', category: 'salon', geo: 'san_francisco' });
      insertTestProvider({ name: 'NYC Salon', category: 'salon', geo: 'new_york' });

      const seattleResults = await searchProviders(undefined, 'seattle');
      expect(seattleResults).toHaveLength(1);
      expect(seattleResults[0].name).toBe('Seattle Salon');

      const sfResults = await searchProviders(undefined, 'san_francisco');
      expect(sfResults).toHaveLength(1);
      expect(sfResults[0].name).toBe('SF Salon');
    });

    it('should combine query and geo filter', async () => {
      insertTestProvider({ name: 'Seattle Salon', category: 'salon', geo: 'seattle' });
      insertTestProvider({ name: 'Seattle Mechanic', category: 'mechanic', geo: 'seattle' });
      insertTestProvider({ name: 'NYC Salon', category: 'salon', geo: 'new_york' });

      const results = await searchProviders('salon', 'seattle');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Seattle Salon');
    });

    it('should return empty when geo has no providers', async () => {
      insertTestProvider({ name: 'Seattle Salon', category: 'salon', geo: 'seattle' });

      const results = await searchProviders(undefined, 'vancouver');

      expect(results).toHaveLength(0);
    });

    it('should return empty when query matches but geo does not', async () => {
      insertTestProvider({ name: 'Seattle Salon', category: 'salon', geo: 'seattle' });

      const results = await searchProviders('salon', 'vancouver');

      expect(results).toHaveLength(0);
    });

    it('should return all matching geos when no geo filter provided', async () => {
      insertTestProvider({ name: 'Seattle Salon', category: 'salon', geo: 'seattle' });
      insertTestProvider({ name: 'NYC Salon', category: 'salon', geo: 'new_york' });

      const results = await searchProviders('salon');

      expect(results).toHaveLength(2);
    });
  });

  describe('getProviderById', () => {
    it('should return provider when found', async () => {
      const inserted = insertTestProvider({
        name: 'Specific Salon',
        category: 'salon',
      });

      const provider = await getProviderById(inserted.id);

      expect(provider).not.toBeNull();
      expect(provider?.id).toBe(inserted.id);
      expect(provider?.name).toBe('Specific Salon');
    });

    it('should return null when provider not found', async () => {
      const provider = await getProviderById(uuidv4());

      expect(provider).toBeNull();
    });

    it('should return null for empty ID', async () => {
      const provider = await getProviderById('');

      expect(provider).toBeNull();
    });

    it('should return null for whitespace-only ID', async () => {
      const provider = await getProviderById('   ');

      expect(provider).toBeNull();
    });
  });

  describe('getAllProviders', () => {
    it('should return all providers', async () => {
      insertTestProvider({ name: 'Provider A' });
      insertTestProvider({ name: 'Provider B' });
      insertTestProvider({ name: 'Provider C' });

      const results = await getAllProviders();

      expect(results).toHaveLength(3);
    });

    it('should return empty array when no providers exist', async () => {
      const results = await getAllProviders();

      expect(results).toHaveLength(0);
    });

    it('should order providers by rating descending', async () => {
      insertTestProvider({ name: 'Low', rating: 2.0 });
      insertTestProvider({ name: 'High', rating: 5.0 });

      const results = await getAllProviders();

      expect(results[0].name).toBe('High');
      expect(results[1].name).toBe('Low');
    });
  });

  describe('getProvidersByIds', () => {
    it('should return providers in order of input IDs', async () => {
      const provider1 = insertTestProvider({ name: 'Provider A', rating: 3.0 });
      const provider2 = insertTestProvider({ name: 'Provider B', rating: 5.0 });
      const provider3 = insertTestProvider({ name: 'Provider C', rating: 4.0 });

      // Request in specific order (not rating order)
      const results = await getProvidersByIds([provider3.id, provider1.id, provider2.id]);

      expect(results).toHaveLength(3);
      expect(results[0].id).toBe(provider3.id);
      expect(results[1].id).toBe(provider1.id);
      expect(results[2].id).toBe(provider2.id);
    });

    it('should return empty array for empty input', async () => {
      insertTestProvider({ name: 'Provider A' });

      const results = await getProvidersByIds([]);

      expect(results).toHaveLength(0);
    });

    it('should return only found providers and skip missing IDs', async () => {
      const provider1 = insertTestProvider({ name: 'Provider A' });
      const provider2 = insertTestProvider({ name: 'Provider B' });

      const results = await getProvidersByIds([provider1.id, 'non-existent-id', provider2.id]);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe(provider1.id);
      expect(results[1].id).toBe(provider2.id);
    });

    it('should return empty array when all IDs are not found', async () => {
      insertTestProvider({ name: 'Provider A' });

      const results = await getProvidersByIds(['fake-id-1', 'fake-id-2']);

      expect(results).toHaveLength(0);
    });

    it('should handle single ID', async () => {
      const provider = insertTestProvider({ name: 'Single Provider' });

      const results = await getProvidersByIds([provider.id]);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Single Provider');
    });

    it('should handle duplicate IDs in input', async () => {
      const provider = insertTestProvider({ name: 'Provider A' });

      const results = await getProvidersByIds([provider.id, provider.id, provider.id]);

      // Each ID in input should map to a result
      expect(results).toHaveLength(3);
      expect(results[0].id).toBe(provider.id);
      expect(results[1].id).toBe(provider.id);
      expect(results[2].id).toBe(provider.id);
    });
  });
});
