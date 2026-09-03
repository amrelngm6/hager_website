import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../types';
export declare class UserController {
    private readonly service;
    constructor();
    list: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    getById: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    create: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    update: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    updateStatus: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    remove: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
