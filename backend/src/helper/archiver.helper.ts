import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);


export async function archiver(
    zipPath: string,
    files: string[],
    format: string,
    options?: {gzip?: boolean; zlib?: {level?: number}} | undefined,
): Promise<string> {

    const command = format === 'zip' ? `zip -r ${zipPath}` : `tar ${options?.gzip ? '-czf' : '-cf'} ${zipPath}`;
    const fileList = files.map(file => `"${file}"`).join(' ');
    const fullCommand = `${command} ${fileList}`;
    const result = await execAsync(fullCommand, { maxBuffer: 1024 * 1024 * 10 }); // Increase buffer size if needed

    return result.stdout;
}

export default archiver;