import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
type ValidationTarget = 'body' | 'query' | 'params';
interface ValidateOptions {
    /** Which part of the request to validate. Defaults to 'body'. */
    target?: ValidationTarget;
}
export declare function validate(schema: ZodSchema, options?: ValidateOptions): (req: Request, _res: Response, next: NextFunction) => void;
export {};
