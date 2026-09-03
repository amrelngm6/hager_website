"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./core/logger"));
// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------
const httpServer = http_1.default.createServer(app_1.default);
// ---------------------------------------------------------------------------
// Start listening
// ---------------------------------------------------------------------------
httpServer.listen(config_1.default.PORT, () => {
    logger_1.default.info(`[Server] ✅  Running in ${config_1.default.NODE_ENV} mode`);
    logger_1.default.info(`[Server] 🚀  API  → http://localhost:${config_1.default.PORT}/api/v1`);
    logger_1.default.info(`[Server] ❤️   Health → http://localhost:${config_1.default.PORT}/api/v1/health`);
});
// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
async function shutdown(signal) {
    logger_1.default.info(`[Server] ${signal} received — shutting down gracefully...`);
    httpServer.close(() => {
        logger_1.default.info('[Server] HTTP server closed');
        process.exit(0);
    });
    // Force exit after 10 s if connections don't drain
    setTimeout(() => {
        logger_1.default.error('[Server] Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
// Catch unhandled promise rejections — log and exit
process.on('unhandledRejection', (reason) => {
    logger_1.default.error('[Server] Unhandled promise rejection', { reason });
    process.exit(1);
});
// Catch uncaught exceptions — always fatal
process.on('uncaughtException', (err) => {
    logger_1.default.error('[Server] Uncaught exception', { message: err.message, stack: err.stack });
    process.exit(1);
});
exports.default = httpServer;
//# sourceMappingURL=index.js.map