import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { ValidationError } from './httpErrors';
import logger from '../logger';

/**
 * Global Express error handler.
 *
 * Must be registered as the LAST middleware in app.ts (4-argument signature).
 * Formats every error into the standard response envelope:
 *
 *   { success: false, error: { code, message, details? } }
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── Operational / known AppError ──────────────────────────────────────────
  if (err instanceof AppError) {
    if (!err.isOperational) {
      // Programmer error — log full stack
      logger.error('Unhandled AppError (non-operational)', {
        code: err.code,
        message: err.message,
        stack: err.stack,
      });
    }

    const body: Record<string, unknown> = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };

    // Attach validation details when present
    if (err instanceof ValidationError && err.details.length > 0) {
      (body.error as Record<string, unknown>).details = err.details;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // ── Unknown / programmer error ─────────────────────────────────────────────
  const message =
    err instanceof Error ? err.message : 'An unexpected error occurred.';

  logger.error('Unhandled error', {
    message,
    stack: err instanceof Error ? err.stack : undefined,
  });

  // const isProd = process.env.NODE_ENV === 'production';
  const isProd = false;

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProd ? 'An unexpected error occurred.' : message,
    },
  });
}
