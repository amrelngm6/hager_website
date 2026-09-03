"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentController = void 0;
const content_service_1 = require("./content.service");
// ---------------------------------------------------------------------------
// ContentController
//
// Thin orchestration layer — no business logic, no SQL.
// ---------------------------------------------------------------------------
class ContentController {
    constructor() {
        // GET /content — public
        this.getAll = async (_req, res, next) => {
            try {
                const sections = await this.service.getAll();
                // Return as a key→data map for easy consumption by the theme's JS
                const map = {};
                for (const s of sections) {
                    map[s.section_key] = s.data;
                }
                res.status(200).json({ success: true, data: map });
            }
            catch (err) {
                next(err);
            }
        };
        // GET /content/:key — public
        this.getByKey = async (req, res, next) => {
            try {
                const section = await this.service.getByKey(req.params.key);
                res.status(200).json({ success: true, data: section });
            }
            catch (err) {
                next(err);
            }
        };
        // PUT /content/:key — protected
        this.update = async (req, res, next) => {
            try {
                if (!req.session?.user) {
                    res.status(401).json({ message: 'Unauthorized' });
                    return;
                }
                const section = await this.service.update(req.params.key, req.body.data, req.session.user);
                res.status(200).json({ success: true, data: section });
            }
            catch (err) {
                next(err);
            }
        };
        this.service = new content_service_1.ContentService();
    }
}
exports.ContentController = ContentController;
//# sourceMappingURL=content.controller.js.map