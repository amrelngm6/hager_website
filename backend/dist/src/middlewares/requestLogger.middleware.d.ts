import { Request, Response, NextFunction } from 'express';
/**
 * Request logger middleware.
 *
 * Logs: method, URL, status code, and response time in milliseconds.
 * Fires on the response 'finish' event so the status code is always available.
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
