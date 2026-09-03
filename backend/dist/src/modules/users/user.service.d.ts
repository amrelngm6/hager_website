import type { UserPublic, CreateUserInput, UpdateUserInput, UpdateUserStatusInput, ListUsersQuery } from './user.types';
import type { SessionUser } from '../../types';
export declare class UserService {
    private readonly repo;
    constructor();
    list(query: ListUsersQuery): Promise<{
        data: UserPublic[];
        total: number;
        page: number;
        limit: number;
    }>;
    getById(id: string): Promise<UserPublic>;
    create(data: CreateUserInput, actor: SessionUser): Promise<UserPublic>;
    update(id: string, data: UpdateUserInput, actor: SessionUser | undefined): Promise<UserPublic>;
    updateStatus(id: string, data: UpdateUserStatusInput, actor: SessionUser): Promise<UserPublic>;
    delete(id: string, actor: SessionUser): Promise<void>;
}
