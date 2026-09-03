export declare function archiver(zipPath: string, files: string[], format: string, options?: {
    gzip?: boolean;
    zlib?: {
        level?: number;
    };
} | undefined): Promise<string>;
export default archiver;
