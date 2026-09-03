"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalError = exports.TooManyRequestsError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = void 0;
const AppError_1 = require("./AppError");
// ---------------------------------------------------------------------------
// 400 Bad Request
// ---------------------------------------------------------------------------
class BadRequestError extends AppError_1.AppError {
    constructor(message = 'Bad request.', code = 'BAD_REQUEST') {
        super(message, 400, code);
    }
}
exports.BadRequestError = BadRequestError;
// ---------------------------------------------------------------------------
// 401 Unauthorized
// ---------------------------------------------------------------------------
class UnauthorizedError extends AppError_1.AppError {
    constructor(message = 'Authentication required.', code = 'UNAUTHORIZED') {
        super(message, 401, code);
    }
}
exports.UnauthorizedError = UnauthorizedError;
// ---------------------------------------------------------------------------
// 403 Forbidden
// ---------------------------------------------------------------------------
class ForbiddenError extends AppError_1.AppError {
    constructor(message = 'You do not have permission to perform this action.', code = 'FORBIDDEN') {
        super(message, 403, code);
    }
}
exports.ForbiddenError = ForbiddenError;
// ---------------------------------------------------------------------------
// 404 Not Found
// ---------------------------------------------------------------------------
class NotFoundError extends AppError_1.AppError {
    constructor(message = 'Resource not found.', code = 'NOT_FOUND') {
        super(message, 404, code);
    }
}
exports.NotFoundError = NotFoundError;
// ---------------------------------------------------------------------------
// 409 Conflict
// ---------------------------------------------------------------------------
class ConflictError extends AppError_1.AppError {
    constructor(message = 'Resource already exists.', code = 'CONFLICT') {
        super(message, 409, code);
    }
}
exports.ConflictError = ConflictError;
// ---------------------------------------------------------------------------
// 422 Validation Error
// ---------------------------------------------------------------------------
class ValidationError extends AppError_1.AppError {
    constructor(message = 'Validation failed.', details = [], code = 'VALIDATION_ERROR') {
        super(message, 422, code);
        this.details = details;
    }
}
exports.ValidationError = ValidationError;
// ---------------------------------------------------------------------------
// 429 Too Many Requests
// ---------------------------------------------------------------------------
class TooManyRequestsError extends AppError_1.AppError {
    constructor(message = 'Too many requests. Please try again later.', code = 'RATE_LIMIT_EXCEEDED') {
        super(message, 429, code);
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
// ---------------------------------------------------------------------------
// 500 Internal Server Error
// ---------------------------------------------------------------------------
class InternalError extends AppError_1.AppError {
    constructor(message = 'An unexpected error occurred.', code = 'INTERNAL_ERROR') {
        super(message, 500, code, false);
    }
}
exports.InternalError = InternalError;
//# sourceMappingURL=httpErrors.js.map