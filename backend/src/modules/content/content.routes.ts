import { Router, RequestHandler } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { UpdateContentSchema } from './content.types';
import { ContentController } from './content.controller';

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const router = Router();
const ctrl = new ContentController();

/**
 * GET /api/v1/content
 * Returns all content sections as a key→data map.
 * Public — no authentication required (consumed by theme/index.html).
 */
router.get('/', ctrl.getAll as RequestHandler);

/**
 * GET /api/v1/content/:key
 * Returns a single content section by key.
 * Public — no authentication required.
 */
router.get('/:key', ctrl.getByKey as RequestHandler);

/**
 * PUT /api/v1/content/:key
 * Replace the data of a single content section.
 * Protected — requires a valid session.
 */
router.put(
  '/:key',
  requireAuth,
  validate(UpdateContentSchema),
  ctrl.update as RequestHandler,
);

export { router as contentRouter };
