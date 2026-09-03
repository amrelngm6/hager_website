"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_1 = require("./src/core/socket");
const app_1 = __importDefault(require("./src/app"));
const config_1 = __importDefault(require("./src/config"));
const logger_1 = __importDefault(require("./src/core/logger"));
// Initialize core infrastructure (pool and redis connect eagerly)
require("./src/core/database/pool");
require("./src/core/redis/index");
const httpServer = http_1.default.createServer(app_1.default);
// Attach Socket.IO to the same HTTP server
(0, socket_1.initSocket)(httpServer);
httpServer.listen(config_1.default.PORT, () => {
    logger_1.default.info(`Server running on port ${config_1.default.PORT} [${config_1.default.NODE_ENV}]`);
});
// ── Graceful shutdown ─────────────────────────────────────────────────────────
function gracefulShutdown(signal) {
    logger_1.default.info(`${signal} received. Shutting down gracefully...`);
    httpServer.close(() => {
        logger_1.default.info('HTTP server closed.');
        process.exit(0);
    });
    // Force exit after 10s
    setTimeout(() => {
        logger_1.default.error('Forcefully shutting down after timeout.');
        process.exit(1);
    }, 10000);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
//# sourceMappingURL=server.js.map