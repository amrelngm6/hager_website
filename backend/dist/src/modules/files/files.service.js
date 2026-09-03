"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractArchive = exports.compressEntries = exports.saveUploadedFiles = exports.getViewInfo = exports.getDownloadInfo = exports.setPermissions = exports.getPermissions = exports.copyEntry = exports.renameEntry = exports.bulkDeleteEntries = exports.deleteEntry = exports.createEmptyFile = exports.createDirectory = exports.writeFile = exports.readFile = exports.listDirectory = exports.resolveClientFilePath = exports.resolveSafePath = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// import extractZip from 'extract-zip';
// import * as tar from 'tar';
const archiver_helper_1 = __importDefault(require("../../helper/archiver.helper"));
const error_middleware_1 = require("../../middlewares/error.middleware");
const securepath_helper_1 = require("../../helper/securepath.helper");
const WEB_ROOT = process.env.WEB_ROOT || path_1.default.resolve(__dirname, '../../../webroot');
// npm install archiver extract-zip tar multer
// npm install -D @types/archiver @types/multer
/**
 * Resolve a user-supplied path to an absolute path within the allowed scope.
 * - Non-admin users: limited to their WEB_ROOT/<domain>/ directory
 * - Admin users: allowed to read/write anywhere under WEB_ROOT
 *
 * NOTE: this intentionally does NOT pre-strip "../" with a regex. A regex
 * like /\.\.\//g only matches ".." followed by a slash, so a bare trailing
 * ".." segment (e.g. "foo/..") slips through untouched and can walk a
 * path outside the sandbox once resolved. Instead we resolve the full
 * path first and then verify it is still inside the boundary directory,
 * which is the only reliable way to catch every traversal shape.
 */
const resolveSafePath = (sentFilePath, user) => {
    const filePath = (sentFilePath || '/').trim();
    const relative = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const resolvedPath = path_1.default.resolve(WEB_ROOT, relative);
    if (resolvedPath === WEB_ROOT || resolvedPath.startsWith(WEB_ROOT + path_1.default.sep)) {
        return (0, securepath_helper_1.securePath)(resolvedPath, WEB_ROOT);
    }
    throw (0, error_middleware_1.createError)(`Access denied: ${resolvedPath} is outside the allowed directory`, 403);
};
exports.resolveSafePath = resolveSafePath;
/** Resolve a file path for client (non-admin) users, sandboxed to their domain directory. */
const resolveClientFilePath = (domain, requestedPath) => {
    const baseDir = path_1.default.resolve(WEB_ROOT, domain);
    const relative = requestedPath.startsWith('/') ? requestedPath.slice(1) : requestedPath;
    const resolved = path_1.default.resolve(baseDir, relative);
    if (resolved !== baseDir && !resolved.startsWith(baseDir + path_1.default.sep)) {
        throw (0, error_middleware_1.createError)('Access denied: path is outside the allowed directory', 403);
    }
    return (0, securepath_helper_1.securePath)(resolved, WEB_ROOT);
};
exports.resolveClientFilePath = resolveClientFilePath;
const modeToOctal = (mode) => (mode & 0o777).toString(8).padStart(3, '0');
const listDirectory = async (dirPath, user) => {
    const safePath = (0, exports.resolveSafePath)(dirPath || '/', user);
    const entries = await promises_1.default.readdir(safePath, { withFileTypes: true });
    const stats = await Promise.all(entries.map(async (entry) => {
        const entryPath = path_1.default.join(safePath, entry.name);
        const stat = await promises_1.default.stat(entryPath).catch(() => null);
        return {
            name: entry.name,
            path: path_1.default.posix.join(dirPath, entry.name),
            type: (entry.isDirectory() ? 'directory' : 'file'),
            size: stat?.size ?? 0,
            modified: stat?.mtime ?? new Date(),
            permissions: stat ? modeToOctal(stat.mode) : '000',
        };
    }));
    return stats.sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'directory' ? -1 : 1);
};
exports.listDirectory = listDirectory;
const readFile = async (filePath, user) => {
    const safePath = (0, exports.resolveSafePath)(filePath, user);
    const stat = await promises_1.default.stat(safePath);
    if (stat.isDirectory())
        throw (0, error_middleware_1.createError)('Path is a directory', 400);
    if (stat.size > 5 * 1024 * 1024)
        throw (0, error_middleware_1.createError)('File too large to open (max 5MB)', 400);
    return promises_1.default.readFile(safePath, 'utf-8');
};
exports.readFile = readFile;
const writeFile = async (filePath, content, user) => {
    const safePath = (0, exports.resolveSafePath)(filePath, user);
    await promises_1.default.writeFile(safePath, content, 'utf-8');
};
exports.writeFile = writeFile;
const createDirectory = async (dirPath, user) => {
    const safePath = (0, exports.resolveSafePath)(dirPath, user);
    await promises_1.default.mkdir(safePath, { recursive: true });
};
exports.createDirectory = createDirectory;
const createEmptyFile = async (filePath, user) => {
    const safePath = (0, exports.resolveSafePath)(filePath, user);
    await promises_1.default.writeFile(safePath, '', { flag: 'wx' }).catch((err) => {
        if (err.code === 'EEXIST')
            throw (0, error_middleware_1.createError)('A file with that name already exists', 409);
        throw err;
    });
};
exports.createEmptyFile = createEmptyFile;
const deleteEntry = async (entryPath, user) => {
    const safePath = (0, exports.resolveSafePath)(entryPath, user);
    if (safePath === path_1.default.resolve(WEB_ROOT) || safePath === '/') {
        throw (0, error_middleware_1.createError)('Cannot delete root directory', 400);
    }
    await promises_1.default.rm(safePath, { recursive: true, force: false });
};
exports.deleteEntry = deleteEntry;
const bulkDeleteEntries = async (paths, user) => {
    const deleted = [];
    const failed = [];
    for (const p of paths) {
        try {
            await (0, exports.deleteEntry)(p, user);
            deleted.push(p);
        }
        catch (err) {
            failed.push({ path: p, error: err.message });
        }
    }
    return { deleted, failed };
};
exports.bulkDeleteEntries = bulkDeleteEntries;
const renameEntry = async (oldPath, newPath, user) => {
    const safeOld = (0, exports.resolveSafePath)(oldPath, user);
    const safeNew = (0, exports.resolveSafePath)(newPath, user);
    await promises_1.default.rename(safeOld, safeNew);
};
exports.renameEntry = renameEntry;
const copyEntry = async (sourcePath, destPath, user) => {
    const safeSrc = (0, exports.resolveSafePath)(sourcePath, user);
    const safeDest = (0, exports.resolveSafePath)(destPath, user);
    await promises_1.default.cp(safeSrc, safeDest, { recursive: true, errorOnExist: true, force: false });
};
exports.copyEntry = copyEntry;
const getPermissions = async (entryPath, user) => {
    const safePath = (0, exports.resolveSafePath)(entryPath, user);
    const stat = await promises_1.default.stat(safePath);
    return { path: entryPath, mode: modeToOctal(stat.mode), isDirectory: stat.isDirectory() };
};
exports.getPermissions = getPermissions;
const setPermissions = async (entryPath, mode, user, recursive = false) => {
    if (!/^[0-7]{3,4}$/.test(mode))
        throw (0, error_middleware_1.createError)('Invalid permission mode', 400);
    const safePath = (0, exports.resolveSafePath)(entryPath, user);
    const octal = parseInt(mode, 8);
    await promises_1.default.chmod(safePath, octal);
    if (recursive) {
        const stat = await promises_1.default.stat(safePath);
        if (stat.isDirectory())
            await chmodRecursive(safePath, octal);
    }
};
exports.setPermissions = setPermissions;
const chmodRecursive = async (dirPath, octal) => {
    const entries = await promises_1.default.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const entryPath = path_1.default.join(dirPath, entry.name);
        await promises_1.default.chmod(entryPath, octal);
        if (entry.isDirectory())
            await chmodRecursive(entryPath, octal);
    }
};
const getDownloadInfo = async (filePath, user) => {
    const safePath = (0, exports.resolveSafePath)(filePath, user);
    const stat = await promises_1.default.stat(safePath);
    if (stat.isDirectory())
        throw (0, error_middleware_1.createError)('Cannot download a directory directly — compress it first', 400);
    return { safePath, name: path_1.default.basename(safePath), size: stat.size };
};
exports.getDownloadInfo = getDownloadInfo;
/** Same as getDownloadInfo but intended for inline preview (e.g. media library thumbnails). */
const getViewInfo = async (filePath, user) => {
    const safePath = (0, exports.resolveSafePath)(filePath, user);
    const stat = await promises_1.default.stat(safePath);
    if (stat.isDirectory())
        throw (0, error_middleware_1.createError)('Cannot view a directory', 400);
    return { safePath, name: path_1.default.basename(safePath) };
};
exports.getViewInfo = getViewInfo;
const saveUploadedFiles = async (destDir, files, user) => {
    const safeDestDir = (0, exports.resolveSafePath)(destDir, user);
    const dirStat = await promises_1.default.stat(safeDestDir).catch(() => null);
    if (!dirStat || !dirStat.isDirectory()) {
        await Promise.all(files.map((f) => promises_1.default.unlink(f.path).catch(() => { })));
        throw (0, error_middleware_1.createError)('Destination is not a valid directory', 400);
    }
    const saved = [];
    const failed = [];
    for (const file of files) {
        try {
            const safeName = path_1.default.basename(file.originalname);
            if (!safeName || safeName === '.' || safeName === '..')
                throw new Error('Invalid file name');
            const targetPath = path_1.default.join(safeDestDir, safeName);
            if (targetPath !== safeDestDir && !targetPath.startsWith(safeDestDir + path_1.default.sep)) {
                throw new Error('Invalid file name');
            }
            await promises_1.default.rename(file.path, targetPath);
            saved.push(path_1.default.posix.join(destDir, safeName));
        }
        catch (err) {
            failed.push({ name: file.originalname, error: err.message });
            await promises_1.default.unlink(file.path).catch(() => { });
        }
    }
    return { saved, failed };
};
exports.saveUploadedFiles = saveUploadedFiles;
const compressEntries = async (entryPaths, destPath, format, user) => {
    const safeDest = (0, exports.resolveSafePath)(destPath, user);
    const safeEntries = entryPaths.map((p) => (0, exports.resolveSafePath)(p, user));
    await promises_1.default.mkdir(path_1.default.dirname(safeDest), { recursive: true }).catch(() => { });
    await new Promise(async (resolve, reject) => {
        const output = fs_1.default.createWriteStream(safeDest);
        output.on('close', () => resolve());
        output.on('error', reject);
        format === 'zip' ? await (0, archiver_helper_1.default)(safeDest, safeEntries, 'zip', { zlib: { level: 9 } }) : await (0, archiver_helper_1.default)(safeDest, safeEntries, 'tar', { gzip: true });
    });
};
exports.compressEntries = compressEntries;
const extractArchive = async (archivePath, destDir, user) => {
    const safeArchive = (0, exports.resolveSafePath)(archivePath, user);
    const safeDest = (0, exports.resolveSafePath)(destDir, user);
    const destStat = await promises_1.default.stat(safeDest).catch(() => null);
    if (!destStat || !destStat.isDirectory())
        throw (0, error_middleware_1.createError)('Destination is not a valid directory', 400);
    const lower = safeArchive.toLowerCase();
    throw (0, error_middleware_1.createError)('Unsupported archive format. Use .zip, .tar, .tar.gz, or .tgz', 400);
};
exports.extractArchive = extractArchive;
//# sourceMappingURL=files.service.js.map