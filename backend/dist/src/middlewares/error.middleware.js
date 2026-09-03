"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.errorHandler = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const errorHandler = (err, _req, res, _next) => {
    const status = err.status ?? 500;
    const message = err.message;
    // status === 500 && process.env.NODE_ENV === 'production'
    //   ? 'Internal server error'
    //   : err.message;
    if (status >= 500) {
        console.error('[Error]', err);
    }
    res.status(status).json({ message });
};
exports.errorHandler = errorHandler;
const createError = (message, status) => {
    const err = new Error(message);
    err.status = status;
    return err;
};
exports.createError = createError;
//# sourceMappingURL=error.middleware.js.map