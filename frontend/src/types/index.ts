export type UserRole = 'admin' | 'reseller' | 'client';


export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  status: 'active' | 'inactive';
  email_verified_at: Date | null;
  last_login_at: Date | null;
  avatar_url: string | null;
  timezone: string;
  preferences: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  is_active: boolean;
}

export interface SystemStats {
  cpu: { model: string; cores: number; usage: number };
  memory: { total: number; used: number; free: number; percentage: number };
  disk: Array<{
    filesystem: string;
    size: string;
    used: string;
    available: string;
    percentage: string;
    mountpoint: string;
  }>;
  uptime: number;
  loadAverage: [number, number, number];
  hostname: string;
  platform: string;
}
// ─── AI Module ────────────────────────────────────────────────────────────────

export type AiProvider = 'ollama' | 'openai' | 'anthropic' | 'deepseek';
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
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: AiMessageRole;
  content: string;
  file_references: string | null;
  token_count: number | null;
  created_at: string;
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

export interface ChatStreamChunk {
  type: 'delta' | 'done' | 'error';
  content: string;
  conversation_id?: string;
  message_id?: string;
  model?: string;
  token_count?: number;
}


