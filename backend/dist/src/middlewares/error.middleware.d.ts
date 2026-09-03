import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';
export declare const errorHandler: (err: ApiError, _req: Request, res: Response, _next: NextFunction) => void;
export declare const createError: (message: string, status: number) => ApiError;
