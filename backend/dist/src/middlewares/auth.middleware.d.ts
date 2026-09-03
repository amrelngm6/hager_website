import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const requireAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
