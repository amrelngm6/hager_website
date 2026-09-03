"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
const httpErrors_1 = require("../../core/errors/httpErrors");
const content_repository_1 = require("./content.repository");
const content_types_1 = require("./content.types");
// ---------------------------------------------------------------------------
// ContentService — all business logic lives here
// ---------------------------------------------------------------------------
class ContentService {
    constructor() {
        this.repo = new content_repository_1.ContentRepository();
    }
    // ── Get all ───────────────────────────────────────────────────────────────
    async getAll() {
        const sections = await this.repo.findAll();
        return sections;
    }
    // ── Get by key ────────────────────────────────────────────────────────────
    async getByKey(key) {
        this.assertValidKey(key);
        const section = await this.repo.findByKey(key);
        if (!section) {
            throw new httpErrors_1.NotFoundError(`Content section "${key}" not found. Run the migration to seed default content.`, 'CONTENT_SECTION_NOT_FOUND');
        }
        return section;
    }
    // ── Update ────────────────────────────────────────────────────────────────
    async update(key, data, _actor) {
        this.assertValidKey(key);
        await this.repo.upsert(key, data);
        const updated = await this.repo.findByKey(key);
        if (!updated)
            throw new Error('Content section not found after upsert.');
        return updated;
    }
    // ── Helpers ───────────────────────────────────────────────────────────────
    assertValidKey(key) {
        if (!content_types_1.ALLOWED_SECTION_KEYS.includes(key)) {
            throw new httpErrors_1.BadRequestError(`"${key}" is not a valid section key. Allowed keys: ${content_types_1.ALLOWED_SECTION_KEYS.join(', ')}.`, 'INVALID_SECTION_KEY');
        }
    }
}
exports.ContentService = ContentService;
//# sourceMappingURL=content.service.js.map