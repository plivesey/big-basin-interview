import { AsyncLocalStorage } from 'async_hooks';
import pino from 'pino';
import { env } from '../config/env';

/**
 * Request context stored in AsyncLocalStorage.
 * Automatically propagated through async call chains.
 */
export interface RequestContext {
  requestId: string;
}

/**
 * AsyncLocalStorage instance for request context propagation.
 * Used by request-id middleware to set context that's automatically
 * available in all downstream async operations.
 */
export const requestContext = new AsyncLocalStorage<RequestContext>();

/**
 * Pino logger configuration.
 * - JSON format in production for log aggregation
 * - Pretty print in development for readability
 */
const pinoOptions: pino.LoggerOptions = {
  level: env.LOG_LEVEL,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: undefined, // Don't include pid/hostname by default
};

// Use pino-pretty in development for readable output
const transport =
  env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

const baseLogger = pino(transport ? { ...pinoOptions, transport } : pinoOptions);

/**
 * Logger wrapper that automatically includes request context.
 * Maintains backward compatibility with existing logger API.
 *
 * Usage:
 *   logger.info('User created', { userId: '123' });
 *   logger.error('Failed to save', { error: String(err) });
 *
 * When called within a request context (set by request-id middleware),
 * the requestId is automatically included in all log entries.
 */
export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    const ctx = requestContext.getStore();
    const mergedMeta = ctx?.requestId ? { requestId: ctx.requestId, ...meta } : meta;
    if (mergedMeta && Object.keys(mergedMeta).length > 0) {
      baseLogger.debug(mergedMeta, message);
    } else {
      baseLogger.debug(message);
    }
  },

  info(message: string, meta?: Record<string, unknown>): void {
    const ctx = requestContext.getStore();
    const mergedMeta = ctx?.requestId ? { requestId: ctx.requestId, ...meta } : meta;
    if (mergedMeta && Object.keys(mergedMeta).length > 0) {
      baseLogger.info(mergedMeta, message);
    } else {
      baseLogger.info(message);
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    const ctx = requestContext.getStore();
    const mergedMeta = ctx?.requestId ? { requestId: ctx.requestId, ...meta } : meta;
    if (mergedMeta && Object.keys(mergedMeta).length > 0) {
      baseLogger.warn(mergedMeta, message);
    } else {
      baseLogger.warn(message);
    }
  },

  error(message: string, meta?: Record<string, unknown>): void {
    const ctx = requestContext.getStore();
    const mergedMeta = ctx?.requestId ? { requestId: ctx.requestId, ...meta } : meta;
    if (mergedMeta && Object.keys(mergedMeta).length > 0) {
      baseLogger.error(mergedMeta, message);
    } else {
      baseLogger.error(message);
    }
  },

  /**
   * Create a child logger with bound context.
   * Useful for adding persistent context to a logger instance.
   */
  child(bindings: Record<string, unknown>): pino.Logger {
    return baseLogger.child(bindings);
  },
};
