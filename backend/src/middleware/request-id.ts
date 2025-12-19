import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requestContext } from '../utils/logger';

// Extend Express Request type to include requestId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Middleware to generate and attach a unique request ID to each request.
 *
 * Features:
 * - Generates a UUID v4 for each incoming request
 * - Accepts existing X-Request-ID header if provided (for request tracing across services)
 * - Attaches requestId to the request object for access in route handlers
 * - Sets X-Request-ID response header for client correlation
 * - Runs the rest of the request within AsyncLocalStorage context
 *   so requestId is automatically available in all downstream logging
 *
 * Usage:
 *   app.use(requestIdMiddleware); // Add as first middleware
 *
 *   // In any route handler or service:
 *   req.requestId // Access the request ID
 *   logger.info('Something happened'); // requestId auto-included
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Accept existing request ID from header or generate new one
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();

  // Attach to request object for direct access
  req.requestId = requestId;

  // Set response header for client correlation
  res.setHeader('X-Request-ID', requestId);

  // Run the rest of the request in AsyncLocalStorage context
  // This makes requestId available to logger automatically
  requestContext.run({ requestId }, () => {
    next();
  });
}
