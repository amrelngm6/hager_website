import { NotFoundError, BadRequestError } from '../../core/errors/httpErrors';
import { ContentRepository } from './content.repository';
import { ALLOWED_SECTION_KEYS } from './content.types';
import type { ContentSectionPublic, SectionKey } from './content.types';
import type { SessionUser } from '../../types';

// ---------------------------------------------------------------------------
// ContentService — all business logic lives here
// ---------------------------------------------------------------------------

export class ContentService {
  private readonly repo: ContentRepository;

  constructor() {
    this.repo = new ContentRepository();
  }

  // ── Get all ───────────────────────────────────────────────────────────────

  async getAll(): Promise<ContentSectionPublic[]> {
    const sections = await this.repo.findAll();
    return sections;
  }

  // ── Get by key ────────────────────────────────────────────────────────────

  async getByKey(key: string): Promise<ContentSectionPublic> {
    this.assertValidKey(key);
    const section = await this.repo.findByKey(key);
    if (!section) {
      throw new NotFoundError(
        `Content section "${key}" not found. Run the migration to seed default content.`,
        'CONTENT_SECTION_NOT_FOUND',
      );
    }
    return section;
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(
    key: string,
    data: Record<string, unknown>,
    _actor: SessionUser,
  ): Promise<ContentSectionPublic> {
    this.assertValidKey(key);
    await this.repo.upsert(key, data);
    const updated = await this.repo.findByKey(key);
    if (!updated) throw new Error('Content section not found after upsert.');
    return updated;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private assertValidKey(key: string): asserts key is SectionKey {
    if (!(ALLOWED_SECTION_KEYS as readonly string[]).includes(key)) {
      throw new BadRequestError(
        `"${key}" is not a valid section key. Allowed keys: ${ALLOWED_SECTION_KEYS.join(', ')}.`,
        'INVALID_SECTION_KEY',
      );
    }
  }
}
