"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const AppError_1 = require("./AppError");
const httpErrors_1 = require("./httpErrors");
const logger_1 = __importDefault(require("../logger"));
/**
 * Global Express error handler.
 *
 * Must be registered as the LAST middleware in app.ts (4-argument signature).
 * Formats every error into the standard response envelope:
 *
 *   { success: false, error: { code, message, details? } }
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, _req, res, _next) {
    // ── Operational / known AppError ──────────────────────────────────────────
    if (err instanceof AppError_1.AppError) {
        if (!err.isOperational) {
            // Programmer error — log full stack
            logger_1.default.error('Unhandled AppError (non-operational)', {
                code: err.code,
                message: err.message,
                stack: err.stack,
            });
        }
        const body = {
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        };
        // Attach validation details when present
        if (err instanceof httpErrors_1.ValidationError && err.details.length > 0) {
            body.error.details = err.details;
        }
        res.status(err.statusCode).json(body);
        return;
    }
    // ── Unknown / programmer error ─────────────────────────────────────────────
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    logger_1.default.error('Unhandled error', {
        message,
        stack: err instanceof Error ? err.stack : undefined,
    });
    // const isProd = process.env.NODE_ENV === 'production';
    const isProd = false;
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: isProd ? 'An unexpected error occurred.' : message,
        },
    });
}
//# sourceMappingURL=errorHandler.js.map