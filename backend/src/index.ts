/**
 * server.ts — Entry point
 *
 * Order of operations:
 *  1. Load env vars (dotenv must run before anything imports config)
 *  2. Import app (Express factory)
 *  3. Create HTTP server
 *  4. Initialise Socket.IO on the HTTP server
 *  5. Start AgentSessionSocketServer (Unix socket — runner↔backend transport)
 *  6. Register Socket.IO module handlers (frontend-facing events only)
 *  7. Start listening
 *  8. Register graceful shutdown handlers
 */
import http from 'http';
import app from './app';
import config from './config';
import logger from './core/logger';

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------
const httpServer = http.createServer(app);

// ---------------------------------------------------------------------------
// Start listening
// ---------------------------------------------------------------------------
httpServer.listen(config.PORT, () => {
  logger.info(`[Server] ✅  Running in ${config.NODE_ENV} mode`);
  logger.info(`[Server] 🚀  API  → http://localhost:${config.PORT}/api/v1`);
  logger.info(`[Server] ❤️   Health → http://localhost:${config.PORT}/api/v1/health`);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
async function shutdown(signal: string): Promise<void> {
  logger.info(`[Server] ${signal} received — shutting down gracefully...`);

  httpServer.close(() => {
    logger.info('[Server] HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10 s if connections don't drain
  setTimeout(() => {
    logger.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

// Catch unhandled promise rejections — log and exit
process.on('unhandledRejection', (reason) => {
  logger.error('[Server] Unhandled promise rejection', { reason });
  process.exit(1);
});

// Catch uncaught exceptions — always fatal
process.on('uncaughtException', (err: Error) => {
  logger.error('[Server] Uncaught exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

export default httpServer;
