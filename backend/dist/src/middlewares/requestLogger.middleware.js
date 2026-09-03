"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = __importDefault(require("../core/logger"));
/**
 * Request logger middleware.
 *
 * Logs: method, URL, status code, and response time in milliseconds.
 * Fires on the response 'finish' event so the status code is always available.
 */
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        logger_1.default[level](`${req.method} ${req.originalUrl} ${res.statusCode} — ${duration}ms`, {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
    });
    next();
}
//# sourceMappingURL=requestLogger.middleware.js.map