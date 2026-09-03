import type { RowDataPacket } from 'mysql2';
import pool from '../../core/database/pool';
import type { ContentSection } from './content.types';

// ---------------------------------------------------------------------------
// Typed row interface for mysql2
// ---------------------------------------------------------------------------

interface ContentSectionRow extends ContentSection, RowDataPacket {}

// ---------------------------------------------------------------------------
// ContentRepository — raw SQL only
// ---------------------------------------------------------------------------

export class ContentRepository {
  // ── Find all ─────────────────────────────────────────────────────────────

  async findAll(): Promise<ContentSection[]> {
    const [rows] = await pool.execute<ContentSectionRow[]>(
      'SELECT section_key, data, updated_at FROM content_sections ORDER BY section_key ASC',
    );
    return rows.map(this.parseRow);
  }

  // ── Find one ──────────────────────────────────────────────────────────────

  async findByKey(key: string): Promise<ContentSection | null> {
    const [rows] = await pool.execute<ContentSectionRow[]>(
      'SELECT section_key, data, updated_at FROM content_sections WHERE section_key = ? LIMIT 1',
      [key],
    );
    if (rows.length === 0) return null;
    return this.parseRow(rows[0]);
  }

  // ── Upsert ────────────────────────────────────────────────────────────────
  // INSERT … ON DUPLICATE KEY UPDATE — safe idempotent write.

  async upsert(key: string, data: Record<string, unknown>): Promise<void> {
    const json = JSON.stringify(data);
    await pool.execute(
      `INSERT INTO content_sections (section_key, data)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE data = VALUES(data)`,
      [key, json],
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private parseRow(row: ContentSectionRow): ContentSection {
    return {
      section_key: row.section_key,
      // mysql2 returns JSON columns as already-parsed objects in most drivers,
      // but guard against string form just in case.
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      updated_at: row.updated_at,
    };
  }
}
