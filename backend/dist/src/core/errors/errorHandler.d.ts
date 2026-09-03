import { Request, Response, NextFunction } from 'express';
/**
 * Global Express error handler.
 *
 * Must be registered as the LAST middleware in app.ts (4-argument signature).
 * Formats every error into the standard response envelope:
 *
 *   { success: false, error: { code, message, details? } }
 */
export declare function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void;
