import { z } from 'zod';

// ---------------------------------------------------------------------------
// Database row shape
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Public shape — password_hash and deleted_at are never returned to clients
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Zod schemas — consumed by validate() middleware in routes
// ---------------------------------------------------------------------------

export const CreateUserSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required.' }),
  password: z.string().min(8).max(128),
  first_name: z.string().min(1).max(100).nullable().optional(),
  last_name: z.string().min(1).max(100).nullable().optional(),
  timezone: z.string().max(64).default('UTC'),
  status: z.enum(['active', 'inactive']).default('active'),
  preferences: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const UpdateUserSchema = z.object({
  first_name: z.string().min(1).max(100).nullable().optional(),
  last_name: z.string().min(1).max(100).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  timezone: z.string().max(64).optional(),
  preferences: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const UpdateUserStatusSchema = z.object({
  status: z.enum(['active', 'inactive']),
});

export const ListUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
  status: z.enum(['active', 'inactive', 'invited', 'banned']).optional(),
  sort: z.enum(['email', 'first_name', 'created_at', 'last_login_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(100).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof UpdateUserStatusSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
