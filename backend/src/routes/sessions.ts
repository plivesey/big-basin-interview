import { Router, Request, Response, NextFunction } from 'express';
import { getSession, getSessionsWithTitles } from '../services/session-service';
import { sessionIdSchema } from '../validation/booking-schemas';
import { NotFoundError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/sessions
 * Get all sessions with computed titles for sidebar display
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    logger.debug('Sessions list request');

    const sessions = await getSessionsWithTitles();

    res.json({
      success: true,
      data: {
        sessions,
      },
    });
  } catch (error) {
    next(error);
  }
});

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
