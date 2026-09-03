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
declare const httpServer: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
export default httpServer;
