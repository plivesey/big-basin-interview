import { describe, it, expect } from 'vitest';
import {
  hashProviderDate,
  fetchProviderAvailability,
  reconcileAvailability,
} from '../../src/utils/provider-availability';
import type { TimeSlot } from '../../src/services/availability-service';

describe('Provider Availability', () => {
  // Helper to create test slots
  function createTestSlots(count: number): TimeSlot[] {
    return Array.from({ length: count }, (_, i) => ({
      start: `2025-06-15T${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}:00`,
      end: `2025-06-15T${String(9 + Math.floor((i + 1) / 2)).padStart(2, '0')}:${(i + 1) % 2 === 0 ? '00' : '30'}:00`,
      available: true,
    }));
  }

  describe('hashProviderDate', () => {
    it('should produce consistent hash for same inputs (determinism)', () => {
      const hash1 = hashProviderDate('provider-123', '2025-06-15');
      const hash2 = hashProviderDate('provider-123', '2025-06-15');
      const hash3 = hashProviderDate('provider-123', '2025-06-15');

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });

    it('should produce different hash for different provider IDs', () => {
      const hash1 = hashProviderDate('provider-aaa', '2025-06-15');
      const hash2 = hashProviderDate('provider-bbb', '2025-06-15');
      const hash3 = hashProviderDate('provider-ccc', '2025-06-15');

      expect(hash1).not.toBe(hash2);
      expect(hash2).not.toBe(hash3);
      expect(hash1).not.toBe(hash3);
    });

    it('should produce different hash for different dates', () => {
      const hash1 = hashProviderDate('provider-123', '2025-01-01');
      const hash2 = hashProviderDate('provider-123', '2025-06-15');
      const hash3 = hashProviderDate('provider-123', '2025-12-31');

      expect(hash1).not.toBe(hash2);
      expect(hash2).not.toBe(hash3);
      expect(hash1).not.toBe(hash3);
    });

    it('should return a non-negative number', () => {
      const testCases = [
        ['provider-1', '2025-01-01'],
        ['', ''],
        ['a-very-long-provider-id-string', '2099-12-31'],
      ];

      for (const [providerId, date] of testCases) {
        const hash = hashProviderDate(providerId, date);
        expect(hash).toBeGreaterThanOrEqual(0);
        expect(hash).toBeLessThan(1000000);
      }
    });
  });

  describe('fetchProviderAvailability', () => {
    it('should return value 0-3 for any input', () => {
      const testCases = [
        ['provider-1', '2025-06-15'],
        ['provider-2', '2025-06-16'],
        ['provider-xyz', '2025-12-31'],
        ['a', '2025-01-01'],
      ];

      for (const [providerId, date] of testCases) {
        const level = fetchProviderAvailability(providerId, date);
        expect(level).toBeGreaterThanOrEqual(0);
        expect(level).toBeLessThanOrEqual(3);
        expect([0, 1, 2, 3]).toContain(level);
      }
    });

    it('should be deterministic (same input = same output)', () => {
      const level1 = fetchProviderAvailability('test-provider', '2025-06-15');
      const level2 = fetchProviderAvailability('test-provider', '2025-06-15');
      const level3 = fetchProviderAvailability('test-provider', '2025-06-15');

      expect(level1).toBe(level2);
      expect(level2).toBe(level3);
    });

    it('should vary by provider ID', () => {
      // Test multiple providers - at least some should have different levels
      const levels = new Set<number>();
      for (let i = 0; i < 20; i++) {
        levels.add(fetchProviderAvailability(`provider-${i}`, '2025-06-15'));
      }

      // Should have at least 2 different levels across 20 providers
      expect(levels.size).toBeGreaterThan(1);
    });

    it('should vary by date', () => {
      // Test multiple dates - at least some should have different levels
      const levels = new Set<number>();
      for (let day = 1; day <= 20; day++) {
        const date = `2025-06-${String(day).padStart(2, '0')}`;
        levels.add(fetchProviderAvailability('test-provider', date));
      }

      // Should have at least 2 different levels across 20 dates
      expect(levels.size).toBeGreaterThan(1);
    });
  });

  describe('reconcileAvailability', () => {
    it('should return slots unchanged for level 0 (fully available)', () => {
      const slots = createTestSlots(10);
      const result = reconcileAvailability(slots, 0, 'provider-1', '2025-06-15');

      expect(result).toHaveLength(10);
      expect(result.every((slot) => slot.available === true)).toBe(true);
    });

    it('should mark 2-3 slots unavailable for level 1 (light busy)', () => {
      const slots = createTestSlots(10);
      const result = reconcileAvailability(slots, 1, 'provider-1', '2025-06-15');

      const unavailableCount = result.filter((slot) => !slot.available).length;

      expect(unavailableCount).toBeGreaterThanOrEqual(2);
      expect(unavailableCount).toBeLessThanOrEqual(3);
    });

    it('should mark ~50% slots unavailable for level 2 (moderate busy)', () => {
      const slots = createTestSlots(10);
      const result = reconcileAvailability(slots, 2, 'provider-1', '2025-06-15');

      const unavailableCount = result.filter((slot) => !slot.available).length;

      // 50% of 10 = 5
      expect(unavailableCount).toBe(5);
    });

    it('should mark all but 2-3 slots unavailable for level 3 (heavy busy)', () => {
      const slots = createTestSlots(10);
      const result = reconcileAvailability(slots, 3, 'provider-1', '2025-06-15');

      const availableCount = result.filter((slot) => slot.available).length;

      expect(availableCount).toBeGreaterThanOrEqual(2);
      expect(availableCount).toBeLessThanOrEqual(3);
    });

    it('should handle empty slot arrays gracefully', () => {
      const result0 = reconcileAvailability([], 0, 'provider-1', '2025-06-15');
      const result1 = reconcileAvailability([], 1, 'provider-1', '2025-06-15');
      const result2 = reconcileAvailability([], 2, 'provider-1', '2025-06-15');
      const result3 = reconcileAvailability([], 3, 'provider-1', '2025-06-15');

      expect(result0).toEqual([]);
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(result3).toEqual([]);
    });

    it('should preserve slot properties other than available', () => {
      const slots: TimeSlot[] = [
        { start: '2025-06-15T09:00:00', end: '2025-06-15T09:30:00', available: true },
        { start: '2025-06-15T09:30:00', end: '2025-06-15T10:00:00', available: true },
      ];

      const result = reconcileAvailability(slots, 1, 'provider-1', '2025-06-15');

      expect(result[0].start).toBe('2025-06-15T09:00:00');
      expect(result[0].end).toBe('2025-06-15T09:30:00');
      expect(result[1].start).toBe('2025-06-15T09:30:00');
      expect(result[1].end).toBe('2025-06-15T10:00:00');
    });

    it('should be deterministic (same inputs = same output)', () => {
      const slots = createTestSlots(10);

      const result1 = reconcileAvailability(slots, 2, 'provider-1', '2025-06-15');
      const result2 = reconcileAvailability(slots, 2, 'provider-1', '2025-06-15');

      expect(result1).toEqual(result2);
    });

    it('should produce different patterns for different providers', () => {
      const slots = createTestSlots(10);

      const result1 = reconcileAvailability(slots, 2, 'provider-aaa', '2025-06-15');
      const result2 = reconcileAvailability(slots, 2, 'provider-bbb', '2025-06-15');

      // Get indices of unavailable slots
      const unavailable1 = result1.map((s, i) => (s.available ? -1 : i)).filter((i) => i >= 0);
      const unavailable2 = result2.map((s, i) => (s.available ? -1 : i)).filter((i) => i >= 0);

      // They should have different unavailable indices (with very high probability)
      expect(unavailable1.join(',')).not.toBe(unavailable2.join(','));
    });

    it('should handle very few slots gracefully', () => {
      const slots = createTestSlots(2);

      // Level 3 should still work with only 2 slots
      const result = reconcileAvailability(slots, 3, 'provider-1', '2025-06-15');

      expect(result).toHaveLength(2);
      // At least some should be available (2-3, but only 2 slots exist)
      const availableCount = result.filter((s) => s.available).length;
      expect(availableCount).toBeGreaterThanOrEqual(1);
    });

    describe('termination guarantees (no infinite loops)', () => {
      // This test specifically guards against the LCG cycle bug where
      // certain hash/totalSlots combinations could cause infinite loops

      it('should always terminate for power-of-2 slot counts (1-64)', () => {
        const powerOf2Counts = [1, 2, 4, 8, 16, 32, 64];

        for (const slotCount of powerOf2Counts) {
          const slots = createTestSlots(slotCount);

          // Test multiple busy levels
          for (const level of [0, 1, 2, 3] as const) {
            // Test many different providers to get varied hashes
            for (let p = 0; p < 50; p++) {
              const result = reconcileAvailability(
                slots,
                level,
                `provider-pow2-${slotCount}-${p}`,
                '2025-06-15'
              );
              expect(result).toHaveLength(slotCount);
            }
          }
        }
      });

      it('should always terminate for slot count 16 with many hash variations', () => {
        // 16 slots was the problematic case - the LCG with modulo 16 could cycle
        const slots = createTestSlots(16);

        // Test 200 different providers/dates to cover many hash values
        for (let i = 0; i < 200; i++) {
          for (const level of [1, 2, 3] as const) {
            const result = reconcileAvailability(
              slots,
              level,
              `test-provider-${i}`,
              `2025-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`
            );
            expect(result).toHaveLength(16);
          }
        }
      });

      it('should always terminate for various slot counts (1-100)', () => {
        for (let slotCount = 1; slotCount <= 100; slotCount++) {
          const slots = createTestSlots(slotCount);

          for (const level of [1, 2, 3] as const) {
            const result = reconcileAvailability(
              slots,
              level,
              `provider-count-${slotCount}`,
              '2025-06-15'
            );
            expect(result).toHaveLength(slotCount);
          }
        }
      });

      it('should always terminate with edge case hashes (0, 1, max values)', () => {
        const slots = createTestSlots(16);

        // These provider IDs will produce specific hash values
        const edgeCaseProviders = [
          '', // Empty string
          'a', // Single char
          '0', // Zero-like
          '1', // One-like
          'provider-with-very-long-name-that-produces-large-hash',
          'zzzzzzzzzzzzzzzzzzzzz', // High char values
          '00000000000000000000', // All zeros
        ];

        for (const provider of edgeCaseProviders) {
          for (const level of [1, 2, 3] as const) {
            const result = reconcileAvailability(slots, level, provider, '2025-06-15');
            expect(result).toHaveLength(16);
          }
        }
      });

      it('should complete within reasonable time for all busy levels', () => {
        const slots = createTestSlots(32);
        const startTime = Date.now();

        // Run 1000 iterations - should complete in < 1 second
        for (let i = 0; i < 1000; i++) {
          for (const level of [0, 1, 2, 3] as const) {
            reconcileAvailability(slots, level, `perf-test-${i}`, '2025-06-15');
          }
        }

        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeLessThan(5000); // Should complete well under 5 seconds
      });
    });
  });
});
