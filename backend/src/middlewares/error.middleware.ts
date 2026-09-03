import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';
import dotenv from 'dotenv';
dotenv.config();

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status ?? 500;
  const message = err.message;
    // status === 500 && process.env.NODE_ENV === 'production'
    //   ? 'Internal server error'
    //   : err.message;

  if (status >= 500) {
    console.error('[Error]', err);
  }

  res.status(status).json({ message });
};

export const createError = (message: string, status: number): ApiError => {
  const err = new Error(message) as ApiError;
  err.status = status;
  return err;
};
