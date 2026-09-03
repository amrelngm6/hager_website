import { SessionUser } from '../../types';
export declare const loginUser: (emailOrUsername: string, password: string) => Promise<SessionUser>;
export declare const changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<void>;
