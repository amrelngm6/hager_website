import type { User, UpdateUserInput, ListUsersQuery } from './user.types';
export declare class UserRepository {
    findAll(query: ListUsersQuery): Promise<{
        rows: User[];
        total: number;
    }>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findForLogin(email: string): Promise<User | null>;
    updateLastLogin(id: string): Promise<void>;
    updatePassword(id: string, passwordHash: string): Promise<void>;
    /**
     * Insert a new user row. The caller is responsible for hashing the password
     * before passing it in — this repository stores only the hash.
     */
    create(data: {
        email: string;
        password_hash: string;
        first_name: string | null;
        last_name: string | null;
        status: 'active' | 'inactive';
        timezone: string;
        preferences: Record<string, unknown> | null;
    }): Promise<string>;
    update(id: string, data: UpdateUserInput): Promise<void>;
    updateStatus(id: string, status: 'active' | 'inactive'): Promise<void>;
    softDelete(id: string): Promise<void>;
}
