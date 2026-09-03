/**
 * Base application error.
 *
 * Throw instances of this class (or its subclasses) from services and
 * repositories. The global error handler catches them and formats the
 * response envelope.
 */
export declare class AppError extends Error {
    /** HTTP status code to send to the client. */
    readonly statusCode: number;
    /** Machine-readable error code (e.g. "WORKFLOW_NOT_FOUND"). */
    readonly code: string;
    /**
     * `true`  → operational error (known, user-facing).
     * `false` → programmer error (unexpected; log stack trace, return 500).
     */
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number, code: string, isOperational?: boolean);
}
