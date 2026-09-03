"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const requireAuth = (req, res, next) => {
    if (!req.session?.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    req.user = req.session.user;
    next();
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=auth.middleware.js.map