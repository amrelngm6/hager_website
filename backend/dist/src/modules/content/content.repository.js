"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentRepository = void 0;
const pool_1 = __importDefault(require("../../core/database/pool"));
// ---------------------------------------------------------------------------
// ContentRepository — raw SQL only
// ---------------------------------------------------------------------------
class ContentRepository {
    // ── Find all ─────────────────────────────────────────────────────────────
    async findAll() {
        const [rows] = await pool_1.default.execute('SELECT section_key, data, updated_at FROM content_sections ORDER BY section_key ASC');
        return rows.map(this.parseRow);
    }
    // ── Find one ──────────────────────────────────────────────────────────────
    async findByKey(key) {
        const [rows] = await pool_1.default.execute('SELECT section_key, data, updated_at FROM content_sections WHERE section_key = ? LIMIT 1', [key]);
        if (rows.length === 0)
            return null;
        return this.parseRow(rows[0]);
    }
    // ── Upsert ────────────────────────────────────────────────────────────────
    // INSERT … ON DUPLICATE KEY UPDATE — safe idempotent write.
    async upsert(key, data) {
        const json = JSON.stringify(data);
        await pool_1.default.execute(`INSERT INTO content_sections (section_key, data)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE data = VALUES(data)`, [key, json]);
    }
    // ── Helpers ───────────────────────────────────────────────────────────────
    parseRow(row) {
        return {
            section_key: row.section_key,
            // mysql2 returns JSON columns as already-parsed objects in most drivers,
            // but guard against string form just in case.
            data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
            updated_at: row.updated_at,
        };
    }
}
exports.ContentRepository = ContentRepository;
//# sourceMappingURL=content.repository.js.map