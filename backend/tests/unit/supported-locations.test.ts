import { describe, it, expect } from 'vitest';
import {
  PROVIDER_GEOS,
  PROVIDER_GEO_NAMES,
  isValidProviderGeo,
  matchProviderGeo,
} from '../../src/constants/supported-locations';

describe('supported-locations', () => {
  describe('PROVIDER_GEOS', () => {
    it('should have 7 supported locations', () => {
      expect(PROVIDER_GEOS).toHaveLength(7);
    });

    it('should include all expected locations', () => {
      expect(PROVIDER_GEOS).toContain('seattle');
      expect(PROVIDER_GEOS).toContain('san_francisco');
      expect(PROVIDER_GEOS).toContain('south_bay');
      expect(PROVIDER_GEOS).toContain('princeton');
      expect(PROVIDER_GEOS).toContain('vancouver');
      expect(PROVIDER_GEOS).toContain('toronto');
      expect(PROVIDER_GEOS).toContain('new_york');
    });
  });

  describe('PROVIDER_GEO_NAMES', () => {
    it('should have display name for each location', () => {
      expect(PROVIDER_GEO_NAMES.seattle).toBe('Seattle');
      expect(PROVIDER_GEO_NAMES.san_francisco).toBe('San Francisco');
      expect(PROVIDER_GEO_NAMES.south_bay).toBe('South Bay (Mountain View, Palo Alto, Sunnyvale)');
      expect(PROVIDER_GEO_NAMES.princeton).toBe('Princeton, NJ');
      expect(PROVIDER_GEO_NAMES.vancouver).toBe('Vancouver');
      expect(PROVIDER_GEO_NAMES.toronto).toBe('Toronto');
      expect(PROVIDER_GEO_NAMES.new_york).toBe('New York');
    });
  });

  describe('isValidProviderGeo', () => {
    it('should return true for valid geo IDs', () => {
      expect(isValidProviderGeo('seattle')).toBe(true);
      expect(isValidProviderGeo('san_francisco')).toBe(true);
      expect(isValidProviderGeo('south_bay')).toBe(true);
      expect(isValidProviderGeo('princeton')).toBe(true);
      expect(isValidProviderGeo('vancouver')).toBe(true);
      expect(isValidProviderGeo('toronto')).toBe(true);
      expect(isValidProviderGeo('new_york')).toBe(true);
    });

    it('should return false for invalid geo IDs', () => {
      expect(isValidProviderGeo('chicago')).toBe(false);
      expect(isValidProviderGeo('los_angeles')).toBe(false);
      expect(isValidProviderGeo('')).toBe(false);
      expect(isValidProviderGeo('Seattle')).toBe(false); // case sensitive
    });
  });

  describe('matchProviderGeo', () => {
    describe('direct ID matching', () => {
      it('should match exact geo IDs', () => {
        expect(matchProviderGeo('seattle')).toBe('seattle');
        expect(matchProviderGeo('san_francisco')).toBe('san_francisco');
        expect(matchProviderGeo('south_bay')).toBe('south_bay');
      });

      it('should be case insensitive', () => {
        expect(matchProviderGeo('SEATTLE')).toBe('seattle');
        expect(matchProviderGeo('San_Francisco')).toBe('san_francisco');
      });

      it('should trim whitespace', () => {
        expect(matchProviderGeo('  seattle  ')).toBe('seattle');
      });
    });

    describe('display name matching', () => {
      it('should match display names', () => {
        expect(matchProviderGeo('Seattle')).toBe('seattle');
        expect(matchProviderGeo('San Francisco')).toBe('san_francisco');
        expect(matchProviderGeo('Princeton, NJ')).toBe('princeton');
        expect(matchProviderGeo('New York')).toBe('new_york');
      });

      it('should be case insensitive for display names', () => {
        expect(matchProviderGeo('SEATTLE')).toBe('seattle');
        expect(matchProviderGeo('san francisco')).toBe('san_francisco');
        expect(matchProviderGeo('NEW YORK')).toBe('new_york');
      });
    });

    describe('alias matching', () => {
      it('should match SF aliases', () => {
        expect(matchProviderGeo('SF')).toBe('san_francisco');
        expect(matchProviderGeo('sf')).toBe('san_francisco');
        expect(matchProviderGeo('San Fran')).toBe('san_francisco');
      });

      it('should match South Bay aliases', () => {
        expect(matchProviderGeo('Bay Area')).toBe('south_bay');
        expect(matchProviderGeo('Silicon Valley')).toBe('south_bay');
        expect(matchProviderGeo('Mountain View')).toBe('south_bay');
        expect(matchProviderGeo('Palo Alto')).toBe('south_bay');
        expect(matchProviderGeo('Sunnyvale')).toBe('south_bay');
        expect(matchProviderGeo('MV')).toBe('south_bay');
      });

      it('should match NYC aliases', () => {
        expect(matchProviderGeo('NYC')).toBe('new_york');
        expect(matchProviderGeo('nyc')).toBe('new_york');
        expect(matchProviderGeo('New York City')).toBe('new_york');
        expect(matchProviderGeo('Manhattan')).toBe('new_york');
        expect(matchProviderGeo('Brooklyn')).toBe('new_york');
      });

      it('should match Princeton aliases', () => {
        expect(matchProviderGeo('Princeton NJ')).toBe('princeton');
        expect(matchProviderGeo('princeton, nj')).toBe('princeton');
      });
    });

    describe('invalid inputs', () => {
      it('should return null for unsupported locations', () => {
        expect(matchProviderGeo('Chicago')).toBeNull();
        expect(matchProviderGeo('Los Angeles')).toBeNull();
        expect(matchProviderGeo('Boston')).toBeNull();
        expect(matchProviderGeo('Miami')).toBeNull();
      });

      it('should return null for empty string', () => {
        expect(matchProviderGeo('')).toBeNull();
      });

      it('should return null for whitespace only', () => {
        expect(matchProviderGeo('   ')).toBeNull();
      });

      it('should return null for partial matches that are not aliases', () => {
        expect(matchProviderGeo('Sea')).toBeNull(); // partial Seattle
        expect(matchProviderGeo('New')).toBeNull(); // partial New York
        expect(matchProviderGeo('Van')).toBeNull(); // partial Vancouver
      });
    });
  });
});
