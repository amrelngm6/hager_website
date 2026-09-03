import fs from 'fs';
import path from 'path';

export function securePath(
    inputPath: string,
    baseDir: string,
    mustExist = true
): string {
    const base = mustExist
        ? fs.realpathSync(baseDir)
        : path.resolve(baseDir);

    const target = mustExist
        ? fs.realpathSync(inputPath)
        : path.resolve(inputPath);

    if (
        target !== base &&
        !target.startsWith(base + path.sep)
    ) {
        throw new Error(`Path traversal detected: ${inputPath}`);
    }

    return target;
}