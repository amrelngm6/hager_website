import { Router } from 'express';
import { login, logout, me, updatePassword } from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/login', authRateLimiter, login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);
router.put('/password', requireAuth, authRateLimiter, updatePassword);

export default router;
export { router as authRouter };
