import type { AiSettings, AiSettingsInput, AiConversation, AiMessage, AiMessageRole } from './ai.types';
/**
 * Fetch the single-row AI configuration. Returns null when no row exists yet.
 */
export declare const getSettings: () => Promise<AiSettings | null>;
/**
 * Insert or update the AI configuration row (upsert semantics).
 * If a row already exists it is updated; otherwise a new one is inserted.
 */
export declare const upsertSettings: (data: AiSettingsInput) => Promise<AiSettings>;
/**
 * List all conversations belonging to a user, most-recent first.
 */
export declare const listConversations: (userId: string) => Promise<AiConversation[]>;
/**
 * Get a single conversation by ID. Returns null when not found.
 */
export declare const getConversation: (id: string) => Promise<AiConversation | null>;
/**
 * Create a new conversation and return it.
 */
export declare const createConversation: (userId: string, title: string, model: string) => Promise<AiConversation>;
/**
 * Update the title and updated_at timestamp of a conversation.
 */
export declare const updateConversationTitle: (id: string, title: string) => Promise<void>;
/**
 * Touch the updated_at column so the conversation floats to the top of the list.
 */
export declare const touchConversation: (id: string) => Promise<void>;
/**
 * Delete a conversation (messages cascade-delete via FK).
 */
export declare const deleteConversation: (id: string) => Promise<void>;
/**
 * Fetch all messages in a conversation, ordered chronologically.
 */
export declare const getMessages: (conversationId: string) => Promise<AiMessage[]>;
/**
 * Append a new message to a conversation.
 */
export declare const addMessage: (conversationId: string, role: AiMessageRole, content: string, fileReferences?: string[], tokenCount?: number) => Promise<AiMessage>;
/**
 * Full conversation context: conversation row + all its messages.
 */
export declare const getConversationWithMessages: (id: string) => Promise<{
    conversation: AiConversation;
    messages: AiMessage[];
} | null>;
