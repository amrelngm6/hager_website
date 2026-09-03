"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const content_types_1 = require("./content.types");
const content_controller_1 = require("./content.controller");
// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const router = (0, express_1.Router)();
exports.contentRouter = router;
const ctrl = new content_controller_1.ContentController();
/**
 * GET /api/v1/content
 * Returns all content sections as a key→data map.
 * Public — no authentication required (consumed by theme/index.html).
 */
router.get('/', ctrl.getAll);
/**
 * GET /api/v1/content/:key
 * Returns a single content section by key.
 * Public — no authentication required.
 */
router.get('/:key', ctrl.getByKey);
/**
 * PUT /api/v1/content/:key
 * Replace the data of a single content section.
 * Protected — requires a valid session.
 */
router.put('/:key', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(content_types_1.UpdateContentSchema), ctrl.update);
//# sourceMappingURL=content.routes.js.map