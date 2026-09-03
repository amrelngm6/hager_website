import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import {
  list,
  read,
  write,
  mkdir,
  createFile,
  remove,
  bulkRemove,
  rename,
  copy,
  getPerms,
  setPerms,
  download,
  view,
  compress,
  extract,
  upload,
} from './files.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

// Uploads land in the OS temp dir first; files.service moves each one into
// its validated destination and deletes anything that fails validation.
const uploadMiddleware = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 200 * 1024 * 1024, files: 25 },
});

// Browsing & basic CRUD
router.get('/', list);
router.get('/read', read);
router.put('/write', write);
router.post('/mkdir', mkdir);
router.post('/touch', createFile);
router.delete('/', remove);
router.post('/bulk-delete', bulkRemove);
router.patch('/rename', rename);
router.post('/copy', copy);

// Permissions
router.get('/permissions', getPerms);
router.put('/permissions', setPerms);

// Transfer
router.get('/download', download);
router.get('/view', view);
router.post('/upload', uploadMiddleware.array('files', 25), upload);

// Archives
router.post('/compress', compress);
router.post('/extract', extract);

export { router as filesRouter };
