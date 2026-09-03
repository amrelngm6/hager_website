import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session?.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  req.user = req.session.user;
  next();
};