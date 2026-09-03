import type { ContentSectionPublic } from './content.types';
import type { SessionUser } from '../../types';
export declare class ContentService {
    private readonly repo;
    constructor();
    getAll(): Promise<ContentSectionPublic[]>;
    getByKey(key: string): Promise<ContentSectionPublic>;
    update(key: string, data: Record<string, unknown>, _actor: SessionUser): Promise<ContentSectionPublic>;
    private assertValidKey;
}
