import { eq, desc, sql, or, inArray, and } from 'drizzle-orm';
import { db, providers, Provider } from '../db';
import { ProviderGeo } from '../constants/supported-locations';
import { logger } from '../utils/logger';

/**
 * Search providers with optional text query and geo filter
 * Searches across category, description, and services
 * Results ordered by rating descending
 */
export async function searchProviders(query?: string, geo?: ProviderGeo): Promise<Provider[]> {
  logger.debug('Searching providers', { query, geo });

  if (!query || !query.trim()) {
    // No query - return all providers (optionally filtered by geo)
    const results = await db
      .select()
      .from(providers)
      .where(geo ? eq(providers.geo, geo) : undefined)
      .orderBy(desc(providers.rating));

    logger.info('Provider search completed', { resultCount: results.length, query: null, geo });
    return results;
  }

  // Text search across category, description, and services (JSON array)
  const searchTerm = `%${query.trim().toLowerCase()}%`;

  const textCondition = or(
    // Search in category (case-insensitive)
    sql`lower(${providers.category}) LIKE ${searchTerm}`,
    // Search in description (case-insensitive)
    sql`lower(${providers.description}) LIKE ${searchTerm}`,
    // Search in services JSON array
    sql`EXISTS (
      SELECT 1 FROM json_each(${providers.services})
      WHERE lower(json_each.value) LIKE ${searchTerm}
    )`
  );

  // Combine text search with optional geo filter
  const whereCondition = geo
    ? and(textCondition, eq(providers.geo, geo))
    : textCondition;

  const results = await db
    .select()
    .from(providers)
    .where(whereCondition)
    .orderBy(desc(providers.rating));

  logger.info('Provider search completed', { resultCount: results.length, query, geo });
  return results;
}

/**
 * Get a single provider by ID
 */
export async function getProviderById(id: string): Promise<Provider | null> {
  if (!id || !id.trim()) {
    return null;
  }

  logger.debug('Getting provider by ID', { id });

  const results = await db
    .select()
    .from(providers)
    .where(eq(providers.id, id))
    .limit(1);

  if (results.length === 0) {
    logger.debug('Provider not found', { id });
    return null;
  }

  logger.debug('Provider found', { id, name: results[0].name });
  return results[0];
}

/**
 * Get all providers (convenience function)
 */
export async function getAllProviders(): Promise<Provider[]> {
  return searchProviders();
}

/**
 * Get multiple providers by IDs
 * Preserves order of input IDs
 */
export async function getProvidersByIds(ids: string[]): Promise<Provider[]> {
  if (!ids || ids.length === 0) {
    return [];
  }

  logger.debug('Getting providers by IDs', { count: ids.length });

  const results = await db
    .select()
    .from(providers)
    .where(inArray(providers.id, ids));

  // Preserve order of input IDs
  const providerMap = new Map(results.map((p) => [p.id, p]));
  const orderedResults = ids
    .map((id) => providerMap.get(id))
    .filter((p): p is Provider => p !== undefined);

  logger.debug('Providers found', { requested: ids.length, found: orderedResults.length });
  return orderedResults;
}
