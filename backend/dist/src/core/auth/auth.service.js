"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.loginUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const pool_1 = require("../database/pool");
const error_middleware_1 = require("../../middlewares/error.middleware");
const loginUser = async (emailOrUsername, password) => {
    // Rewritten as a parameterized query. The original built this string via
    // concatenation of raw user input, which was a SQL injection vulnerability
    // (and used double-quoted string literals, which aren't valid MySQL syntax
    // by default anyway). Never interpolate user input into SQL text.
    const user = await (0, pool_1.queryOne)(`SELECT * FROM users WHERE (email = ?)`, [emailOrUsername]);
    if (!user) {
        throw (0, error_middleware_1.createError)('User not found', 401);
    }
    if (!user.is_active) {
        throw (0, error_middleware_1.createError)('User is inactive', 403);
    }
    const valid = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!valid) {
        throw (0, error_middleware_1.createError)('Invalid password', 401);
    }
    return {
        id: user.id,
        username: user.username,
        email: user.email,
    };
};
exports.loginUser = loginUser;
const changePassword = async (userId, currentPassword, newPassword) => {
    if (newPassword.length < 8) {
        throw (0, error_middleware_1.createError)('New password must be at least 8 characters', 400);
    }
    const user = await (0, pool_1.queryOne)('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
        throw (0, error_middleware_1.createError)('User not found', 404);
    }
    const valid = await bcryptjs_1.default.compare(currentPassword, user.password_hash);
    if (!valid) {
        throw (0, error_middleware_1.createError)('Current password is incorrect', 400);
    }
    const hash = await bcryptjs_1.default.hash(newPassword, 12);
    await (0, pool_1.query)('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
};
exports.changePassword = changePassword;
//# sourceMappingURL=auth.service.js.map