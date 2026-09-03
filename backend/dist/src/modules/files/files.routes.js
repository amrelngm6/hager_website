"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filesRouter = void 0;
const express_1 = require("express");
// import multer from 'multer';
// import os from 'os';
const files_controller_1 = require("./files.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
exports.filesRouter = router;
router.use(auth_middleware_1.requireAuth);
// Uploads land in the OS temp dir first; files.service moves each one into
// its validated destination and deletes anything that fails validation.
// const uploadMiddleware = multer({
//   dest: os.tmpdir(),
//   limits: { fileSize: 200 * 1024 * 1024, files: 25 },
// });
// Browsing & basic CRUD
router.get('/', files_controller_1.list);
router.get('/read', files_controller_1.read);
router.put('/write', files_controller_1.write);
router.post('/mkdir', files_controller_1.mkdir);
router.post('/touch', files_controller_1.createFile);
router.delete('/', files_controller_1.remove);
router.post('/bulk-delete', files_controller_1.bulkRemove);
router.patch('/rename', files_controller_1.rename);
router.post('/copy', files_controller_1.copy);
// Permissions
router.get('/permissions', files_controller_1.getPerms);
router.put('/permissions', files_controller_1.setPerms);
// Transfer
router.get('/download', files_controller_1.download);
// router.post('/upload', uploadMiddleware.array('files', 25), upload);
// Archives
router.post('/compress', files_controller_1.compress);
router.post('/extract', files_controller_1.extract);
//# sourceMappingURL=files.routes.js.map