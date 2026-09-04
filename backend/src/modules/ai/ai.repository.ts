// ---------------------------------------------------------------------------
// AI Module — Repository (Database Access Layer)
// All raw SQL queries are isolated here. The service layer calls these methods
// instead of writing SQL directly.
// ---------------------------------------------------------------------------

import { query, queryOne } from '../../core/database/pool';
import type {
  AiSettings,
  AiSettingsInput,
  AiConversation,
  AiMessage,
  AiMessageRole,
} from './ai.types';

// ========================== Table Names ==========================

const SETTINGS_TABLE      = 'ai_settings';
const CONVERSATIONS_TABLE = 'ai_conversations';
const MESSAGES_TABLE      = 'ai_messages';

// ========================== Settings ==========================

/**
 * Fetch the single-row AI configuration. Returns null when no row exists yet.
 */
export const getSettings = async (): Promise<AiSettings | null> => {
  return queryOne<AiSettings>(`SELECT * FROM ${SETTINGS_TABLE} LIMIT 1`);
};

/**
 * Insert or update the AI configuration row (upsert semantics).
 * If a row already exists it is updated; otherwise a new one is inserted.
 */
export const upsertSettings = async (data: AiSettingsInput): Promise<AiSettings> => {
  const existing = await getSettings();

  if (existing) {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.provider !== undefined)         { fields.push('provider = ?');         values.push(data.provider); }
    if (data.ollama_host !== undefined)       { fields.push('ollama_host = ?');      values.push(data.ollama_host); }
    if (data.openai_api_key !== undefined)    { fields.push('openai_api_key = ?');   values.push(data.openai_api_key); }
    if (data.anthropic_api_key !== undefined && !data.anthropic_api_key?.includes('••••')) { fields.push('anthropic_api_key = ?'); values.push(data.anthropic_api_key); }
    if (data.deepseek_api_key !== undefined && !data.deepseek_api_key?.includes('••••'))  { fields.push('deepseek_api_key = ?'); values.push(data.deepseek_api_key); }
    if (data.default_model !== undefined)     { fields.push('default_model = ?');    values.push(data.default_model); }
    if (data.temperature !== undefined)       { fields.push('temperature = ?');      values.push(data.temperature); }
    if (data.max_tokens !== undefined)        { fields.push('max_tokens = ?');       values.push(data.max_tokens); }
    if (data.system_prompt !== undefined)     { fields.push('system_prompt = ?');    values.push(data.system_prompt); }

    if (fields.length > 0) {
      values.push(existing.id);
      await query(`UPDATE ${SETTINGS_TABLE} SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return (await queryOne<AiSettings>(`SELECT * FROM ${SETTINGS_TABLE} WHERE id = ?`, [existing.id]))!;
  }

  // First-time insert with defaults
  await query(
    `INSERT INTO ${SETTINGS_TABLE}
       (provider, ollama_host, openai_api_key, anthropic_api_key, deepseek_api_key, default_model, temperature, max_tokens, system_prompt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.provider         ?? 'ollama',
      data.ollama_host      ?? 'http://localhost:11434',
      data.openai_api_key   ?? null,
      data.anthropic_api_key?? null,
      data.deepseek_api_key ?? null,
      data.default_model    ?? 'llama3.2',
      data.temperature      ?? 0.7,
      data.max_tokens        ?? 4096,
      data.system_prompt    ?? 'You are a helpful server management assistant for the Medians cPanel.',
    ],
  );

  return (await queryOne<AiSettings>(`SELECT * FROM ${SETTINGS_TABLE} ORDER BY created_at DESC LIMIT 1`))!;
};

// ========================== Conversations ==========================

/**
 * List all conversations belonging to a user, most-recent first.
 */
export const listConversations = async (userId: string): Promise<AiConversation[]> => {
  return query<AiConversation>(
    `SELECT * FROM ${CONVERSATIONS_TABLE} WHERE user_id = ? ORDER BY updated_at DESC`,
    [userId],
  );
};

/**
 * Get a single conversation by ID. Returns null when not found.
 */
export const getConversation = async (id: string): Promise<AiConversation | null> => {
  return queryOne<AiConversation>(`SELECT * FROM ${CONVERSATIONS_TABLE} WHERE id = ?`, [id]);
};

/**
 * Create a new conversation and return it.
 */
export const createConversation = async (
  userId: string,
  title: string,
  model: string,
): Promise<AiConversation> => {
  await query(
    `INSERT INTO ${CONVERSATIONS_TABLE} (user_id, title, model) VALUES (?, ?, ?)`,
    [userId, title, model],
  );

  // UUID is auto-generated — grab the most recent row for this user
  return (await queryOne<AiConversation>(
    `SELECT * FROM ${CONVERSATIONS_TABLE} WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    [userId],
  ))!;
};

/**
 * Update the title and updated_at timestamp of a conversation.
 */
export const updateConversationTitle = async (id: string, title: string): Promise<void> => {
  await query(`UPDATE ${CONVERSATIONS_TABLE} SET title = ? WHERE id = ?`, [title, id]);
};

/**
 * Touch the updated_at column so the conversation floats to the top of the list.
 */
export const touchConversation = async (id: string): Promise<void> => {
  await query(
    `UPDATE ${CONVERSATIONS_TABLE} SET updated_at = CURRENT_TIMESTAMP(6) WHERE id = ?`,
    [id],
  );
};

/**
 * Delete a conversation (messages cascade-delete via FK).
 */
export const deleteConversation = async (id: string): Promise<void> => {
  await query(`DELETE FROM ${CONVERSATIONS_TABLE} WHERE id = ?`, [id]);
};

// ========================== Messages ==========================

/**
 * Fetch all messages in a conversation, ordered chronologically.
 */
export const getMessages = async (conversationId: string): Promise<AiMessage[]> => {
  return query<AiMessage>(
    `SELECT * FROM ${MESSAGES_TABLE} WHERE conversation_id = ? ORDER BY created_at ASC`,
    [conversationId],
  );
};

/**
 * Append a new message to a conversation.
 */
export const addMessage = async (
  conversationId: string,
  role: AiMessageRole,
  content: string,
  fileReferences?: string[],
  tokenCount?: number,
): Promise<AiMessage> => {
  const refs = fileReferences && fileReferences.length > 0
    ? JSON.stringify(fileReferences)
    : null;

  await query(
    `INSERT INTO ${MESSAGES_TABLE} (conversation_id, role, content, file_references, token_count)
     VALUES (?, ?, ?, ?, ?)`,
    [conversationId, role, content, refs, tokenCount ?? null],
  );

  return (await queryOne<AiMessage>(
    `SELECT * FROM ${MESSAGES_TABLE} WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1`,
    [conversationId],
  ))!;
};

/**
 * Full conversation context: conversation row + all its messages.
 */
export const getConversationWithMessages = async (
  id: string,
): Promise<{ conversation: AiConversation; messages: AiMessage[] } | null> => {
  const conversation = await getConversation(id);
  if (!conversation) return null;

  const messages = await getMessages(id);
  return { conversation, messages };
};
