import { Request } from 'express';
import type { IncomingMessage } from 'http';
import type { Session } from 'express-session';
export interface User {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    is_active: boolean;
    status: 'active' | 'inactive';
    created_at: Date;
    updated_at: Date;
    parent_id: string | null;
}
export interface SessionUser {
    id: string;
    username: string;
    email: string;
}
export interface AuthenticatedRequest extends Request {
    user?: SessionUser;
}
export interface ApiError extends Error {
    status?: number;
}
declare module 'express-session' {
    interface SessionData {
        user?: SessionUser;
    }
}
export interface RequestUser {
    id: string;
    status: 'active' | 'inactive';
}
export interface SocketRequest extends IncomingMessage {
    session?: Session & {
        user?: {
            id: string;
            status: 'active' | 'inactive';
        };
    };
}
