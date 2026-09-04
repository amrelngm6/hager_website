// ---------------------------------------------------------------------------
// AI Module — Type Definitions
// ---------------------------------------------------------------------------

import { OllamaToolCall } from "./ai.ollama.helper";
import { SessionUser } from '../../types';

/** Supported AI backend providers */
export type AiProvider = 'ollama' | 'openai' | 'anthropic' | 'deepseek';

/** Message role inside a conversation */
export type AiMessageRole = 'user' | 'assistant' | 'system';

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Conversations & Messages
// ---------------------------------------------------------------------------

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
  file_references: string | null; // JSON-encoded array of file paths
  token_count: number | null;
  created_at: Date;
}

// ---------------------------------------------------------------------------
// Chat Request / Response
// ---------------------------------------------------------------------------

export type ChatMode = 'chat' | 'analytics';

export interface ChatRequest {
  message: string;
  conversation_id?: string;   // Omit to start a new conversation
  model?: string;             // Override the default model for this message
  mode?: ChatMode;            // 'analytics' restricts tools to schema/query/chart reporting (Ollama only)
}

export interface ChatStreamChunk {
  /** 'delta' for partial tokens, 'done' for the final chunk, 'error' on failure, 'confirmation_request' when a destructive action needs user approval */
  type: 'delta' | 'done' | 'error' | 'confirmation_request';
  content: string;
  conversation_id?: string;
  message_id?: string;
  model?: string;
  token_count?: number;
  // Populated only for confirmation_request
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  confirmationMessage?: string;
}

// ---------------------------------------------------------------------------
// Ollama API Shapes
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Cloud Provider Message Format (shared between OpenAI / Anthropic calls)
// ---------------------------------------------------------------------------

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

  category: 'email' | 'database' | 'domain' | 'php' | 'dns' | 'system' | 'backup' | 'analytics';

  destructive?: boolean;

  adminOnly?: boolean;

  parameters: {
    type: 'object';

    properties: Record<string, unknown>;

    required?: string[];
  };

  execute: (
    args: Record<string, unknown>,
    context: ActionContext,
  ) => Promise<unknown>;
}