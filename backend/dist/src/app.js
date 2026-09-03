"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = __importDefault(require("./config"));
const requestLogger_middleware_1 = require("./middlewares/requestLogger.middleware");
const rateLimiter_middleware_1 = require("./middlewares/rateLimiter.middleware");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./core/errors/errorHandler");
const httpErrors_1 = require("./core/errors/httpErrors");
const express_session_1 = __importDefault(require("express-session"));
const config_2 = require("./config");
// import authRoutes from './core/auth/auth.routes';
// ---------------------------------------------------------------------------
// Express app factory
// No listen() call here — that lives in server.ts so the HTTP server instance
// can be shared with Socket.IO.
// ---------------------------------------------------------------------------
const app = (0, express_1.default)();
// ── Security headers ────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
// ── CORS ────────────────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: config_1.default.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ── Session management ─────────────────────────────────────────────────────
app.use((0, express_session_1.default)({
    ...config_2.sessionConfig,
    // store: new PgSession({ pool, tableName: 'session' }),
}));
// ── Request logging ─────────────────────────────────────────────────────────
app.use(requestLogger_middleware_1.requestLogger);
// ── Global rate limiter ──────────────────────────────────────────────────────
app.use('/api', rateLimiter_middleware_1.apiRateLimiter);
// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', routes_1.default);
// ── 404 handler — catches any route not matched above ────────────────────────
app.use((_req, _res, next) => {
    console.log('404 handler triggered for unmatched route:', _req.method, _req.originalUrl);
    next(new httpErrors_1.NotFoundError(`The requested endpoint does not exist. ${_req.method} ${_req.originalUrl}`, 'ROUTE_NOT_FOUND'));
});
// ── Global error handler — must be the last middleware ────────────────────────
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map