import client from './client';
import type {
  AiConversation,
  AiMessage,
  AiSettings,
  AiSettingsInput,
  ChatStreamChunk,
  OllamaModel,
  OllamaModelInfo,
  OllamaPullProgress,
  OllamaRunningModel,
  OllamaStatusResponse,
} from '../types';

export const aiApi = {
  // Status & System
  getStatus: () => client.get<OllamaStatusResponse>('/ai/status'),
  
  // Settings
  getSettings: () => client.get<AiSettings>('/ai/settings'),
  updateSettings: (data: AiSettingsInput) => client.put<AiSettings>('/ai/settings', data),

  // Models
  listModels: () => client.get<{ models: OllamaModel[] }>('/ai/models'),
  getRunningModels: () => client.get<{ models: OllamaRunningModel[] }>('/ai/models/running'),
  getModelInfo: (name: string) => client.get<OllamaModelInfo>(`/ai/models/${encodeURIComponent(name)}`),
  deleteModel: (name: string) => client.delete<{ message: string }>(`/ai/models/${encodeURIComponent(name)}`),

  // Installer
  installOllama: () => client.post<{ message: string; output: string }>('/ai/ollama/install'),
  uninstallOllama: (purge = false) => client.post<{ message: string; output: string }>(`/ai/ollama/uninstall?purge=${purge}`),

  // Conversations
  listConversations: () => client.get<{ conversations: AiConversation[] }>('/ai/conversations'),
  getConversation: (id: string) =>
    client.get<{ conversation: AiConversation; messages: AiMessage[] }>(`/ai/conversations/${id}`),
  deleteConversation: (id: string) => client.delete<{ message: string }>(`/ai/conversations/${id}`),

  // Pull Model SSE Stream
  pullModelStream: async (
    name: string,
    onProgress: (progress: OllamaPullProgress) => void,
    onError: (err: string) => void
  ) => {
    try {
      const response = await fetch('/api/v1/ai/models/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            if (data.error) {
              onError(data.error);
            } else {
              onProgress(data);
            }
          } catch {
            // ignore JSON parse error
          }
        }
      }
    } catch (err: any) {
      onError(err.message || 'Pull request failed');
    }
  },

  // SSE Stream Chat
  sendChatMessageStream: async (
    params: { message: string; conversation_id?: string; model?: string; mode?: 'chat' | 'analytics' },
    onChunk: (chunk: ChatStreamChunk) => void
  ) => {
    const response = await fetch('/api/v1/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = 'Failed to connect to AI engine';
      try {
        const jsonErr = JSON.parse(errText);
        errMsg = jsonErr.message || errMsg;
      } catch {
        errMsg = errText || errMsg;
      }
      throw new Error(errMsg);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6);
        try {
          const chunk: ChatStreamChunk = JSON.parse(jsonStr);
          onChunk(chunk);
        } catch {
          // ignore
        }
      }
    }
  },

  // SSE Stream — confirm a pending destructive action
  confirmActionStream: async (
    conversationId: string,
    onChunk: (chunk: ChatStreamChunk) => void
  ) => {
    const response = await fetch(`/api/v1/ai/confirm/${encodeURIComponent(conversationId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = 'Confirmation failed';
      try { errMsg = JSON.parse(errText).message || errMsg; } catch { errMsg = errText || errMsg; }
      throw new Error(errMsg);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const chunk: ChatStreamChunk = JSON.parse(trimmed.slice(6));
          onChunk(chunk);
        } catch { /* ignore */ }
      }
    }
  },
};
