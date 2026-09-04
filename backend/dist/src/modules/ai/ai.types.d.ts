import { OllamaToolCall } from "./ai.ollama.helper";
import { SessionUser } from '../../types';
/** Supported AI backend providers */
export type AiProvider = 'ollama' | 'openai' | 'anthropic' | 'deepseek';
/** Message role inside a conversation */
export type AiMessageRole = 'user' | 'assistant' | 'system';
export interface AiSettings {
    id: string;
    provider: AiProvider;
    ollama_host: string;
    openai_api_key: string | null;
    anthropic_api_key: string | null;
    deepseek_api_key: string | null;
    default_model: string;
    temperature: number;
    max_tokens: number;
    system_prompt: string;
    created_at: Date;
    updated_at: Date;
}
export interface AiSettingsInput {
    provider?: AiProvider;
    ollama_host?: string;
    openai_api_key?: string | null;
    anthropic_api_key?: string | null;
    deepseek_api_key?: string | null;
    default_model?: string;
    temperature?: number;
    max_tokens?: number;
    system_prompt?: string;
}
export interface AiConversation {
    id: string;
    user_id: string;
    title: string;
    model: string;
    created_at: Date;
    updated_at: Date;
}
export interface AiMessage {
    id: string;
    conversation_id: string;
    role: AiMessageRole;
    content: string;
    file_references: string | null;
    token_count: number | null;
    created_at: Date;
}
export type ChatMode = 'chat' | 'analytics';
export interface ChatRequest {
    message: string;
    conversation_id?: string;
    model?: string;
    mode?: ChatMode;
}
export interface ChatStreamChunk {
    /** 'delta' for partial tokens, 'done' for the final chunk, 'error' on failure, 'confirmation_request' when a destructive action needs user approval */
    type: 'delta' | 'done' | 'error' | 'confirmation_request';
    content: string;
    conversation_id?: string;
    message_id?: string;
    model?: string;
    token_count?: number;
    toolName?: string;
    toolArgs?: Record<string, unknown>;
    confirmationMessage?: string;
}
export interface OllamaModel {
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
        parent_model: string;
        format: string;
        family: string;
        families: string[] | null;
        parameter_size: string;
        quantization_level: string;
    };
}
export interface OllamaModelInfo {
    modelfile: string;
    parameters: string;
    template: string;
    details: {
        parent_model: string;
        format: string;
        family: string;
        families: string[] | null;
        parameter_size: string;
        quantization_level: string;
    };
    model_info: Record<string, unknown>;
}
export interface OllamaRunningModel {
    name: string;
    model: string;
    size: number;
    digest: string;
    expires_at: string;
    size_vram: number;
    details: {
        parent_model: string;
        format: string;
        family: string;
        families: string[] | null;
        parameter_size: string;
        quantization_level: string;
    };
}
export interface OllamaStatusResponse {
    installed: boolean;
    running: boolean;
    version: string | null;
    host: string;
    models_count: number;
    gpu_available: boolean;
}
export interface OllamaPullProgress {
    status: string;
    digest?: string;
    total?: number;
    completed?: number;
}
export interface ProviderMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    tool_calls?: OllamaToolCall[];
}
export interface ActionContext {
    user: SessionUser;
}
export interface ActionDefinition {
    name: string;
    description: string;
    category?: 'articles' | 'doctors' | 'services' | 'clinics' | 'email' | 'system' | 'other' | 'undefined';
    destructive?: boolean;
    adminOnly?: boolean;
    parameters: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
    execute: (args: Record<string, unknown>, context: ActionContext) => Promise<unknown>;
}
