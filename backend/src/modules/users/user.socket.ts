import type { Server } from 'socket.io';
import logger from '../../core/logger';
// ---------------------------------------------------------------------------
// User Socket Events
//
// No real-time user events in this phase. This file is a required module
// placeholder per the module anatomy defined in README.md.
//
// Future events to consider:
//   user:role_changed  → notify the affected user their role changed
//   user:banned        → force-disconnect banned user's socket
// ---------------------------------------------------------------------------
/**
 * Register inbound user socket event listeners.
 * Currently a no-op placeholder for future real-time user events.
 */
export function registerUserSocketHandlers(_io: Server): void {
  logger.debug('[Socket] User socket handlers registered (no active listeners).');
}
