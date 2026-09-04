import { SessionUser } from '../../types';
import type { AiSettings, AiSettingsInput, AiConversation, AiMessage, ChatRequest, ChatStreamChunk, OllamaModel, OllamaModelInfo, OllamaRunningModel, OllamaStatusResponse, OllamaPullProgress } from './ai.types';
export declare const resolveSafePath: (sentFilePath: string, user: SessionUser) => string;
/**
 * Process a chat message: detect file refs, build context, route to the
 * correct provider, and call the `onChunk` callback with SSE-ready chunks.
 */
export declare const chat: (request: ChatRequest, user: SessionUser, onChunk: (chunk: ChatStreamChunk) => void) => Promise<void>;
export declare const confirmPendingAction: (conversationId: string, user: SessionUser, onChunk: (chunk: ChatStreamChunk) => void) => Promise<void>;
/**
 * Check if Ollama is installed and running, return status info.
 */
export declare const getOllamaStatus: () => Promise<OllamaStatusResponse>;
/**
 * List all locally available models from Ollama.
 */
export declare const listModels: () => Promise<OllamaModel[]>;
/**
 * Get detailed info about a specific model.
 */
export declare const getModelInfo: (modelName: string) => Promise<OllamaModelInfo>;
/**
 * Pull (download) a model from the Ollama registry.
 * Streams progress events to the callback.
 */
export declare const pullModel: (modelName: string, onProgress: (progress: OllamaPullProgress) => void) => Promise<void>;
/**
 * Delete a model from Ollama.
 */
export declare const deleteModel: (modelName: string) => Promise<void>;
/**
 * Get currently running (loaded into memory) models.
 */
export declare const getRunningModels: () => Promise<OllamaRunningModel[]>;
/**
 * Get the current AI settings, or sensible defaults if none exist yet.
 */
export declare const getSettingsOrDefaults: () => Promise<AiSettings>;
/**
 * Update AI settings (partial update supported).
 */
export declare const updateSettings: (data: AiSettingsInput) => Promise<AiSettings>;
export declare const listConversations: (userId: string) => Promise<AiConversation[]>;
export declare const getConversation: (id: string, userId: string) => Promise<{
    conversation: AiConversation;
    messages: AiMessage[];
}>;
export declare const deleteConversation: (id: string, userId: string) => Promise<void>;
