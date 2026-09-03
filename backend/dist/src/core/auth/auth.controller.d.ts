import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
export declare const login: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const logout: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const me: (req: AuthenticatedRequest, res: Response) => void;
export declare const updatePassword: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
