import { Router, Request, Response, NextFunction } from 'express';
import { getSession } from '../services/session-service';
import { sessionIdSchema } from '../validation/booking-schemas';
import { NotFoundError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/sessions/:id
 * Get a session by ID
 * Returns 404 if session not found
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate ID parameter
    const { id } = sessionIdSchema.parse(req.params);

    logger.debug('Session detail request', { id });

    const session = await getSession(id);

    if (!session) {
      throw new NotFoundError('Session', id);
    }

    res.json({
      success: true,
      data: {
        session,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
