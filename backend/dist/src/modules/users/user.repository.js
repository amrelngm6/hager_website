"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const pool_1 = __importDefault(require("../../core/database/pool"));
// ---------------------------------------------------------------------------
// UserRepository — raw SQL only,  always soft-delete aware
// ---------------------------------------------------------------------------
class UserRepository {
    // ── List ──────────────────────────────────────────────────────────────────
    async findAll(query) {
        const { page, limit, role, status, sort, order, search } = query;
        const offset = (page - 1) * limit;
        const conditions = ['status != ?', 'deleted_at IS NULL'];
        const params = ['null'];
        if (role) {
            conditions.push('role = ?');
            params.push(role);
        }
        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }
        if (search) {
            conditions.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        const where = conditions.join(' AND ');
        const allowedSort = {
            email: 'email',
            first_name: 'first_name',
            created_at: 'created_at',
            last_login_at: 'last_login_at',
        };
        const sortCol = allowedSort[sort] ?? 'created_at';
        const sortDir = order === 'asc' ? 'ASC' : 'DESC';
        const conn = await pool_1.default.getConnection();
        try {
            const [countRows] = await conn.query(`SELECT COUNT(*) AS total FROM users WHERE ${where}`, params);
            const total = countRows[0]?.total ?? 0;
            const safeLimit = Math.max(1, Number(limit));
            const safePage = Math.max(1, Number(page));
            const safeOffset = (safePage - 1) * safeLimit;
            // LIMIT and OFFSET must be integers — cast explicitly
            const [rows] = await conn.query(`SELECT * FROM users
        WHERE ${where}
        ORDER BY ${sortCol} ${sortDir}
      LIMIT ${safeLimit} OFFSET ${safeOffset}`, params);
            return { rows, total };
        }
        finally {
            conn.release();
        }
    }
    // ── Find one ──────────────────────────────────────────────────────────────
    async findById(id) {
        const [rows] = await pool_1.default.execute(`SELECT * FROM users
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`, [id]);
        return rows[0] ?? null;
    }
    async findByEmail(email) {
        const [rows] = await pool_1.default.execute(`SELECT * FROM users
       WHERE email = ? AND deleted_at IS NULL
       LIMIT 1`, [email]);
        return rows[0] ?? null;
    }
    async findForLogin(email) {
        const conditions = ['email = ?', 'deleted_at IS NULL'];
        const params = [email];
        const [rows] = await pool_1.default.execute(`SELECT * FROM users
       WHERE ${conditions.join(' AND ')}
       LIMIT 2`, params);
        if (rows.length > 1)
            return null;
        return rows[0] ?? null;
    }
    async updateLastLogin(id) {
        await pool_1.default.execute('UPDATE users SET last_login_at = NOW(3) WHERE id = ? AND deleted_at IS NULL', [id]);
    }
    async updatePassword(id, passwordHash) {
        await pool_1.default.execute('UPDATE users SET password_hash = ? WHERE id = ? AND deleted_at IS NULL', [passwordHash, id]);
    }
    // ── Create ────────────────────────────────────────────────────────────────
    /**
     * Insert a new user row. The caller is responsible for hashing the password
     * before passing it in — this repository stores only the hash.
     */
    async create(data) {
        await pool_1.default.execute(`INSERT INTO users
         (email, password_hash, first_name, last_name, status, timezone, preferences)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            data.email,
            data.password_hash,
            data.first_name,
            data.last_name,
            data.status,
            data.timezone,
            data.preferences ? JSON.stringify(data.preferences) : null,
        ]);
        // Re-fetch by email (unique constraint)
        const inserted = await this.findByEmail(data.email);
        if (!inserted)
            throw new Error('User not found after insert.');
        return inserted.id;
    }
    // ── Update ────────────────────────────────────────────────────────────────
    async update(id, data) {
        const fields = [];
        const params = [];
        if (data.first_name !== undefined) {
            fields.push('first_name = ?');
            params.push(data.first_name);
        }
        if (data.last_name !== undefined) {
            fields.push('last_name = ?');
            params.push(data.last_name);
        }
        if (data.avatar_url !== undefined) {
            fields.push('avatar_url = ?');
            params.push(data.avatar_url);
        }
        if (data.timezone !== undefined) {
            fields.push('timezone = ?');
            params.push(data.timezone);
        }
        if (data.preferences !== undefined) {
            fields.push('preferences = ?');
            params.push(data.preferences ? JSON.stringify(data.preferences) : null);
        }
        if (fields.length === 0)
            return;
        params.push(id);
        await pool_1.default.execute(`UPDATE users SET ${fields.join(', ')}
       WHERE id = ? AND deleted_at IS NULL`, params);
    }
    // ── Status ────────────────────────────────────────────────────────────────
    async updateStatus(id, status) {
        await pool_1.default.execute(`UPDATE users SET status = ?
       WHERE id = ? AND deleted_at IS NULL`, [status, id]);
    }
    // ── Soft delete ───────────────────────────────────────────────────────────
    async softDelete(id) {
        await pool_1.default.execute(`UPDATE users SET deleted_at = NOW(3)
       WHERE id = ? AND deleted_at IS NULL`, [id]);
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=user.repository.js.map