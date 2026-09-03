import { AppError } from './AppError';
export declare class BadRequestError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ValidationError extends AppError {
    readonly details: unknown[];
    constructor(message?: string, details?: unknown[], code?: string);
}
export declare class TooManyRequestsError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class InternalError extends AppError {
    constructor(message?: string, code?: string);
}
