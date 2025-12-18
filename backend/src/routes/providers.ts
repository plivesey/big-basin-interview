import { Router, Request, Response, NextFunction } from 'express';
import { searchProviders, getProviderById } from '../services/provider-service';
import { getAvailableSlots } from '../services/availability-service';
import {
  providerQuerySchema,
  providerIdSchema,
  availabilityQuerySchema,
} from '../validation/provider-schemas';
import { NotFoundError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/providers
 * Search providers with optional text query
 * Query params:
 *   - q: Optional search query (searches category, description, services)
 * Returns providers ordered by rating descending
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters
    const { q } = providerQuerySchema.parse(req.query);

    logger.debug('Provider search request', { query: q });

    const providers = await searchProviders(q);

    res.json({
      success: true,
      data: {
        providers,
        total: providers.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/providers/:id/availability
 * Get available time slots for a provider on a specific date
 * Query params:
 *   - date: Date in YYYY-MM-DD format
 *   - duration: Slot duration in minutes (15-480)
 * Returns time slots with availability status
 */
router.get(
  '/:id/availability',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const { id } = providerIdSchema.parse(req.params);

      // Validate query parameters
      const { date, duration } = availabilityQuerySchema.parse(req.query);

      logger.debug('Availability request', { providerId: id, date, duration });

      const availability = await getAvailableSlots(id, date, duration);

      res.json({
        success: true,
        data: availability,
      });
    } catch (error) {
      // Handle provider not found
      if (error instanceof Error && error.message.startsWith('Provider not found')) {
        return next(new NotFoundError('Provider', req.params.id));
      }
      next(error);
    }
  }
);

/**
 * GET /api/providers/:id
 * Get a single provider by ID
 * Returns 404 if provider not found
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate ID parameter
    const { id } = providerIdSchema.parse(req.params);

    logger.debug('Provider detail request', { id });

    const provider = await getProviderById(id);

    if (!provider) {
      throw new NotFoundError('Provider', id);
    }

    res.json({
      success: true,
      data: {
        provider,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
