import bcrypt from 'bcryptjs';
// import { cacheGet, cacheSet, cacheDel } from '../../core/redis';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../../core/errors/httpErrors';
import { UserRepository } from './user.repository';
import type {
  User,
  UserPublic,
  CreateUserInput,
  UpdateUserInput,
  UpdateUserStatusInput,
  ListUsersQuery,
} from './user.types';
import type { SessionUser } from '../../types';
// Cache TTLs (seconds)
const TTL_DETAIL = 300;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SALT_ROUNDS = 12;
function toPublic(u: User): UserPublic {
  return {
    id: u.id,
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
    status: u.status,
    email_verified_at: u.email_verified_at,
    last_login_at: u.last_login_at,
    avatar_url: u.avatar_url,
    timezone: u.timezone,
    preferences: u.preferences,
    created_at: u.created_at,
    updated_at: u.updated_at,
  };
}
// ---------------------------------------------------------------------------
// UserService — all business logic lives here
// ---------------------------------------------------------------------------
export class UserService {
  private readonly repo: UserRepository;
  constructor() {
    this.repo = new UserRepository();
  }
  // ── List ──────────────────────────────────────────────────────────────────
  async list(
    
    query: ListUsersQuery,
  ): Promise<{ data: UserPublic[]; total: number; page: number; limit: number }> {
    const { rows, total } = await this.repo.findAll(query);
    return {
      data: rows.map(toPublic),
      total,
      page: query.page,
      limit: query.limit,
    };
  }
  // ── Get one ───────────────────────────────────────────────────────────────
  async getById(id: string): Promise<UserPublic> {
    // if (cached) return cached;
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundError('User not found.', 'USER_NOT_FOUND');
    }
    const pub = toPublic(user);
    return pub;
  }
  // ── Create ────────────────────────────────────────────────────────────────
  async create(
    data: CreateUserInput,
    
    actor: SessionUser,
  ): Promise<UserPublic> {
    // Role guard — only owner can create admins
    if (data.status === 'active') {
      throw new ForbiddenError(
        'Only active users may create admin users.',
        'INSUFFICIENT_ROLE',
      );
    }
    // Uniqueness check
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      throw new ConflictError(
        `A user with email "${data.email}" already exists.`,
        'USER_EMAIL_CONFLICT',
      );
    }
    const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const id = await this.repo.create({
      email: data.email,
      password_hash,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      timezone: data.timezone,
      status: data.status,
      preferences: data.preferences ?? null,
    });
    // Invalidate list cache
    const user = await this.repo.findById(id);
    if (!user) throw new Error('User not found after creation.');
    const pub = toPublic(user);
    
    return pub;
  }
  // ── Update ────────────────────────────────────────────────────────────────
  async update(
    id: string,
    data: UpdateUserInput,
    actor: SessionUser | undefined,
  ): Promise<UserPublic> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found.', 'USER_NOT_FOUND');
    }
    await this.repo.update(id, data);
    const updated = await this.repo.findById(id);
    if (!updated) throw new Error('User not found after update.');
    const pub = toPublic(updated);
    return pub;
  }
  
  // ── Update status ─────────────────────────────────────────────────────────
  async updateStatus(
    id: string,
    data: UpdateUserStatusInput,
    actor: SessionUser,
  ): Promise<UserPublic> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found.', 'USER_NOT_FOUND');
    }
    // Owners cannot be banned or deactivated
    if (existing.status != 'active') {
      throw new ForbiddenError(
        'The status of an inactive user cannot be changed.',
        'INACTIVE_STATUS_PROTECTED',
      );
    }
    await this.repo.updateStatus(id, data.status);
    const updated = await this.repo.findById(id);
    if (!updated) throw new Error('User not found after status update.');
    const pub = toPublic(updated);
    return pub;
  }
  // ── Delete (soft) ─────────────────────────────────────────────────────────
  async delete(
    id: string,
    
    actor: SessionUser,
  ): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found.', 'USER_NOT_FOUND');
    }
    // Owners cannot delete themselves
    if (existing.status != 'active') {
      throw new ForbiddenError(
        'An inactive user cannot be deleted.',
        'INACTIVE_DELETE_PROTECTED',
      );
    }
    await this.repo.softDelete(id);
  }
}