/**
 * Supported geographic locations for provider filtering
 * Re-exports types from schema and adds helper functions
 */

import { ProviderGeo, PROVIDER_GEOS } from '../db/schema';

// Re-export types from schema
export { ProviderGeo, PROVIDER_GEOS } from '../db/schema';

// Human-readable names for AI to communicate with users
export const PROVIDER_GEO_NAMES: Record<ProviderGeo, string> = {
  'seattle': 'Seattle',
  'san_francisco': 'San Francisco',
  'south_bay': 'South Bay (Mountain View, Palo Alto, Sunnyvale)',
  'princeton': 'Princeton, NJ',
  'vancouver': 'Vancouver',
  'toronto': 'Toronto',
  'new_york': 'New York',
};

/**
 * Check if a string is a valid ProviderGeo
 */
export function isValidProviderGeo(value: string): value is ProviderGeo {
  return PROVIDER_GEOS.includes(value as ProviderGeo);
}

/**
 * Try to match user input to a ProviderGeo (case-insensitive, partial match)
 * Returns the matching ProviderGeo or null if no match
 */
export function matchProviderGeo(input: string): ProviderGeo | null {
  const normalized = input.toLowerCase().trim();

  // Direct match on geo id
  if (isValidProviderGeo(normalized)) {
    return normalized;
  }

  // Match on human-readable name (case-insensitive)
  for (const [geo, name] of Object.entries(PROVIDER_GEO_NAMES)) {
    if (name.toLowerCase() === normalized) {
      return geo as ProviderGeo;
    }
  }

  // Partial/fuzzy matching for common variations
  const aliases: Record<string, ProviderGeo> = {
    'sf': 'san_francisco',
    'san fran': 'san_francisco',
    'bay area': 'south_bay',
    'silicon valley': 'south_bay',
    'mountain view': 'south_bay',
    'palo alto': 'south_bay',
    'sunnyvale': 'south_bay',
    'mv': 'south_bay',
    'nyc': 'new_york',
    'new york city': 'new_york',
    'manhattan': 'new_york',
    'brooklyn': 'new_york',
    'princeton nj': 'princeton',
    'princeton, nj': 'princeton',
  };

  if (aliases[normalized]) {
    return aliases[normalized];
  }

  return null;
}
