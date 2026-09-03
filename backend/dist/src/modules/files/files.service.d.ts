import { SessionUser } from '../../types';
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
export declare const resolveSafePath: (sentFilePath: string, user: SessionUser) => string;
/** Resolve a file path for client (non-admin) users, sandboxed to their domain directory. */
export declare const resolveClientFilePath: (domain: string, requestedPath: string) => string;
export interface FileEntry {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size: number;
    modified: Date;
    permissions: string;
}
export declare const listDirectory: (dirPath: string, user: SessionUser) => Promise<FileEntry[]>;
export declare const readFile: (filePath: string, user: SessionUser) => Promise<string>;
export declare const writeFile: (filePath: string, content: string, user: SessionUser) => Promise<void>;
export declare const createDirectory: (dirPath: string, user: SessionUser) => Promise<void>;
export declare const createEmptyFile: (filePath: string, user: SessionUser) => Promise<void>;
export declare const deleteEntry: (entryPath: string, user: SessionUser) => Promise<void>;
export declare const bulkDeleteEntries: (paths: string[], user: SessionUser) => Promise<{
    deleted: string[];
    failed: {
        path: string;
        error: string;
    }[];
}>;
export declare const renameEntry: (oldPath: string, newPath: string, user: SessionUser) => Promise<void>;
export declare const copyEntry: (sourcePath: string, destPath: string, user: SessionUser) => Promise<void>;
export declare const getPermissions: (entryPath: string, user: SessionUser) => Promise<{
    path: string;
    mode: string;
    isDirectory: boolean;
}>;
export declare const setPermissions: (entryPath: string, mode: string, user: SessionUser, recursive?: boolean) => Promise<void>;
export declare const getDownloadInfo: (filePath: string, user: SessionUser) => Promise<{
    safePath: string;
    name: string;
    size: number;
}>;
export declare const compressEntries: (entryPaths: string[], destPath: string, format: "zip" | "tar.gz", user: SessionUser) => Promise<void>;
export declare const extractArchive: (archivePath: string, destDir: string, user: SessionUser) => Promise<void>;
