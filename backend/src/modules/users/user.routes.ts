import { Router, RequestHandler } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  CreateUserSchema,
  UpdateUserSchema,
  UpdateUserStatusSchema,
  ListUsersQuerySchema,
} from './user.types';
import { UserController } from './user.controller';
// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const router = Router();
const ctrl = new UserController();
/**
 * GET /api/v1/users
 * List all users within the authenticated user (paginated, filterable).
 * Accessible by: owner, admin, member
 */
router.get(
  '/',
  requireAuth,
  validate(ListUsersQuerySchema, { target: 'query' }),
  ctrl.list as RequestHandler,
);
/**
 * GET /api/v1/users/:id
 * Get a single user by ID (must belong to the same user).
 * Accessible by: owner, admin, member
 */
router.get(
  '/:id',
  requireAuth,
  ctrl.getById as RequestHandler,
);
/**
 * POST /api/v1/users
 * Create a new user within the authenticated user.
 * Accessible by: owner, admin
 */
router.post(
  '/',
  requireAuth,
  validate(CreateUserSchema),
  ctrl.create as RequestHandler,
);
/**
 * PUT /api/v1/users/:id
 * Update a user's profile fields (name, avatar, timezone, preferences).
 * Accessible by: owner, admin
 */
router.put(
  '/:id',
  requireAuth,
  validate(UpdateUserSchema),
  ctrl.update as RequestHandler,
);

/**
 * PATCH /api/v1/users/:id/status
 * Activate, deactivate, or ban a user.
 * Accessible by: owner, admin
 */
router.patch(
  '/:id/status',
  requireAuth,
  validate(UpdateUserStatusSchema),
  ctrl.updateStatus as RequestHandler,
);
/**
 * DELETE /api/v1/users/:id
 * Soft-delete a user from the user.
 * Accessible by: owner only
 */
router.delete(
  '/:id',
  requireAuth,
  ctrl.remove as RequestHandler,
);
export { router as usersRouter };