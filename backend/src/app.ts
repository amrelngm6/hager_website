import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import { requestLogger } from './middlewares/requestLogger.middleware';
import { apiRateLimiter } from './middlewares/rateLimiter.middleware';
import apiRouter from './routes';
import { errorHandler } from './core/errors/errorHandler';
import { NotFoundError } from './core/errors/httpErrors';
import session from 'express-session';
import { sessionConfig } from './config';
// import authRoutes from './core/auth/auth.routes';

// ---------------------------------------------------------------------------
// Express app factory
// No listen() call here — that lives in server.ts so the HTTP server instance
// can be shared with Socket.IO.
// ---------------------------------------------------------------------------
const app = express();

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Session management ─────────────────────────────────────────────────────
app.use(
  session({
    ...sessionConfig,
    // store: new PgSession({ pool, tableName: 'session' }),
  })
);


// ── Request logging ─────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Global rate limiter ──────────────────────────────────────────────────────
app.use('/api', apiRateLimiter);

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ── 404 handler — catches any route not matched above ────────────────────────
app.use((_req: Request, _res: Response, next: NextFunction) => {
  console.log('404 handler triggered for unmatched route:', _req.method, _req.originalUrl);
  next(new NotFoundError(`The requested endpoint does not exist. ${_req.method} ${_req.originalUrl}`, 'ROUTE_NOT_FOUND'));
});

// ── Global error handler — must be the last middleware ────────────────────────
app.use(errorHandler);

export default app;
