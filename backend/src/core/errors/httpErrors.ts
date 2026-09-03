import { AppError } from './AppError';

// ---------------------------------------------------------------------------
// 400 Bad Request
// ---------------------------------------------------------------------------
export class BadRequestError extends AppError {
  constructor(message = 'Bad request.', code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

// ---------------------------------------------------------------------------
// 401 Unauthorized
// ---------------------------------------------------------------------------
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

// ---------------------------------------------------------------------------
// 403 Forbidden
// ---------------------------------------------------------------------------
export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

// ---------------------------------------------------------------------------
// 404 Not Found
// ---------------------------------------------------------------------------
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

// ---------------------------------------------------------------------------
// 409 Conflict
// ---------------------------------------------------------------------------
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists.', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

// ---------------------------------------------------------------------------
// 422 Validation Error
// ---------------------------------------------------------------------------
export class ValidationError extends AppError {
  public readonly details: unknown[];

  constructor(message = 'Validation failed.', details: unknown[] = [], code = 'VALIDATION_ERROR') {
    super(message, 422, code);
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// 429 Too Many Requests
// ---------------------------------------------------------------------------
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests. Please try again later.', code = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, code);
  }
}

// ---------------------------------------------------------------------------
// 500 Internal Server Error
// ---------------------------------------------------------------------------
export class InternalError extends AppError {
  constructor(message = 'An unexpected error occurred.', code = 'INTERNAL_ERROR') {
    super(message, 500, code, false);
  }
}
