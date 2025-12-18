import { Router, Request, Response, NextFunction } from 'express';
import {
  getOAuthUrl,
  exchangeCodeForTokens,
  getConnection,
  saveConnection,
  deleteConnection,
} from '../services/calendar-connection-service';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const router = Router();

// Default user for MVP (hardcoded, expandable later)
const DEFAULT_USER_ID = 'default_user';

/**
 * GET /auth/google/url
 * Returns the OAuth URL for the user to visit to connect their calendar
 */
router.get('/google/url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if Google Calendar is configured
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
      logger.warn('Google Calendar not configured');
      return res.status(503).json({
        success: false,
        error: {
          code: 'CALENDAR_NOT_CONFIGURED',
          message: 'Calendar integration is not available',
        },
      });
    }

    const url = getOAuthUrl();

    logger.debug('Generated OAuth URL');

    res.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/google/callback
 * Handles the OAuth redirect from Google
 * Exchanges the code for tokens and saves them in the database
 * Redirects to frontend after completion
 */
router.get('/google/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, error: oauthError } = req.query;

    const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';

    // Handle OAuth errors
    if (oauthError) {
      logger.warn('OAuth flow cancelled or errored', { error: oauthError });
      return res.redirect(`${frontendUrl}?calendar_error=access_denied`);
    }

    if (!code || typeof code !== 'string') {
      logger.warn('Missing authorization code in callback');
      return res.redirect(`${frontendUrl}?calendar_error=missing_code`);
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Save connection for the default user
    await saveConnection(
      DEFAULT_USER_ID,
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      },
      tokens.email
    );

    logger.info('Calendar connected successfully', {
      userId: DEFAULT_USER_ID,
      email: tokens.email,
    });

    // Redirect to frontend with success indicator
    res.redirect(`${frontendUrl}?calendar_connected=true`);
  } catch (error) {
    logger.error('OAuth callback failed', { error: String(error) });

    const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?calendar_error=connection_failed`);
  }
});

/**
 * GET /auth/google/status
 * Check if the user has a calendar connected
 */
router.get('/google/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const connection = await getConnection(DEFAULT_USER_ID);

    res.json({
      success: true,
      data: {
        connected: connection !== null,
        email: connection?.email || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/google/disconnect
 * Disconnect the user's calendar
 */
router.post('/google/disconnect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await deleteConnection(DEFAULT_USER_ID);

    if (deleted) {
      logger.info('Calendar disconnected', { userId: DEFAULT_USER_ID });
    }

    res.json({
      success: true,
      data: {
        disconnected: deleted,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
