"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// ---------------------------------------------------------------------------
// Module router imports — uncomment as each module is implemented
// ---------------------------------------------------------------------------
const auth_routes_1 = require("../core/auth/auth.routes");
const user_routes_1 = require("../modules/users/user.routes");
const content_routes_1 = require("../modules/content/content.routes");
const files_routes_1 = require("../modules/files/files.routes");
const apiRouter = (0, express_1.Router)();
// ---------------------------------------------------------------------------
// Health check — no auth required
// ---------------------------------------------------------------------------
apiRouter.get('/health', (_req, res) => {
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
apiRouter.use('/auth', auth_routes_1.authRouter);
apiRouter.use('/users', user_routes_1.usersRouter);
apiRouter.use('/content', content_routes_1.contentRouter);
apiRouter.use('/files', files_routes_1.filesRouter);
exports.default = apiRouter;
//# sourceMappingURL=index.js.map