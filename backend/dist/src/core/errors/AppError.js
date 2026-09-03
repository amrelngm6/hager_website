"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
/**
 * Base application error.
 *
 * Throw instances of this class (or its subclasses) from services and
 * repositories. The global error handler catches them and formats the
 * response envelope.
 */
class AppError extends Error {
    constructor(message, statusCode, code, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        // Restore prototype chain (required when extending built-ins in TS)
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=AppError.js.map