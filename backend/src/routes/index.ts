import { Router, Request, Response } from 'express';
// ---------------------------------------------------------------------------
// Module router imports — uncomment as each module is implemented
// ---------------------------------------------------------------------------
import { authRouter } from '../core/auth/auth.routes';
import { usersRouter } from '../modules/users/user.routes';
import { contentRouter } from '../modules/content/content.routes';
import { filesRouter } from '../modules/files/files.routes';
const apiRouter = Router();
// ---------------------------------------------------------------------------
// Health check — no auth required
// ---------------------------------------------------------------------------
apiRouter.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: 'development',
        },
    });
});
// ---------------------------------------------------------------------------
// Module routes — mounted under /api/v1
// ---------------------------------------------------------------------------
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/content', contentRouter);
apiRouter.use('/files', filesRouter);

export default apiRouter;