"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extract = exports.compress = exports.upload = exports.view = exports.download = exports.setPerms = exports.getPerms = exports.copy = exports.rename = exports.bulkRemove = exports.remove = exports.createFile = exports.mkdir = exports.write = exports.read = exports.list = void 0;
const files_service_1 = require("./files.service");
const list = async (req, res, next) => {
    try {
        const dirPath = req.query.path ?? '/';
        const entries = await (0, files_service_1.listDirectory)(dirPath, req.user);
        res.json({ entries });
    }
    catch (err) {
        next(err);
    }
};
exports.list = list;
const read = async (req, res, next) => {
    try {
        const filePath = req.query.path;
        if (!filePath) {
            res.status(400).json({ message: 'path is required' });
            return;
        }
        const content = await (0, files_service_1.readFile)(filePath, req.user);
        res.json({ content });
    }
    catch (err) {
        next(err);
    }
};
exports.read = read;
const write = async (req, res, next) => {
    try {
        const { path: filePath, content } = req.body;
        if (!filePath || content === undefined) {
            res.status(400).json({ message: 'path and content are required' });
            return;
        }
        await (0, files_service_1.writeFile)(filePath, content, req.user);
        res.json({ message: 'File saved' });
    }
    catch (err) {
        next(err);
    }
};
exports.write = write;
const mkdir = async (req, res, next) => {
    try {
        const { path: dirPath } = req.body;
        if (!dirPath) {
            res.status(400).json({ message: 'path is required' });
            return;
        }
        await (0, files_service_1.createDirectory)(dirPath, req.user);
        res.status(201).json({ message: 'Directory created' });
    }
    catch (err) {
        next(err);
    }
};
exports.mkdir = mkdir;
const createFile = async (req, res, next) => {
    try {
        const { path: filePath } = req.body;
        if (!filePath) {
            res.status(400).json({ message: 'path is required' });
            return;
        }
        await (0, files_service_1.createEmptyFile)(filePath, req.user);
        res.status(201).json({ message: 'File created' });
    }
    catch (err) {
        next(err);
    }
};
exports.createFile = createFile;
const remove = async (req, res, next) => {
    try {
        const entryPath = req.query.path;
        if (!entryPath) {
            res.status(400).json({ message: 'path is required' });
            return;
        }
        await (0, files_service_1.deleteEntry)(entryPath, req.user);
        res.json({ message: 'Deleted' });
    }
    catch (err) {
        next(err);
    }
};
exports.remove = remove;
const bulkRemove = async (req, res, next) => {
    try {
        const { paths } = req.body;
        if (!paths || !Array.isArray(paths) || paths.length === 0) {
            res.status(400).json({ message: 'paths array is required' });
            return;
        }
        const result = await (0, files_service_1.bulkDeleteEntries)(paths, req.user);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
};
exports.bulkRemove = bulkRemove;
const rename = async (req, res, next) => {
    try {
        const { oldPath, newPath } = req.body;
        if (!oldPath || !newPath) {
            res.status(400).json({ message: 'oldPath and newPath are required' });
            return;
        }
        await (0, files_service_1.renameEntry)(oldPath, newPath, req.user);
        res.json({ message: 'Renamed' });
    }
    catch (err) {
        next(err);
    }
};
exports.rename = rename;
const copy = async (req, res, next) => {
    try {
        const { sourcePath, destPath } = req.body;
        if (!sourcePath || !destPath) {
            res.status(400).json({ message: 'sourcePath and destPath are required' });
            return;
        }
        await (0, files_service_1.copyEntry)(sourcePath, destPath, req.user);
        res.status(201).json({ message: 'Copied' });
    }
    catch (err) {
        next(err);
    }
};
exports.copy = copy;
const getPerms = async (req, res, next) => {
    try {
        const entryPath = req.query.path;
        if (!entryPath) {
            res.status(400).json({ message: 'path is required' });
            return;
        }
        const result = await (0, files_service_1.getPermissions)(entryPath, req.user);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
};
exports.getPerms = getPerms;
const setPerms = async (req, res, next) => {
    try {
        const { path: entryPath, mode, recursive } = req.body;
        if (!entryPath || !mode) {
            res.status(400).json({ message: 'path and mode are required' });
            return;
        }
        await (0, files_service_1.setPermissions)(entryPath, mode, req.user, !!recursive);
        res.json({ message: 'Permissions updated' });
    }
    catch (err) {
        next(err);
    }
};
exports.setPerms = setPerms;
const download = async (req, res, next) => {
    try {
        const filePath = req.query.path;
        if (!filePath) {
            res.status(400).json({ message: 'path is required' });
            return;
        }
        const { safePath, name } = await (0, files_service_1.getDownloadInfo)(filePath, req.user);
        res.download(safePath, name);
    }
    catch (err) {
        next(err);
    }
};
exports.download = download;
const view = async (req, res, next) => {
    try {
        const filePath = req.query.path;
        if (!filePath) {
            res.status(400).json({ message: 'path is required' });
            return;
        }
        const { safePath, name } = await (0, files_service_1.getViewInfo)(filePath, req.user);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(name)}"`);
        res.sendFile(safePath);
    }
    catch (err) {
        next(err);
    }
};
exports.view = view;
const upload = async (req, res, next) => {
    try {
        const destDir = req.body?.path ?? '/';
        const files = req.files ?? [];
        if (!files.length) {
            res.status(400).json({ message: 'No files provided' });
            return;
        }
        const result = await (0, files_service_1.saveUploadedFiles)(destDir, files, req.user);
        res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
};
exports.upload = upload;
const compress = async (req, res, next) => {
    try {
        const { paths, destPath, format } = req.body;
        if (!paths?.length || !destPath || !format) {
            res.status(400).json({ message: 'paths, destPath and format are required' });
            return;
        }
        await (0, files_service_1.compressEntries)(paths, destPath, format, req.user);
        res.status(201).json({ message: 'Archive created' });
    }
    catch (err) {
        next(err);
    }
};
exports.compress = compress;
const extract = async (req, res, next) => {
    try {
        const { path: archivePath, destDir } = req.body;
        if (!archivePath || !destDir) {
            res.status(400).json({ message: 'path and destDir are required' });
            return;
        }
        await (0, files_service_1.extractArchive)(archivePath, destDir, req.user);
        res.status(201).json({ message: 'Archive extracted' });
    }
    catch (err) {
        next(err);
    }
};
exports.extract = extract;
//# sourceMappingURL=files.controller.js.map