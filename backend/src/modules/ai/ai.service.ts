// ---------------------------------------------------------------------------
// AI Module — Service Layer
// Business logic for chat, model management, Ollama/Cloud integration.
// No raw SQL here — all DB access is delegated to ai.repository.ts.
// ---------------------------------------------------------------------------

import fs from 'fs/promises';
import path from 'path';
import { createError } from '../../middlewares/error.middleware';
import { SessionUser } from '../../types';
import * as repo from './ai.repository';
import type {
  AiSettings,
  AiSettingsInput,
  AiConversation,
  AiMessage,
  ChatRequest,
  ChatStreamChunk,
  OllamaModel,
  OllamaModelInfo,
  OllamaRunningModel,
  OllamaStatusResponse,
  OllamaPullProgress,
  ProviderMessage,
} from './ai.types';


// import { agentClient } from '../../agent/client';

import dotenv from 'dotenv';
dotenv.config();

const WEB_ROOT = process.env.WEB_ROOT || path.resolve(__dirname, '../../../webroot');

import { resolveClientFilePath } from '../files/files.service';
import { securePath } from '../../helper/securepath.helper';
import { handleOllamaTools, ANALYTICS_TOOL_NAMES, OllamaToolCall, executeEnrichedToolCall } from './ai.ollama.helper';
import { executeServerAction } from './ai.action.executor';
// import { resolveClientFilePath, securePath }

// ── Pending confirmation store ────────────────────────────────────────────────
// Keyed by conversation_id; holds the context needed to resume after user confirms.
interface PendingConfirmation {
  conversationSnapshot: ProviderMessage[]; // conversation before assistant tool_calls turn
  toolCall: OllamaToolCall;
  model: string;
  settings: AiSettings;
}
const pendingConfirmations = new Map<string, PendingConfirmation>();

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

export const resolveSafePath = (sentFilePath: string, user: SessionUser): string => {
  const filePath = (sentFilePath || '/').trim();

  const relative = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const resolvedPath = path.resolve(WEB_ROOT, relative);

  if (resolvedPath === WEB_ROOT || resolvedPath.startsWith(WEB_ROOT + path.sep)) {
    return securePath(resolvedPath, WEB_ROOT);
  }

  throw createError(`Access denied: ${resolvedPath} is outside the allowed directory`, 403);
};

const ANALYTICS_SYSTEM_PROMPT =
  'You are in data analysis & reporting mode. Follow these steps strictly:\n' +
  '1. Call get_database_schema first to learn the exact table and column names — never guess them.\n' +
  '2. Write a single read-only SELECT statement and call run_report_query to fetch the data you need.\n' +
  '3. Once you have the rows, call generate_report_chart with a chart_type (bar, line, area, pie, or table), ' +
  'a clear title, and a series array of {label, value} points summarizing the result.\n' +
  '4. After the chart is rendered, briefly explain the key insight in plain text.\n' +
  'Only use the tools provided to you in this mode. Never attempt to modify data.';

/**
 * Resolve the Ollama host URL from saved settings (or fallback default).
 */
const getOllamaHost = async (): Promise<string> => {
  const settings = await repo.getSettings();
  return settings?.ollama_host ?? 'http://localhost:11434';
};

/**
 * Convenience wrapper for Ollama HTTP calls using native `fetch`.
 */
const ollamaFetch = async (
  path: string,
  init?: RequestInit & { host?: string },
): Promise<Response> => {
  const host = init?.host ?? (await getOllamaHost());
  const url = `${host.replace(/\/+$/, '')}${path}`;
  return fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
};

// ---------------------------------------------------------------------------
// File reference detection and content injection
// ---------------------------------------------------------------------------

/**
 * Regex to detect @file:path references in user messages.
 * Supports:
 *   @file:/absolute/path
 *   @file:relative/path
 *   @file:"path with spaces"
 */
/**
 * Regex to detect @file:path or @path references in user messages.
 * Supports:
 *   @file:/absolute/path
 *   @file:relative/path
 *   @file:"path with spaces"
 *   @path/to/file
 */
const FILE_REF_REGEX = /(?:^|\s)@(?:file:)?(?:"([^"]+)"|(\S+))/g;

/**
 * Extract file references from a message string.
 */
const extractFileReferences = (message: string): string[] => {
  const refs: string[] = [];
  let match: RegExpExecArray | null;
  FILE_REF_REGEX.lastIndex = 0;
  while ((match = FILE_REF_REGEX.exec(message)) !== null) {
    const rawRef = match[1] ?? match[2];
    if (rawRef && !rawRef.includes('@')) { // Avoid email addresses like user@domain.com
      refs.push(rawRef);
    }
  }
  return refs;
};


/**
 * Read file contents for context injection. Truncates very large files.
 */
const readFileContent = async (filePath: string): Promise<string> => {
  const MAX_FILE_SIZE = 64 * 1024; // 64 KB limit per file
  const stat = await fs.stat(filePath);

  if (!stat.isFile()) {
    throw createError(`Not a regular file: ${filePath}`, 400);
  }

  if (stat.size > MAX_FILE_SIZE) {
    const buffer = Buffer.alloc(MAX_FILE_SIZE);
    const fd = await fs.open(filePath, 'r');
    try {
      await fd.read(buffer, 0, MAX_FILE_SIZE, 0);
    } finally {
      await fd.close();
    }
    return buffer.toString('utf-8') + '\n\n[...file truncated at 64 KB...]';
  }

  return fs.readFile(filePath, 'utf-8');
};

/**
 * Build system context from file references in the user message.
 */
const buildFileContext = async (
  message: string,
  user: SessionUser,
): Promise<{ cleanMessage: string; fileContext: string; fileRefs: string[] }> => {
  const refs = extractFileReferences(message);
  if (refs.length === 0) {
    return { cleanMessage: message, fileContext: '', fileRefs: [] };
  }

  const contextParts: string[] = [];
  const validRefs: string[] = [];

  for (const ref of refs) {
    try {
      const resolvedPath = resolveSafePath(ref, user);
      const content = await readFileContent(resolvedPath);
      contextParts.push(`--- File: ${resolvedPath} ---\n${content}\n--- End of file ---`);
      validRefs.push(resolvedPath);
    } catch (err: any) {
      throw createError(`Mentioned file "${ref}" path: ${resolveSafePath(ref, user)} and cannot be accessed (${err.message})`, 400);
    }
  }

  // Remove the @file: references from the message shown to the LLM
  const cleanMessage = message.replace(FILE_REF_REGEX, '').trim();
  const fileContext = contextParts.join('\n\n');

  return { cleanMessage, fileContext, fileRefs: validRefs };
};

// ---------------------------------------------------------------------------
// Chat — the main entrypoint
// ---------------------------------------------------------------------------

/**
 * Process a chat message: detect file refs, build context, route to the
 * correct provider, and call the `onChunk` callback with SSE-ready chunks.
 */
export const chat = async (
  request: ChatRequest,
  user: SessionUser,
  onChunk: (chunk: ChatStreamChunk) => void,
): Promise<void> => {
  const settings = await getSettingsOrDefaults();
  const model = request.model ?? settings.default_model;
  const mode = request.mode === 'analytics' ? 'analytics' : 'chat';

  // Data analysis & reporting is only supported through the local Ollama provider.
  if (mode === 'analytics' && settings.provider !== 'ollama') {
    onChunk({
      type: 'error',
      content: 'Data analysis & reports are only available with the Ollama provider. Switch providers in AI Settings to use this feature.',
      conversation_id: request.conversation_id,
    });
    return;
  }

  // 1. File context (Throws error and stops prompt if mentioned file does not exist)
  let cleanMessage = request.message;
  let fileContext = '';
  let fileRefs: string[] = [];
  try {
    const res = await buildFileContext(request.message, user);
    cleanMessage = res.cleanMessage;
    fileContext = res.fileContext;
    fileRefs = res.fileRefs;
  } catch (err: any) {
    onChunk({ type: 'error', content: err.message, conversation_id: request.conversation_id });
    return;
  }

  // 2. Resolve or create conversation
  let conversationId = request.conversation_id;
  if (!conversationId) {
    const titleText = cleanMessage.slice(0, 80) || 'New conversation';
    const title = mode === 'analytics' ? `\u{1F4CA} ${titleText}` : titleText;
    const conv = await repo.createConversation(user.id, title, model);
    conversationId = conv.id;
  } else {
    const existing = await repo.getConversation(conversationId);
    if (!existing) {
      throw createError('Conversation not found', 404);
    }
    if (existing.user_id !== user.id) {
      throw createError('Access denied', 403);
    }
  }

  // 3. Save the user message
  await repo.addMessage(conversationId, 'user', request.message, fileRefs);

  // 4. Build the message list for the provider
  const history = await repo.getMessages(conversationId);
  const providerMessages: ProviderMessage[] = [];

  // System prompt
  const systemParts: string[] = [settings.system_prompt];
  if (fileContext) {
    systemParts.push(
      'The user has referenced the following file(s). Use this content to answer their question:\n\n' +
      fileContext,
    );
  }
  if (mode === 'analytics') {
    systemParts.push(ANALYTICS_SYSTEM_PROMPT);
  }
  providerMessages.push({ role: 'system', content: systemParts.join('\n\n') });

  // Conversation history (exclude the current user message — we'll add the clean version)
  for (const msg of history.slice(0, -1)) {
    providerMessages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
  }
  providerMessages.push({ role: 'user', content: cleanMessage || request.message });

  // 5. Route to the correct provider
  let fullResponse = '';
  const collectResponse = (chunk: ChatStreamChunk) => {
    if (chunk.type === 'delta') {
      fullResponse += chunk.content;
    }
    onChunk({ ...chunk, conversation_id: conversationId });
  };

  try {
    switch (settings.provider) {
      case 'ollama':
        await streamOllama(providerMessages, conversationId!, model, settings, collectResponse, user, mode);
        break;
      case 'openai':
        await streamOpenAI(providerMessages, model, settings, collectResponse);
        break;
      case 'anthropic':
        await streamAnthropic(providerMessages, model, settings, collectResponse);
        break;
      case 'deepseek':
        await streamDeepSeek(providerMessages, model, settings, collectResponse);
        break;
      default:
        throw createError(`Unsupported provider: ${settings.provider}`, 400);
    }
  } catch (err: any) {
    onChunk({ type: 'error', content: err.message, conversation_id: conversationId });
    return;
  }

  // 6. Save the assistant response
  const assistantMsg = await repo.addMessage(conversationId, 'assistant', fullResponse);
  await repo.touchConversation(conversationId);

  // 7. Send done chunk
  onChunk({
    type: 'done',
    content: '',
    conversation_id: conversationId,
    message_id: assistantMsg.id,
    model,
  });
};

// ---------------------------------------------------------------------------
// Confirm pending action — called when user approves via the UI dialog
// ---------------------------------------------------------------------------

export const confirmPendingAction = async (
  conversationId: string,
  user: SessionUser,
  onChunk: (chunk: ChatStreamChunk) => void,
): Promise<void> => {
  const pending = pendingConfirmations.get(conversationId);
  if (!pending) {
    onChunk({ type: 'error', content: 'No pending action found. Please retry your request.', conversation_id: conversationId });
    return;
  }
  pendingConfirmations.delete(conversationId);

  const { conversationSnapshot, toolCall, model, settings } = pending;

  // Execute with confirmed: true
  const actionResult = await executeServerAction(
    toolCall.function.name,
    { ...(toolCall.function.arguments as Record<string, unknown>), confirmed: true },
    user,
  );

  // Emit tool result so the UI shows what ran
  onChunk({
    type: 'delta',
    content: `\n[Tool: ${toolCall.function.name}] → ${JSON.stringify(actionResult)}\n`,
    conversation_id: conversationId,
  });

  // Resume conversation: snapshot + assistant tool_calls turn + confirmed tool result
  const resumedConversation: ProviderMessage[] = [
    ...conversationSnapshot,
    { role: 'assistant', content: '', tool_calls: [toolCall] },
    { role: 'tool', content: JSON.stringify(actionResult) },
  ];

  let fullResponse = '';
  const collectResponse = (chunk: ChatStreamChunk) => {
    if (chunk.type === 'delta') fullResponse += chunk.content;
    onChunk({ ...chunk, conversation_id: conversationId });
  };

  try {
    await streamOllama(resumedConversation, conversationId, model, settings, collectResponse, user);
  } catch (err: any) {
    onChunk({ type: 'error', content: err.message, conversation_id: conversationId });
    return;
  }

  const assistantMsg = await repo.addMessage(conversationId, 'assistant', fullResponse);
  await repo.touchConversation(conversationId);

  onChunk({
    type: 'done',
    content: '',
    conversation_id: conversationId,
    message_id: assistantMsg.id,
    model,
  });
};

// ---------------------------------------------------------------------------
// Provider: Ollama (streaming)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Ollama streaming helper — reads NDJSON lines from the response body and
// returns:
//   • text deltas via onChunk
//   • the list of tool_calls if the model wants to invoke tools (no text yet)
// ---------------------------------------------------------------------------

interface OllamaStreamResult {
  toolCalls: OllamaToolCall[];
}

const readOllamaStream = async (
  res: Response,
  onChunk: (chunk: ChatStreamChunk) => void,
): Promise<OllamaStreamResult> => {
  const reader = res.body?.getReader();
  if (!reader) throw createError('No response stream from Ollama', 502);

  const decoder = new TextDecoder();
  let buffer = '';
  const toolCalls: OllamaToolCall[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);

        // Regular text delta
        if (parsed.message?.content) {
          onChunk({ type: 'delta', content: parsed.message.content });
        }

        // Tool-call block — collect all calls from this turn
        if (Array.isArray(parsed.message?.tool_calls)) {
          for (const tc of parsed.message.tool_calls as OllamaToolCall[]) {
            toolCalls.push(tc);
          }
        }
      } catch {
        // Ignore malformed NDJSON lines
      }
    }
  }

  return { toolCalls };
};

// ---------------------------------------------------------------------------
// streamOllama — main entry point for the Ollama provider.
// Runs a tool-call loop:
//   1. Send messages to Ollama
//   2. If the model returns tool_calls, execute them and append results
//   3. Repeat until the model produces a plain text response (no tool_calls)
// ---------------------------------------------------------------------------

const MAX_TOOL_ROUNDS = 20; // Safety cap to prevent infinite loops

const streamOllama = async (
  messages: ProviderMessage[],
  conversationId: string,
  model: string,
  settings: AiSettings,
  onChunk: (chunk: ChatStreamChunk) => void,
  user: SessionUser,
  mode: 'chat' | 'analytics' = 'chat',
): Promise<void> => {
  // Mutable local copy so we can append tool results between rounds
  const conversation: ProviderMessage[] = [...messages as ProviderMessage[]];
  const tools = handleOllamaTools(mode === 'analytics' ? ANALYTICS_TOOL_NAMES : undefined);

  // console.log(`[AI] Ollama streaming: conversationId=${conversationId} model=${model} tools=${tools.map(t => t.function.name).join(', ')}`);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const reqData = {
      model,
      messages: conversation,
      // Disable streaming when tool calls are possible so we receive the full
      // tool_calls array in one payload rather than fragmented across chunks.
      // We re-enable streaming on the final text-only turn below.
      stream: true,
      options: {
        temperature: Float32Array.from([settings.temperature])[0],
        num_predict: settings.max_tokens,
        num_ctx:  8192,
      },
      tools,
    };

    const res = await ollamaFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify(reqData),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => 'unknown error');
      throw createError(`Ollama error (${res.status}): ${body}`, 502);
    }

    const { toolCalls } = await readOllamaStream(res, onChunk);

    // No tool calls → model produced its final text response; we're done.
    if (toolCalls.length === 0) {
      return;
    }

    // -----------------------------------------------------------------------
    // Execute every tool the model requested and build the reply messages.
    // Ollama expects:
    //   1. An "assistant" turn that echoes the tool_calls array
    //   2. One "tool" turn per result
    // -----------------------------------------------------------------------

    // Snapshot before mutating so we can resume from here on confirmation
    const conversationSnapshot = [...conversation];

    // 1. Assistant turn — mirrors what the model decided to call
    conversation.push({
      role: 'assistant',
      content: '',
      tool_calls: toolCalls,
    });

    // Check if the last message was confirm or yes
    const lastMessage = messages[messages.length - 1];
    const lastMessageContent = lastMessage?.content?.trim().toLowerCase() ?? '';
    const isConfirmationResponse = ['confirm', 'yes'].includes(lastMessageContent);


    // 2. Tool result turns — one per call, in the same order
    let awaitingConfirmation = false;
    for (const toolCall of toolCalls) {
      // Defense-in-depth: never execute a tool outside the whitelist offered to the model.
      if (mode === 'analytics' && !ANALYTICS_TOOL_NAMES.includes(toolCall.function.name)) {
        conversation.push({
          role: 'tool',
          content: JSON.stringify({ success: false, error: `Tool "${toolCall.function.name}" is not available in data analysis mode.` }),
        });
        continue;
      }

      const result = await executeEnrichedToolCall(toolCall, user, isConfirmationResponse);

      // Detect requiresConfirmation before feeding result to the model
      let parsedResult: Record<string, unknown> | null = null;
      try { parsedResult = JSON.parse(result.content); } catch { /* ignore */ }

      if (parsedResult?.requiresConfirmation) {
        pendingConfirmations.set(conversationId, {
          conversationSnapshot,
          toolCall,
          model,
          settings,
        });
        onChunk({
          type: 'confirmation_request',
          content: String(parsedResult.confirmationMessage ?? ''),
          conversation_id: conversationId,
          toolName: toolCall.function.name,
          toolArgs: toolCall.function.arguments as Record<string, unknown>,
          confirmationMessage: String(parsedResult.confirmationMessage ?? ''),
        });
        awaitingConfirmation = true;
        break; // stop processing further tool calls in this round
      }

      // Notify the client so the UI can show tool activity
      onChunk({
        type: 'delta',
        content: `\n[Tool: ${toolCall.function.name}] → ${result.content}\n`,
      });

      conversation.push({
        role: 'tool',
        content: result.content,
      });
    }

    if (awaitingConfirmation) return;

    // Loop back — let the model process the tool results and produce its answer
  }

  // Reached the round cap without a plain-text response
  throw createError('Ollama tool-call loop exceeded the maximum number of rounds', 502);
};

// ---------------------------------------------------------------------------
// Provider: OpenAI (streaming)
// ---------------------------------------------------------------------------

const streamOpenAI = async (
  messages: ProviderMessage[],
  model: string,
  settings: AiSettings,
  onChunk: (chunk: ChatStreamChunk) => void,
): Promise<void> => {
  if (!settings.openai_api_key) {
    throw createError('OpenAI API key is not configured', 400);
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.openai_api_key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: settings.temperature,
      max_tokens: settings.max_tokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => 'unknown error');
    throw createError(`OpenAI error (${res.status}): ${body}`, 502);
  }

  const reader = res.body?.getReader();
  if (!reader) throw createError('No response stream from OpenAI', 502);

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          onChunk({ type: 'delta', content: delta });
        }
      } catch {
        // Ignore malformed SSE lines
      }
    }
  }
};

// ---------------------------------------------------------------------------
// Provider: Anthropic (streaming)
// ---------------------------------------------------------------------------

const streamAnthropic = async (
  messages: ProviderMessage[],
  model: string,
  settings: AiSettings,
  onChunk: (chunk: ChatStreamChunk) => void,
): Promise<void> => {
  if (!settings.anthropic_api_key) {
    throw createError('Anthropic API key is not configured', 400);
  }

  // Anthropic separates the system prompt from messages
  const systemMsg = messages.find((m) => m.role === 'system');
  const chatMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.anthropic_api_key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: settings.max_tokens,
      temperature: settings.temperature,
      system: systemMsg?.content ?? '',
      messages: chatMessages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => 'unknown error');
    throw createError(`Anthropic error (${res.status}): ${body}`, 502);
  }

  const reader = res.body?.getReader();
  if (!reader) throw createError('No response stream from Anthropic', 502);

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          onChunk({ type: 'delta', content: parsed.delta.text });
        }
      } catch {
        // Ignore malformed SSE lines
      }
    }
  }
};


// ---------------------------------------------------------------------------
// Provider: DeepSeek (streaming)
// ---------------------------------------------------------------------------
const streamDeepSeek = async (
  messages: ProviderMessage[],
  model: string,
  settings: AiSettings,
  onChunk: (chunk: ChatStreamChunk) => void,
): Promise<void> => {
  if (!settings.deepseek_api_key) {
    throw createError('DeepSeek API key is not configured', 400);
  }

  if (!settings.deepseek_api_key.startsWith('sk-')) {
    throw createError('DeepSeek API key is invalid', 400);
  }

  const reqData = {
    model: model || 'deepseek-chat', // e.g. 'deepseek-chat' or 'deepseek-coder'
    messages,
    stream: true,
    temperature: Float32Array.from([settings.temperature])[0], // DeepSeek expects a float
    max_tokens: Float32Array.from([settings.max_tokens])[0],
  };

  // 1. Correct OpenAI-compatible endpoint URL
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.deepseek_api_key}`,
    },
    body: reqData ? JSON.stringify(reqData) : undefined,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => 'unknown error');
    throw createError(`DeepSeek error (${res.status}): ${body}`, 502);
  }

  const reader = res.body?.getReader();
  if (!reader) throw createError('No response stream from DeepSeek', 502);

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);

      // 2. Handle final stream signal
      if (data === '[DONE]') break;

      try {
        const parsed = JSON.parse(data);

        // 3. DeepSeek uses OpenAI format (choices[0].delta.content)
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          onChunk({ type: 'delta', content });
        }
      } catch {
        // Ignore malformed SSE lines
      }
    }
  }
};

// ---------------------------------------------------------------------------
// Ollama Status & Model Management
// ---------------------------------------------------------------------------

/**
 * Check if Ollama is installed and running, return status info.
 */
export const getOllamaStatus = async (): Promise<OllamaStatusResponse> => {
  const host = await getOllamaHost();
  const result: OllamaStatusResponse = {
    installed: false,
    running: false,
    version: null,
    host,
    models_count: 0,
    gpu_available: false,
  };
  
  const { exec } = require('child_process');

  // Check if the binary exists
  try {

    await exec('ollama --version', (error: any, stdout: string) => {
      if (error) {
        return;
      }

      result.installed = stdout.trim().length > 0;
    });

  } catch {
    // `which` failed — not installed or not in PATH
    result.installed = false;
  }

  // Check if the API is responding
  try {
    const res = await ollamaFetch('/api/version', { host });
    if (res.ok) {
      const data = await res.json() as { version: string };
      result.running = true;
      result.version = data.version;
    }
  } catch {
    result.running = false;
  }

  // Count models
  if (result.running) {
    try {
      const res = await ollamaFetch('/api/tags', { host });
      if (res.ok) {
        const data = await res.json() as { models: OllamaModel[] };
        result.models_count = data.models?.length ?? 0;
      }
    } catch {
      // ignore
    }

    // GPU availability (check running models for VRAM usage)
    try {
      const res = await ollamaFetch('/api/ps', { host });
      if (res.ok) {
        const data = await res.json() as { models: OllamaRunningModel[] };
        result.gpu_available = data.models?.some((m) => m.size_vram > 0) ?? false;
      }
    } catch {
      // ignore
    }
  }

  return result;
};

/**
 * List all locally available models from Ollama.
 */
export const listModels = async (): Promise<OllamaModel[]> => {

  // Check if default model is set in settings, if not, set it to 'llama3.2'
  const settings = await repo.getSettings();
  if (settings?.provider === 'deepseek') {
    return deepseekUpdateSettings(settings);
  }
  const res = await ollamaFetch('/api/tags');
  if (!res.ok) {
    throw createError(`Failed to list models: Ollama returned ${res.status} ${JSON.stringify(settings)}`, 502);
  }
  const data = await res.json() as { models: OllamaModel[] };
  return data.models ?? [];
};

const deepseekUpdateSettings = async (settings: Partial<AiSettingsInput>): Promise<OllamaModel[]> => {

  const defModel: OllamaModel = {
    name: settings?.provider ?? '',
    model: settings?.default_model ?? '',
    modified_at: new Date().toISOString(),
    size: 0,
    digest: '',
    details: {
      parent_model: '',
      format: '',
      family: '',
      families: null,
      parameter_size: '',
      quantization_level: '',
    },
  };
  return [defModel]; // DeepSeek does not use Ollama models
}

/**
 * Get detailed info about a specific model.
 */
export const getModelInfo = async (modelName: string): Promise<OllamaModelInfo> => {
  const res = await ollamaFetch('/api/show', {
    method: 'POST',
    body: JSON.stringify({ name: modelName }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw createError(`Model not found: ${body || modelName}`, 404);
  }
  return res.json() as Promise<OllamaModelInfo>;
};

/**
 * Pull (download) a model from the Ollama registry.
 * Streams progress events to the callback.
 */
export const pullModel = async (
  modelName: string,
  onProgress: (progress: OllamaPullProgress) => void,
): Promise<void> => {
  const res = await ollamaFetch('/api/pull', {
    method: 'POST',
    body: JSON.stringify({ name: modelName, stream: true }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => 'unknown');
    throw createError(`Failed to pull model: ${body}`, 502);
  }

  const reader = res.body?.getReader();
  if (!reader) throw createError('No response stream from Ollama', 502);

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line) as OllamaPullProgress;
        onProgress(parsed);
      } catch {
        // Ignore malformed lines
      }
    }
  }
};

/**
 * Delete a model from Ollama.
 */
export const deleteModel = async (modelName: string): Promise<void> => {
  const res = await ollamaFetch('/api/delete', {
    method: 'DELETE',
    body: JSON.stringify({ name: modelName }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw createError(`Failed to delete model: ${body || modelName}`, 400);
  }
};

/**
 * Get currently running (loaded into memory) models.
 */
export const getRunningModels = async (): Promise<OllamaRunningModel[]> => {
  const res = await ollamaFetch('/api/ps');
  if (!res.ok) {
    throw createError(`Failed to list running models: Ollama returned ${res.status}`, 502);
  }
  const data = await res.json() as { models: OllamaRunningModel[] };
  return data.models ?? [];
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/**
 * Get the current AI settings, or sensible defaults if none exist yet.
 */
export const getSettingsOrDefaults = async (): Promise<AiSettings> => {
  const existing = await repo.getSettings();
  if (existing) return existing;
  return repo.upsertSettings({}); // inserts defaults
};

/**
 * Update AI settings (partial update supported).
 */
export const updateSettings = async (data: AiSettingsInput): Promise<AiSettings> => {
  return repo.upsertSettings(data);
};

// ---------------------------------------------------------------------------
// Conversation management (delegated to repository)
// ---------------------------------------------------------------------------

export const listConversations = async (userId: string): Promise<AiConversation[]> => {
  return repo.listConversations(userId);
};

export const getConversation = async (id: string, userId: string): Promise<{ conversation: AiConversation; messages: AiMessage[] }> => {
  const result = await repo.getConversationWithMessages(id);
  if (!result) throw createError('Conversation not found', 404);
  if (result.conversation.user_id !== userId) throw createError('Access denied', 403);
  return result;
};

export const deleteConversation = async (id: string, userId: string): Promise<void> => {
  const conv = await repo.getConversation(id);
  if (!conv) throw createError('Conversation not found', 404);
  if (conv.user_id !== userId) throw createError('Access denied', 403);
  await repo.deleteConversation(id);
};
