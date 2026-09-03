/**
 * Base application error.
 *
 * Throw instances of this class (or its subclasses) from services and
 * repositories. The global error handler catches them and formats the
 * response envelope.
 */
export class AppError extends Error {
  /** HTTP status code to send to the client. */
  public readonly statusCode: number;

  /** Machine-readable error code (e.g. "WORKFLOW_NOT_FOUND"). */
  public readonly code: string;

  /**
   * `true`  → operational error (known, user-facing).
   * `false` → programmer error (unexpected; log stack trace, return 500).
   */
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Restore prototype chain (required when extending built-ins in TS)
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
