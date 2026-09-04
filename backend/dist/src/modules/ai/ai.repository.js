"use strict";
// ---------------------------------------------------------------------------
// AI Module — Repository (Database Access Layer)
// All raw SQL queries are isolated here. The service layer calls these methods
// instead of writing SQL directly.
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversationWithMessages = exports.addMessage = exports.getMessages = exports.deleteConversation = exports.touchConversation = exports.updateConversationTitle = exports.createConversation = exports.getConversation = exports.listConversations = exports.upsertSettings = exports.getSettings = void 0;
const pool_1 = require("../../core/database/pool");
// ========================== Table Names ==========================
const SETTINGS_TABLE = 'ai_settings';
const CONVERSATIONS_TABLE = 'ai_conversations';
const MESSAGES_TABLE = 'ai_messages';
// ========================== Settings ==========================
/**
 * Fetch the single-row AI configuration. Returns null when no row exists yet.
 */
const getSettings = async () => {
    return (0, pool_1.queryOne)(`SELECT * FROM ${SETTINGS_TABLE} LIMIT 1`);
};
exports.getSettings = getSettings;
/**
 * Insert or update the AI configuration row (upsert semantics).
 * If a row already exists it is updated; otherwise a new one is inserted.
 */
const upsertSettings = async (data) => {
    const existing = await (0, exports.getSettings)();
    if (existing) {
        const fields = [];
        const values = [];
        if (data.provider !== undefined) {
            fields.push('provider = ?');
            values.push(data.provider);
        }
        if (data.ollama_host !== undefined) {
            fields.push('ollama_host = ?');
            values.push(data.ollama_host);
        }
        if (data.openai_api_key !== undefined) {
            fields.push('openai_api_key = ?');
            values.push(data.openai_api_key);
        }
        if (data.anthropic_api_key !== undefined && !data.anthropic_api_key?.includes('••••')) {
            fields.push('anthropic_api_key = ?');
            values.push(data.anthropic_api_key);
        }
        if (data.deepseek_api_key !== undefined && !data.deepseek_api_key?.includes('••••')) {
            fields.push('deepseek_api_key = ?');
            values.push(data.deepseek_api_key);
        }
        if (data.default_model !== undefined) {
            fields.push('default_model = ?');
            values.push(data.default_model);
        }
        if (data.temperature !== undefined) {
            fields.push('temperature = ?');
            values.push(data.temperature);
        }
        if (data.max_tokens !== undefined) {
            fields.push('max_tokens = ?');
            values.push(data.max_tokens);
        }
        if (data.system_prompt !== undefined) {
            fields.push('system_prompt = ?');
            values.push(data.system_prompt);
        }
        if (fields.length > 0) {
            values.push(existing.id);
            await (0, pool_1.query)(`UPDATE ${SETTINGS_TABLE} SET ${fields.join(', ')} WHERE id = ?`, values);
        }
        return (await (0, pool_1.queryOne)(`SELECT * FROM ${SETTINGS_TABLE} WHERE id = ?`, [existing.id]));
    }
    // First-time insert with defaults
    await (0, pool_1.query)(`INSERT INTO ${SETTINGS_TABLE}
       (provider, ollama_host, openai_api_key, anthropic_api_key, deepseek_api_key, default_model, temperature, max_tokens, system_prompt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        data.provider ?? 'ollama',
        data.ollama_host ?? 'http://localhost:11434',
        data.openai_api_key ?? null,
        data.anthropic_api_key ?? null,
        data.deepseek_api_key ?? null,
        data.default_model ?? 'llama3.2',
        data.temperature ?? 0.7,
        data.max_tokens ?? 4096,
        data.system_prompt ?? 'You are a helpful server management assistant for the Medians cPanel.',
    ]);
    return (await (0, pool_1.queryOne)(`SELECT * FROM ${SETTINGS_TABLE} ORDER BY created_at DESC LIMIT 1`));
};
exports.upsertSettings = upsertSettings;
// ========================== Conversations ==========================
/**
 * List all conversations belonging to a user, most-recent first.
 */
const listConversations = async (userId) => {
    return (0, pool_1.query)(`SELECT * FROM ${CONVERSATIONS_TABLE} WHERE user_id = ? ORDER BY updated_at DESC`, [userId]);
};
exports.listConversations = listConversations;
/**
 * Get a single conversation by ID. Returns null when not found.
 */
const getConversation = async (id) => {
    return (0, pool_1.queryOne)(`SELECT * FROM ${CONVERSATIONS_TABLE} WHERE id = ?`, [id]);
};
exports.getConversation = getConversation;
/**
 * Create a new conversation and return it.
 */
const createConversation = async (userId, title, model) => {
    await (0, pool_1.query)(`INSERT INTO ${CONVERSATIONS_TABLE} (user_id, title, model) VALUES (?, ?, ?)`, [userId, title, model]);
    // UUID is auto-generated — grab the most recent row for this user
    return (await (0, pool_1.queryOne)(`SELECT * FROM ${CONVERSATIONS_TABLE} WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`, [userId]));
};
exports.createConversation = createConversation;
/**
 * Update the title and updated_at timestamp of a conversation.
 */
const updateConversationTitle = async (id, title) => {
    await (0, pool_1.query)(`UPDATE ${CONVERSATIONS_TABLE} SET title = ? WHERE id = ?`, [title, id]);
};
exports.updateConversationTitle = updateConversationTitle;
/**
 * Touch the updated_at column so the conversation floats to the top of the list.
 */
const touchConversation = async (id) => {
    await (0, pool_1.query)(`UPDATE ${CONVERSATIONS_TABLE} SET updated_at = CURRENT_TIMESTAMP(6) WHERE id = ?`, [id]);
};
exports.touchConversation = touchConversation;
/**
 * Delete a conversation (messages cascade-delete via FK).
 */
const deleteConversation = async (id) => {
    await (0, pool_1.query)(`DELETE FROM ${CONVERSATIONS_TABLE} WHERE id = ?`, [id]);
};
exports.deleteConversation = deleteConversation;
// ========================== Messages ==========================
/**
 * Fetch all messages in a conversation, ordered chronologically.
 */
const getMessages = async (conversationId) => {
    return (0, pool_1.query)(`SELECT * FROM ${MESSAGES_TABLE} WHERE conversation_id = ? ORDER BY created_at ASC`, [conversationId]);
};
exports.getMessages = getMessages;
/**
 * Append a new message to a conversation.
 */
const addMessage = async (conversationId, role, content, fileReferences, tokenCount) => {
    const refs = fileReferences && fileReferences.length > 0
        ? JSON.stringify(fileReferences)
        : null;
    await (0, pool_1.query)(`INSERT INTO ${MESSAGES_TABLE} (conversation_id, role, content, file_references, token_count)
     VALUES (?, ?, ?, ?, ?)`, [conversationId, role, content, refs, tokenCount ?? null]);
    return (await (0, pool_1.queryOne)(`SELECT * FROM ${MESSAGES_TABLE} WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1`, [conversationId]));
};
exports.addMessage = addMessage;
/**
 * Full conversation context: conversation row + all its messages.
 */
const getConversationWithMessages = async (id) => {
    const conversation = await (0, exports.getConversation)(id);
    if (!conversation)
        return null;
    const messages = await (0, exports.getMessages)(id);
    return { conversation, messages };
};
exports.getConversationWithMessages = getConversationWithMessages;
//# sourceMappingURL=ai.repository.js.map