import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUserLocation,
  setLocationMemory,
  deleteLocationMemory,
} from '../../src/services/memory-service';

describe('memory-service', () => {
  const testUserId = `test-user-${Date.now()}`;

  beforeEach(async () => {
    // Clean up any existing memories for test user
    await deleteLocationMemory(testUserId);
  });

  describe('getUserLocation', () => {
    it('should return null when no location is set', async () => {
      const location = await getUserLocation(testUserId);
      expect(location).toBeNull();
    });

    it('should return null for empty user ID', async () => {
      const location = await getUserLocation('');
      expect(location).toBeNull();
    });

    it('should return null for whitespace user ID', async () => {
      const location = await getUserLocation('   ');
      expect(location).toBeNull();
    });

    it('should return location after it is set', async () => {
      await setLocationMemory(testUserId, 'seattle');
      const location = await getUserLocation(testUserId);
      expect(location).toBe('seattle');
    });
  });

  describe('setLocationMemory', () => {
    it('should create a new memory', async () => {
      const memory = await setLocationMemory(testUserId, 'san_francisco');

      expect(memory).toBeDefined();
      expect(memory.userId).toBe(testUserId);
      expect(memory.type).toBe('location');
      expect(memory.value).toEqual({ location: 'san_francisco' });
    });

    it('should update existing memory', async () => {
      await setLocationMemory(testUserId, 'seattle');
      const updated = await setLocationMemory(testUserId, 'toronto');

      expect(updated.value).toEqual({ location: 'toronto' });

      const location = await getUserLocation(testUserId);
      expect(location).toBe('toronto');
    });

    it('should throw error for empty user ID', async () => {
      await expect(setLocationMemory('', 'seattle')).rejects.toThrow('User ID is required');
    });

    it('should throw error for whitespace user ID', async () => {
      await expect(setLocationMemory('   ', 'seattle')).rejects.toThrow('User ID is required');
    });

    it('should store all valid locations', async () => {
      const locations = [
        'seattle',
        'san_francisco',
        'south_bay',
        'princeton',
        'vancouver',
        'toronto',
        'new_york',
      ] as const;

      for (const loc of locations) {
        await setLocationMemory(testUserId, loc);
        const retrieved = await getUserLocation(testUserId);
        expect(retrieved).toBe(loc);
      }
    });
  });

  describe('deleteLocationMemory', () => {
    it('should delete existing memory', async () => {
      await setLocationMemory(testUserId, 'seattle');
      const deleted = await deleteLocationMemory(testUserId);

      expect(deleted).toBe(true);

      const location = await getUserLocation(testUserId);
      expect(location).toBeNull();
    });

    it('should return false when no memory exists', async () => {
      const deleted = await deleteLocationMemory(testUserId);
      expect(deleted).toBe(false);
    });

    it('should return false for empty user ID', async () => {
      const deleted = await deleteLocationMemory('');
      expect(deleted).toBe(false);
    });

    it('should return false for whitespace user ID', async () => {
      const deleted = await deleteLocationMemory('   ');
      expect(deleted).toBe(false);
    });
  });
});
