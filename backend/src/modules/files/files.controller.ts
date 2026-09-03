import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import {
  listDirectory,
  readFile,
  writeFile,
  createDirectory,
  createEmptyFile,
  deleteEntry,
  bulkDeleteEntries,
  renameEntry,
  copyEntry,
  getPermissions,
  setPermissions,
  getDownloadInfo,
  compressEntries,
  extractArchive,
} from './files.service';

export const list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dirPath = (req.query.path as string) ?? '/';
    const entries = await listDirectory(dirPath, req.user!);
    res.json({ entries });
  } catch (err) {
    next(err);
  }
};

export const read = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ message: 'path is required' });
      return;
    }
    const content = await readFile(filePath, req.user!);
    res.json({ content });
  } catch (err) {
    next(err);
  }
};

export const write = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { path: filePath, content } = req.body as { path?: string; content?: string };
    if (!filePath || content === undefined) {
      res.status(400).json({ message: 'path and content are required' });
      return;
    }
    await writeFile(filePath, content, req.user!);
    res.json({ message: 'File saved' });
  } catch (err) {
    next(err);
  }
};

export const mkdir = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { path: dirPath } = req.body as { path?: string };
    if (!dirPath) {
      res.status(400).json({ message: 'path is required' });
      return;
    }
    await createDirectory(dirPath, req.user!);
    res.status(201).json({ message: 'Directory created' });
  } catch (err) {
    next(err);
  }
};

export const createFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { path: filePath } = req.body as { path?: string };
    if (!filePath) {
      res.status(400).json({ message: 'path is required' });
      return;
    }
    await createEmptyFile(filePath, req.user!);
    res.status(201).json({ message: 'File created' });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const entryPath = req.query.path as string;
    if (!entryPath) {
      res.status(400).json({ message: 'path is required' });
      return;
    }
    await deleteEntry(entryPath, req.user!);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

export const bulkRemove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { paths } = req.body as { paths?: string[] };
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      res.status(400).json({ message: 'paths array is required' });
      return;
    }
    const result = await bulkDeleteEntries(paths, req.user!);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const rename = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { oldPath, newPath } = req.body as { oldPath?: string; newPath?: string };
    if (!oldPath || !newPath) {
      res.status(400).json({ message: 'oldPath and newPath are required' });
      return;
    }
    await renameEntry(oldPath, newPath, req.user!);
    res.json({ message: 'Renamed' });
  } catch (err) {
    next(err);
  }
};

export const copy = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sourcePath, destPath } = req.body as { sourcePath?: string; destPath?: string };
    if (!sourcePath || !destPath) {
      res.status(400).json({ message: 'sourcePath and destPath are required' });
      return;
    }
    await copyEntry(sourcePath, destPath, req.user!);
    res.status(201).json({ message: 'Copied' });
  } catch (err) {
    next(err);
  }
};

export const getPerms = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const entryPath = req.query.path as string;
    if (!entryPath) {
      res.status(400).json({ message: 'path is required' });
      return;
    }
    const result = await getPermissions(entryPath, req.user!);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const setPerms = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { path: entryPath, mode, recursive } = req.body as { path?: string; mode?: string; recursive?: boolean };
    if (!entryPath || !mode) {
      res.status(400).json({ message: 'path and mode are required' });
      return;
    }
    await setPermissions(entryPath, mode, req.user!, !!recursive);
    res.json({ message: 'Permissions updated' });
  } catch (err) {
    next(err);
  }
};

export const download = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ message: 'path is required' });
      return;
    }
    const { safePath, name } = await getDownloadInfo(filePath, req.user!);
    res.download(safePath, name);
  } catch (err) {
    next(err);
  }
};

export const upload = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  // try {
  //   const destDir = (req.body?.path as string) ?? '/';
  //   const files = (req.files as Express.Multer.File[]) ?? [];
  //   if (!files.length) {
  //     res.status(400).json({ message: 'No files provided' });
  //     return;
  //   }
  //   const result = await saveUploadedFiles(destDir, files, req.user!);
  //   res.status(201).json(result);
  // } catch (err) {
  //   next(err);
  // }
};

export const compress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { paths, destPath, format } = req.body as {
      paths?: string[];
      destPath?: string;
      format?: 'zip' | 'tar.gz';
    };
    if (!paths?.length || !destPath || !format) {
      res.status(400).json({ message: 'paths, destPath and format are required' });
      return;
    }
    await compressEntries(paths, destPath, format, req.user!);
    res.status(201).json({ message: 'Archive created' });
  } catch (err) {
    next(err);
  }
};

export const extract = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { path: archivePath, destDir } = req.body as { path?: string; destDir?: string };
    if (!archivePath || !destDir) {
      res.status(400).json({ message: 'path and destDir are required' });
      return;
    }
    await extractArchive(archivePath, destDir, req.user!);
    res.status(201).json({ message: 'Archive extracted' });
  } catch (err) {
    next(err);
  }
};
