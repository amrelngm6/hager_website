import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../types';
export declare class ContentController {
    private readonly service;
    constructor();
    getAll: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    getByKey: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    update: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
