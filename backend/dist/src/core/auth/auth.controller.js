"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.me = exports.logout = exports.login = void 0;
const auth_service_1 = require("./auth.service");
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        const user = await (0, auth_service_1.loginUser)(email.trim().toLowerCase(), password);
        req.session.regenerate((err) => {
            if (err)
                return next(err);
            req.session.user = user;
            req.session.save((err2) => {
                if (err2)
                    return next(err2);
                res.json({ user });
            });
        });
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
const logout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err)
            return next(err);
        res.clearCookie('mcpanel.sid');
        res.json({ message: 'Logged out' });
    });
};
exports.logout = logout;
const me = (req, res) => {
    res.json({ user: req.user });
};
exports.me = me;
const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: 'currentPassword and newPassword are required' });
            return;
        }
        await (0, auth_service_1.changePassword)(req.user.id, currentPassword, newPassword);
        res.json({ message: 'Password updated successfully' });
    }
    catch (err) {
        next(err);
    }
};
exports.updatePassword = updatePassword;
//# sourceMappingURL=auth.controller.js.map