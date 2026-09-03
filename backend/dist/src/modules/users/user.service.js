"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// import { cacheGet, cacheSet, cacheDel } from '../../core/redis';
const httpErrors_1 = require("../../core/errors/httpErrors");
const user_repository_1 = require("./user.repository");
// Cache TTLs (seconds)
const TTL_DETAIL = 300;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SALT_ROUNDS = 12;
function toPublic(u) {
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
class UserService {
    constructor() {
        this.repo = new user_repository_1.UserRepository();
    }
    // ── List ──────────────────────────────────────────────────────────────────
    async list(query) {
        const { rows, total } = await this.repo.findAll(query);
        return {
            data: rows.map(toPublic),
            total,
            page: query.page,
            limit: query.limit,
        };
    }
    // ── Get one ───────────────────────────────────────────────────────────────
    async getById(id) {
        // if (cached) return cached;
        const user = await this.repo.findById(id);
        if (!user) {
            throw new httpErrors_1.NotFoundError('User not found.', 'USER_NOT_FOUND');
        }
        const pub = toPublic(user);
        return pub;
    }
    // ── Create ────────────────────────────────────────────────────────────────
    async create(data, actor) {
        // Role guard — only owner can create admins
        if (data.status === 'active') {
            throw new httpErrors_1.ForbiddenError('Only active users may create admin users.', 'INSUFFICIENT_ROLE');
        }
        // Uniqueness check
        const existing = await this.repo.findByEmail(data.email);
        if (existing) {
            throw new httpErrors_1.ConflictError(`A user with email "${data.email}" already exists.`, 'USER_EMAIL_CONFLICT');
        }
        const password_hash = await bcryptjs_1.default.hash(data.password, SALT_ROUNDS);
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
        if (!user)
            throw new Error('User not found after creation.');
        const pub = toPublic(user);
        return pub;
    }
    // ── Update ────────────────────────────────────────────────────────────────
    async update(id, data, actor) {
        const existing = await this.repo.findById(id);
        if (!existing) {
            throw new httpErrors_1.NotFoundError('User not found.', 'USER_NOT_FOUND');
        }
        await this.repo.update(id, data);
        const updated = await this.repo.findById(id);
        if (!updated)
            throw new Error('User not found after update.');
        const pub = toPublic(updated);
        return pub;
    }
    // ── Update status ─────────────────────────────────────────────────────────
    async updateStatus(id, data, actor) {
        const existing = await this.repo.findById(id);
        if (!existing) {
            throw new httpErrors_1.NotFoundError('User not found.', 'USER_NOT_FOUND');
        }
        // Owners cannot be banned or deactivated
        if (existing.status != 'active') {
            throw new httpErrors_1.ForbiddenError('The status of an inactive user cannot be changed.', 'INACTIVE_STATUS_PROTECTED');
        }
        await this.repo.updateStatus(id, data.status);
        const updated = await this.repo.findById(id);
        if (!updated)
            throw new Error('User not found after status update.');
        const pub = toPublic(updated);
        return pub;
    }
    // ── Delete (soft) ─────────────────────────────────────────────────────────
    async delete(id, actor) {
        const existing = await this.repo.findById(id);
        if (!existing) {
            throw new httpErrors_1.NotFoundError('User not found.', 'USER_NOT_FOUND');
        }
        // Owners cannot delete themselves
        if (existing.status != 'active') {
            throw new httpErrors_1.ForbiddenError('An inactive user cannot be deleted.', 'INACTIVE_DELETE_PROTECTED');
        }
        await this.repo.softDelete(id);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map