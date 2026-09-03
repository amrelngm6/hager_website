"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securePath = securePath;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function securePath(inputPath, baseDir, mustExist = true) {
    const base = mustExist
        ? fs_1.default.realpathSync(baseDir)
        : path_1.default.resolve(baseDir);
    const target = mustExist
        ? fs_1.default.realpathSync(inputPath)
        : path_1.default.resolve(inputPath);
    if (target !== base &&
        !target.startsWith(base + path_1.default.sep)) {
        throw new Error(`Path traversal detected: ${inputPath}`);
    }
    return target;
}
//# sourceMappingURL=securepath.helper.js.map