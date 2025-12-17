import { Router, Request, Response, NextFunction } from 'express';
import { searchProviders, getProviderById } from '../services/provider-service';
import { providerQuerySchema, providerIdSchema } from '../validation/provider-schemas';
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
