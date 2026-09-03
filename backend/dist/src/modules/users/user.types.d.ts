import { z } from 'zod';
export interface User {
    id: string;
    email: string;
    password_hash: string;
    first_name: string | null;
    last_name: string | null;
    status: 'active' | 'inactive';
    email_verified_at: Date | null;
    last_login_at: Date | null;
    avatar_url: string | null;
    timezone: string;
    preferences: Record<string, unknown> | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    is_active: boolean;
}
export interface UserPublic {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    status: 'active' | 'inactive';
    email_verified_at: Date | null;
    last_login_at: Date | null;
    avatar_url: string | null;
    timezone: string;
    preferences: Record<string, unknown> | null;
    created_at: Date;
    updated_at: Date;
}
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    first_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    last_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    timezone: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
    }>>;
    preferences: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export declare const UpdateUserSchema: z.ZodObject<{
    first_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    last_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    avatar_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    timezone: z.ZodOptional<z.ZodString>;
    preferences: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export declare const UpdateUserStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        active: "active";
        inactive: "inactive";
    }>;
}, z.core.$strip>;
export declare const ListUsersQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    role: z.ZodOptional<z.ZodEnum<{
        owner: "owner";
        admin: "admin";
        member: "member";
        viewer: "viewer";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
        invited: "invited";
        banned: "banned";
    }>>;
    sort: z.ZodDefault<z.ZodEnum<{
        email: "email";
        first_name: "first_name";
        created_at: "created_at";
        last_login_at: "last_login_at";
    }>>;
    order: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof UpdateUserStatusSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
