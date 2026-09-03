"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const user_types_1 = require("./user.types");
const user_controller_1 = require("./user.controller");
// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const router = (0, express_1.Router)();
exports.usersRouter = router;
const ctrl = new user_controller_1.UserController();
/**
 * GET /api/v1/users
 * List all users within the authenticated user (paginated, filterable).
 * Accessible by: owner, admin, member
 */
router.get('/', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(user_types_1.ListUsersQuerySchema, { target: 'query' }), ctrl.list);
/**
 * GET /api/v1/users/:id
 * Get a single user by ID (must belong to the same user).
 * Accessible by: owner, admin, member
 */
router.get('/:id', auth_middleware_1.requireAuth, ctrl.getById);
/**
 * POST /api/v1/users
 * Create a new user within the authenticated user.
 * Accessible by: owner, admin
 */
router.post('/', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(user_types_1.CreateUserSchema), ctrl.create);
/**
 * PUT /api/v1/users/:id
 * Update a user's profile fields (name, avatar, timezone, preferences).
 * Accessible by: owner, admin
 */
router.put('/:id', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(user_types_1.UpdateUserSchema), ctrl.update);
/**
 * PATCH /api/v1/users/:id/status
 * Activate, deactivate, or ban a user.
 * Accessible by: owner, admin
 */
router.patch('/:id/status', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(user_types_1.UpdateUserStatusSchema), ctrl.updateStatus);
/**
 * DELETE /api/v1/users/:id
 * Soft-delete a user from the user.
 * Accessible by: owner only
 */
router.delete('/:id', auth_middleware_1.requireAuth, ctrl.remove);
//# sourceMappingURL=user.routes.js.map