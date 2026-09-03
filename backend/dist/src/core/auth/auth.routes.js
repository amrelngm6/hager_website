"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const rateLimiter_middleware_1 = require("../../middlewares/rateLimiter.middleware");
const router = (0, express_1.Router)();
exports.authRouter = router;
router.post('/login', rateLimiter_middleware_1.authRateLimiter, auth_controller_1.login);
router.post('/logout', auth_middleware_1.requireAuth, auth_controller_1.logout);
router.get('/me', auth_middleware_1.requireAuth, auth_controller_1.me);
router.put('/password', auth_middleware_1.requireAuth, rateLimiter_middleware_1.authRateLimiter, auth_controller_1.updatePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map