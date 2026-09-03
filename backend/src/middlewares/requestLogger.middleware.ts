import { Request, Response, NextFunction } from 'express';
import logger from '../core/logger';

/**
 * Request logger middleware.
 *
 * Logs: method, URL, status code, and response time in milliseconds.
 * Fires on the response 'finish' event so the status code is always available.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} — ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
}
