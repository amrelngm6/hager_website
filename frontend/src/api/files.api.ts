import client from './client';

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: string;
  permissions: string; // octal, e.g. "755"
}

export interface PermissionsInfo {
  path: string;
  mode: string;
  isDirectory: boolean;
}

export interface BulkResult {
  deleted: string[];
  failed: { path: string; error: string }[];
}

export interface UploadResult {
  saved: string[];
  failed: { name: string; error: string }[];
}

export const filesApi = {
  list: (path?: string) => client.get<{ entries: FileEntry[] }>('/files', { params: { path } }),

  read: (path: string) => client.get<{ content: string }>('/files/read', { params: { path } }),

  write: (path: string, content: string) => client.put('/files/write', { path, content }),

  mkdir: (path: string) => client.post('/files/mkdir', { path }),

  touch: (path: string) => client.post('/files/touch', { path }),

  delete: (path: string) => client.delete('/files', { params: { path } }),

  bulkDelete: (paths: string[]) => client.post<BulkResult>('/files/bulk-delete', { paths }),

  rename: (oldPath: string, newPath: string) => client.patch('/files/rename', { oldPath, newPath }),

  move: (oldPath: string, newPath: string) => client.patch('/files/rename', { oldPath, newPath }),

  copy: (sourcePath: string, destPath: string) => client.post('/files/copy', { sourcePath, destPath }),

  getPermissions: (path: string) => client.get<PermissionsInfo>('/files/permissions', { params: { path } }),

  setPermissions: (path: string, mode: string, recursive = false) =>
    client.put('/files/permissions', { path, mode, recursive }),

  downloadUrl: (path: string) => {
    const base = (client.defaults.baseURL ?? '').replace(/\/$/, '');
    return `${base}/files/download?path=${encodeURIComponent(path)}`;
  },

  upload: (path: string, files: File[], onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('path', path);
    files.forEach((file) => formData.append('files', file));
    return client.post<UploadResult>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
      },
    });
  },

  compress: (paths: string[], destPath: string, format: 'zip' | 'tar.gz') =>
    client.post('/files/compress', { paths, destPath, format }),

  extract: (path: string, destDir: string) => client.post('/files/extract', { path, destDir }),
};
