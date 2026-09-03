"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUsersQuerySchema = exports.UpdateUserStatusSchema = exports.UpdateUserSchema = exports.CreateUserSchema = void 0;
const zod_1 = require("zod");
// ---------------------------------------------------------------------------
// Zod schemas — consumed by validate() middleware in routes
// ---------------------------------------------------------------------------
exports.CreateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'A valid email address is required.' }),
    password: zod_1.z.string().min(8).max(128),
    first_name: zod_1.z.string().min(1).max(100).nullable().optional(),
    last_name: zod_1.z.string().min(1).max(100).nullable().optional(),
    timezone: zod_1.z.string().max(64).default('UTC'),
    status: zod_1.z.enum(['active', 'inactive']).default('active'),
    preferences: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).nullable().optional(),
});
exports.UpdateUserSchema = zod_1.z.object({
    first_name: zod_1.z.string().min(1).max(100).nullable().optional(),
    last_name: zod_1.z.string().min(1).max(100).nullable().optional(),
    avatar_url: zod_1.z.string().url().nullable().optional(),
    timezone: zod_1.z.string().max(64).optional(),
    preferences: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).nullable().optional(),
});
exports.UpdateUserStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['active', 'inactive']),
});
exports.ListUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    role: zod_1.z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
    status: zod_1.z.enum(['active', 'inactive', 'invited', 'banned']).optional(),
    sort: zod_1.z.enum(['email', 'first_name', 'created_at', 'last_login_at']).default('created_at'),
    order: zod_1.z.enum(['asc', 'desc']).default('desc'),
    search: zod_1.z.string().max(100).optional(),
});
//# sourceMappingURL=user.types.js.map