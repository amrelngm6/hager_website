import type { ContentSection } from './content.types';
export declare class ContentRepository {
    findAll(): Promise<ContentSection[]>;
    findByKey(key: string): Promise<ContentSection | null>;
    upsert(key: string, data: Record<string, unknown>): Promise<void>;
    private parseRow;
}
