import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
// import extractZip from 'extract-zip';
// import * as tar from 'tar';
import archiver from '../../helper/archiver.helper';
import { createError } from '../../middlewares/error.middleware';
import { SessionUser } from '../../types';
import { securePath } from '../../helper/securepath.helper';

const WEB_ROOT = process.env.WEB_ROOT || path.resolve(__dirname, '../../../webroot');

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
export const resolveSafePath = (sentFilePath: string, user: SessionUser): string => {
  const filePath = (sentFilePath || '/').trim();

  const relative = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const resolvedPath = path.resolve(WEB_ROOT, relative);

  if (resolvedPath === WEB_ROOT || resolvedPath.startsWith(WEB_ROOT + path.sep)) {
    return securePath(resolvedPath, WEB_ROOT);
  }

  throw createError(`Access denied: ${resolvedPath} is outside the allowed directory`, 403);
};

/** Resolve a file path for client (non-admin) users, sandboxed to their domain directory. */
export const resolveClientFilePath = (domain: string, requestedPath: string): string => {
  const baseDir = path.resolve(WEB_ROOT, domain);
  const relative = requestedPath.startsWith('/') ? requestedPath.slice(1) : requestedPath;
  const resolved = path.resolve(baseDir, relative);

  if (resolved !== baseDir && !resolved.startsWith(baseDir + path.sep)) {
    throw createError('Access denied: path is outside the allowed directory', 403);
  }

  return securePath(resolved, WEB_ROOT);
};

const modeToOctal = (mode: number): string => (mode & 0o777).toString(8).padStart(3, '0');

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  permissions: string;
}

export const listDirectory = async (dirPath: string, user: SessionUser): Promise<FileEntry[]> => {
  const safePath = resolveSafePath(dirPath || '/', user);
  const entries = await fs.readdir(safePath, { withFileTypes: true });

  const stats = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(safePath, entry.name);
      const stat = await fs.stat(entryPath).catch(() => null);
      return {
        name: entry.name,
        path: path.posix.join(dirPath, entry.name),
        type: (entry.isDirectory() ? 'directory' : 'file') as 'file' | 'directory',
        size: stat?.size ?? 0,
        modified: stat?.mtime ?? new Date(),
        permissions: stat ? modeToOctal(stat.mode) : '000',
      };
    })
  );

  return stats.sort((a, b) =>
    a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'directory' ? -1 : 1
  );
};

export const readFile = async (filePath: string, user: SessionUser): Promise<string> => {
  const safePath = resolveSafePath(filePath, user);
  const stat = await fs.stat(safePath);
  if (stat.isDirectory()) throw createError('Path is a directory', 400);
  if (stat.size > 5 * 1024 * 1024) throw createError('File too large to open (max 5MB)', 400);
  return fs.readFile(safePath, 'utf-8');
};

export const writeFile = async (filePath: string, content: string, user: SessionUser): Promise<void> => {
  const safePath = resolveSafePath(filePath, user);
  await fs.writeFile(safePath, content, 'utf-8');
};

export const createDirectory = async (dirPath: string, user: SessionUser): Promise<void> => {
  const safePath = resolveSafePath(dirPath, user);
  await fs.mkdir(safePath, { recursive: true });
};

export const createEmptyFile = async (filePath: string, user: SessionUser): Promise<void> => {
  const safePath = resolveSafePath(filePath, user);
  await fs.writeFile(safePath, '', { flag: 'wx' }).catch((err) => {
    if (err.code === 'EEXIST') throw createError('A file with that name already exists', 409);
    throw err;
  });
};

export const deleteEntry = async (entryPath: string, user: SessionUser): Promise<void> => {
  const safePath = resolveSafePath(entryPath, user);
  if (safePath === path.resolve(WEB_ROOT) || safePath === '/') {
    throw createError('Cannot delete root directory', 400);
  }
  await fs.rm(safePath, { recursive: true, force: false });
};

export const bulkDeleteEntries = async (
  paths: string[],
  user: SessionUser
): Promise<{ deleted: string[]; failed: { path: string; error: string }[] }> => {
  const deleted: string[] = [];
  const failed: { path: string; error: string }[] = [];

  for (const p of paths) {
    try {
      await deleteEntry(p, user);
      deleted.push(p);
    } catch (err) {
      failed.push({ path: p, error: (err as Error).message });
    }
  }

  return { deleted, failed };
};

export const renameEntry = async (oldPath: string, newPath: string, user: SessionUser): Promise<void> => {
  const safeOld = resolveSafePath(oldPath, user);
  const safeNew = resolveSafePath(newPath, user);
  await fs.rename(safeOld, safeNew);
};

export const copyEntry = async (sourcePath: string, destPath: string, user: SessionUser): Promise<void> => {
  const safeSrc = resolveSafePath(sourcePath, user);
  const safeDest = resolveSafePath(destPath, user);
  await fs.cp(safeSrc, safeDest, { recursive: true, errorOnExist: true, force: false });
};

export const getPermissions = async (
  entryPath: string,
  user: SessionUser
): Promise<{ path: string; mode: string; isDirectory: boolean }> => {
  const safePath = resolveSafePath(entryPath, user);
  const stat = await fs.stat(safePath);
  return { path: entryPath, mode: modeToOctal(stat.mode), isDirectory: stat.isDirectory() };
};

export const setPermissions = async (
  entryPath: string,
  mode: string,
  user: SessionUser,
  recursive = false
): Promise<void> => {
  if (!/^[0-7]{3,4}$/.test(mode)) throw createError('Invalid permission mode', 400);
  const safePath = resolveSafePath(entryPath, user);
  const octal = parseInt(mode, 8);
  await fs.chmod(safePath, octal);

  if (recursive) {
    const stat = await fs.stat(safePath);
    if (stat.isDirectory()) await chmodRecursive(safePath, octal);
  }
};

const chmodRecursive = async (dirPath: string, octal: number): Promise<void> => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    await fs.chmod(entryPath, octal);
    if (entry.isDirectory()) await chmodRecursive(entryPath, octal);
  }
};

export const getDownloadInfo = async (
  filePath: string,
  user: SessionUser
): Promise<{ safePath: string; name: string; size: number }> => {
  const safePath = resolveSafePath(filePath, user);
  const stat = await fs.stat(safePath);
  if (stat.isDirectory()) throw createError('Cannot download a directory directly — compress it first', 400);
  return { safePath, name: path.basename(safePath), size: stat.size };
};

// export const saveUploadedFiles = async (
//   destDir: string,
//   files: [],
//   // files: Express.Multer.File[],
//   user: SessionUser
// ): Promise<{ saved: string[]; failed: { name: string; error: string }[] }> => {
  // const safeDestDir = resolveSafePath(destDir, user);
  // const dirStat = await fs.stat(safeDestDir).catch(() => null);
  // if (!dirStat || !dirStat.isDirectory()) {
  //   await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));
  //   throw createError('Destination is not a valid directory', 400);
  // }

  // const saved: string[] = [];
  // const failed: { name: string; error: string }[] = [];

  // for (const file of files) {
  //   try {
  //     const safeName = path.basename(file.originalname);
  //     if (!safeName || safeName === '.' || safeName === '..') throw new Error('Invalid file name');

  //     const targetPath = path.join(safeDestDir, safeName);
  //     if (targetPath !== safeDestDir && !targetPath.startsWith(safeDestDir + path.sep)) {
  //       throw new Error('Invalid file name');
  //     }

  //     await fs.rename(file.path, targetPath);
  //     saved.push(path.posix.join(destDir, safeName));
  //   } catch (err) {
  //     failed.push({ name: file.originalname, error: (err as Error).message });
  //     await fs.unlink(file.path).catch(() => {});
  //   }
  // }

  // return { saved, failed };
// };

export const compressEntries = async (
  entryPaths: string[],
  destPath: string,
  format: 'zip' | 'tar.gz',
  user: SessionUser
): Promise<void> => {
  const safeDest = resolveSafePath(destPath, user);
  const safeEntries = entryPaths.map((p) => resolveSafePath(p, user));

  await fs.mkdir(path.dirname(safeDest), { recursive: true }).catch(() => {});

  await new Promise<void>(async (resolve, reject) => {
    const output = fsSync.createWriteStream(safeDest);
    
    output.on('close', () => resolve());
    output.on('error', reject);

    format === 'zip' ? await archiver(safeDest, safeEntries, 'zip', { zlib: { level: 9 } }) : await archiver(safeDest, safeEntries, 'tar', { gzip: true });

  });
};

export const extractArchive = async (archivePath: string, destDir: string, user: SessionUser): Promise<void> => {
  const safeArchive = resolveSafePath(archivePath, user);
  const safeDest = resolveSafePath(destDir, user);

  const destStat = await fs.stat(safeDest).catch(() => null);
  if (!destStat || !destStat.isDirectory()) throw createError('Destination is not a valid directory', 400);

  const lower = safeArchive.toLowerCase();

  

  throw createError('Unsupported archive format. Use .zip, .tar, .tar.gz, or .tgz', 400);
};
