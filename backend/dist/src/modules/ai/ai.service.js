"use strict";
// ---------------------------------------------------------------------------
// AI Module — Service Layer
// Business logic for chat, model management, Ollama/Cloud integration.
// No raw SQL here — all DB access is delegated to ai.repository.ts.
// ---------------------------------------------------------------------------
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversation = exports.getConversation = exports.listConversations = exports.updateSettings = exports.getSettingsOrDefaults = exports.getRunningModels = exports.deleteModel = exports.pullModel = exports.getModelInfo = exports.listModels = exports.getOllamaStatus = exports.confirmPendingAction = exports.chat = exports.resolveSafePath = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const error_middleware_1 = require("../../middlewares/error.middleware");
const repo = __importStar(require("./ai.repository"));
// import { agentClient } from '../../agent/client';
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const WEB_ROOT = process.env.WEB_ROOT || path_1.default.resolve(__dirname, '../../../webroot');
const securepath_helper_1 = require("../../helper/securepath.helper");
const ai_ollama_helper_1 = require("./ai.ollama.helper");
const ai_action_executor_1 = require("./ai.action.executor");
const pendingConfirmations = new Map();
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
const resolveSafePath = (sentFilePath, user) => {
    const filePath = (sentFilePath || '/').trim();
    const relative = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const resolvedPath = path_1.default.resolve(WEB_ROOT, relative);
    if (resolvedPath === WEB_ROOT || resolvedPath.startsWith(WEB_ROOT + path_1.default.sep)) {
        return (0, securepath_helper_1.securePath)(resolvedPath, WEB_ROOT);
    }
    throw (0, error_middleware_1.createError)(`Access denied: ${resolvedPath} is outside the allowed directory`, 403);
};
exports.resolveSafePath = resolveSafePath;
const ANALYTICS_SYSTEM_PROMPT = 'You are in data analysis & reporting mode. Follow these steps strictly:\n' +
    '1. Call get_database_schema first to learn the exact table and column names — never guess them.\n' +
    '2. Write a single read-only SELECT statement and call run_report_query to fetch the data you need.\n' +
    '3. Once you have the rows, call generate_report_chart with a chart_type (bar, line, area, pie, or table), ' +
    'a clear title, and a series array of {label, value} points summarizing the result.\n' +
    '4. After the chart is rendered, briefly explain the key insight in plain text.\n' +
    'Only use the tools provided to you in this mode. Never attempt to modify data.';
/**
 * Resolve the Ollama host URL from saved settings (or fallback default).
 */
const getOllamaHost = async () => {
    const settings = await repo.getSettings();
    return settings?.ollama_host ?? 'http://localhost:11434';
};
/**
 * Convenience wrapper for Ollama HTTP calls using native `fetch`.
 */
const ollamaFetch = async (path, init) => {
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
const extractFileReferences = (message) => {
    const refs = [];
    let match;
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
const readFileContent = async (filePath) => {
    const MAX_FILE_SIZE = 64 * 1024; // 64 KB limit per file
    const stat = await promises_1.default.stat(filePath);
    if (!stat.isFile()) {
        throw (0, error_middleware_1.createError)(`Not a regular file: ${filePath}`, 400);
    }
    if (stat.size > MAX_FILE_SIZE) {
        const buffer = Buffer.alloc(MAX_FILE_SIZE);
        const fd = await promises_1.default.open(filePath, 'r');
        try {
            await fd.read(buffer, 0, MAX_FILE_SIZE, 0);
        }
        finally {
            await fd.close();
        }
        return buffer.toString('utf-8') + '\n\n[...file truncated at 64 KB...]';
    }
    return promises_1.default.readFile(filePath, 'utf-8');
};
/**
 * Build system context from file references in the user message.
 */
const buildFileContext = async (message, user) => {
    const refs = extractFileReferences(message);
    if (refs.length === 0) {
        return { cleanMessage: message, fileContext: '', fileRefs: [] };
    }
    const contextParts = [];
    const validRefs = [];
    for (const ref of refs) {
        try {
            const resolvedPath = (0, exports.resolveSafePath)(ref, user);
            const content = await readFileContent(resolvedPath);
            contextParts.push(`--- File: ${resolvedPath} ---\n${content}\n--- End of file ---`);
            validRefs.push(resolvedPath);
        }
        catch (err) {
            throw (0, error_middleware_1.createError)(`Mentioned file "${ref}" path: ${(0, exports.resolveSafePath)(ref, user)} and cannot be accessed (${err.message})`, 400);
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
const chat = async (request, user, onChunk) => {
    const settings = await (0, exports.getSettingsOrDefaults)();
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
    let fileRefs = [];
    try {
        const res = await buildFileContext(request.message, user);
        cleanMessage = res.cleanMessage;
        fileContext = res.fileContext;
        fileRefs = res.fileRefs;
    }
    catch (err) {
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
    }
    else {
        const existing = await repo.getConversation(conversationId);
        if (!existing) {
            throw (0, error_middleware_1.createError)('Conversation not found', 404);
        }
        if (existing.user_id !== user.id) {
            throw (0, error_middleware_1.createError)('Access denied', 403);
        }
    }
    // 3. Save the user message
    await repo.addMessage(conversationId, 'user', request.message, fileRefs);
    // 4. Build the message list for the provider
    const history = await repo.getMessages(conversationId);
    const providerMessages = [];
    // System prompt
    const systemParts = [settings.system_prompt];
    if (fileContext) {
        systemParts.push('The user has referenced the following file(s). Use this content to answer their question:\n\n' +
            fileContext);
    }
    if (mode === 'analytics') {
        systemParts.push(ANALYTICS_SYSTEM_PROMPT);
    }
    providerMessages.push({ role: 'system', content: systemParts.join('\n\n') });
    // Conversation history (exclude the current user message — we'll add the clean version)
    for (const msg of history.slice(0, -1)) {
        providerMessages.push({ role: msg.role, content: msg.content });
    }
    providerMessages.push({ role: 'user', content: cleanMessage || request.message });
    // 5. Route to the correct provider
    let fullResponse = '';
    const collectResponse = (chunk) => {
        if (chunk.type === 'delta') {
            fullResponse += chunk.content;
        }
        onChunk({ ...chunk, conversation_id: conversationId });
    };
    try {
        switch (settings.provider) {
            case 'ollama':
                await streamOllama(providerMessages, conversationId, model, settings, collectResponse, user, mode);
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
                throw (0, error_middleware_1.createError)(`Unsupported provider: ${settings.provider}`, 400);
        }
    }
    catch (err) {
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
exports.chat = chat;
// ---------------------------------------------------------------------------
// Confirm pending action — called when user approves via the UI dialog
// ---------------------------------------------------------------------------
const confirmPendingAction = async (conversationId, user, onChunk) => {
    const pending = pendingConfirmations.get(conversationId);
    if (!pending) {
        onChunk({ type: 'error', content: 'No pending action found. Please retry your request.', conversation_id: conversationId });
        return;
    }
    pendingConfirmations.delete(conversationId);
    const { conversationSnapshot, toolCall, model, settings } = pending;
    // Execute with confirmed: true
    const actionResult = await (0, ai_action_executor_1.executeServerAction)(toolCall.function.name, { ...toolCall.function.arguments, confirmed: true }, user);
    // Emit tool result so the UI shows what ran
    onChunk({
        type: 'delta',
        content: `\n[Tool: ${toolCall.function.name}] → ${JSON.stringify(actionResult)}\n`,
        conversation_id: conversationId,
    });
    // Resume conversation: snapshot + assistant tool_calls turn + confirmed tool result
    const resumedConversation = [
        ...conversationSnapshot,
        { role: 'assistant', content: '', tool_calls: [toolCall] },
        { role: 'tool', content: JSON.stringify(actionResult) },
    ];
    let fullResponse = '';
    const collectResponse = (chunk) => {
        if (chunk.type === 'delta')
            fullResponse += chunk.content;
        onChunk({ ...chunk, conversation_id: conversationId });
    };
    try {
        await streamOllama(resumedConversation, conversationId, model, settings, collectResponse, user);
    }
    catch (err) {
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
exports.confirmPendingAction = confirmPendingAction;
const readOllamaStream = async (res, onChunk) => {
    const reader = res.body?.getReader();
    if (!reader)
        throw (0, error_middleware_1.createError)('No response stream from Ollama', 502);
    const decoder = new TextDecoder();
    let buffer = '';
    const toolCalls = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const parsed = JSON.parse(line);
                // Regular text delta
                if (parsed.message?.content) {
                    onChunk({ type: 'delta', content: parsed.message.content });
                }
                // Tool-call block — collect all calls from this turn
                if (Array.isArray(parsed.message?.tool_calls)) {
                    for (const tc of parsed.message.tool_calls) {
                        toolCalls.push(tc);
                    }
                }
            }
            catch {
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
const streamOllama = async (messages, conversationId, model, settings, onChunk, user, mode = 'chat') => {
    // Mutable local copy so we can append tool results between rounds
    const conversation = [...messages];
    const tools = (0, ai_ollama_helper_1.handleOllamaTools)(mode === 'analytics' ? ai_ollama_helper_1.ANALYTICS_TOOL_NAMES : undefined);
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
                num_ctx: 8192,
            },
            tools,
        };
        const res = await ollamaFetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify(reqData),
        });
        if (!res.ok) {
            const body = await res.text().catch(() => 'unknown error');
            throw (0, error_middleware_1.createError)(`Ollama error (${res.status}): ${body}`, 502);
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
            if (mode === 'analytics' && !ai_ollama_helper_1.ANALYTICS_TOOL_NAMES.includes(toolCall.function.name)) {
                conversation.push({
                    role: 'tool',
                    content: JSON.stringify({ success: false, error: `Tool "${toolCall.function.name}" is not available in data analysis mode.` }),
                });
                continue;
            }
            const result = await (0, ai_ollama_helper_1.executeEnrichedToolCall)(toolCall, user, isConfirmationResponse);
            // Detect requiresConfirmation before feeding result to the model
            let parsedResult = null;
            try {
                parsedResult = JSON.parse(result.content);
            }
            catch { /* ignore */ }
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
                    toolArgs: toolCall.function.arguments,
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
        if (awaitingConfirmation)
            return;
        // Loop back — let the model process the tool results and produce its answer
    }
    // Reached the round cap without a plain-text response
    throw (0, error_middleware_1.createError)('Ollama tool-call loop exceeded the maximum number of rounds', 502);
};
// ---------------------------------------------------------------------------
// Provider: OpenAI (streaming)
// ---------------------------------------------------------------------------
const streamOpenAI = async (messages, model, settings, onChunk) => {
    if (!settings.openai_api_key) {
        throw (0, error_middleware_1.createError)('OpenAI API key is not configured', 400);
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
        throw (0, error_middleware_1.createError)(`OpenAI error (${res.status}): ${body}`, 502);
    }
    const reader = res.body?.getReader();
    if (!reader)
        throw (0, error_middleware_1.createError)('No response stream from OpenAI', 502);
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: '))
                continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]')
                return;
            try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                    onChunk({ type: 'delta', content: delta });
                }
            }
            catch {
                // Ignore malformed SSE lines
            }
        }
    }
};
// ---------------------------------------------------------------------------
// Provider: Anthropic (streaming)
// ---------------------------------------------------------------------------
const streamAnthropic = async (messages, model, settings, onChunk) => {
    if (!settings.anthropic_api_key) {
        throw (0, error_middleware_1.createError)('Anthropic API key is not configured', 400);
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
        throw (0, error_middleware_1.createError)(`Anthropic error (${res.status}): ${body}`, 502);
    }
    const reader = res.body?.getReader();
    if (!reader)
        throw (0, error_middleware_1.createError)('No response stream from Anthropic', 502);
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: '))
                continue;
            const data = trimmed.slice(6);
            try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    onChunk({ type: 'delta', content: parsed.delta.text });
                }
            }
            catch {
                // Ignore malformed SSE lines
            }
        }
    }
};
// ---------------------------------------------------------------------------
// Provider: DeepSeek (streaming)
// ---------------------------------------------------------------------------
const streamDeepSeek = async (messages, model, settings, onChunk) => {
    if (!settings.deepseek_api_key) {
        throw (0, error_middleware_1.createError)('DeepSeek API key is not configured', 400);
    }
    if (!settings.deepseek_api_key.startsWith('sk-')) {
        throw (0, error_middleware_1.createError)('DeepSeek API key is invalid', 400);
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
        throw (0, error_middleware_1.createError)(`DeepSeek error (${res.status}): ${body}`, 502);
    }
    const reader = res.body?.getReader();
    if (!reader)
        throw (0, error_middleware_1.createError)('No response stream from DeepSeek', 502);
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: '))
                continue;
            const data = trimmed.slice(6);
            // 2. Handle final stream signal
            if (data === '[DONE]')
                break;
            try {
                const parsed = JSON.parse(data);
                // 3. DeepSeek uses OpenAI format (choices[0].delta.content)
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                    onChunk({ type: 'delta', content });
                }
            }
            catch {
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
const getOllamaStatus = async () => {
    const host = await getOllamaHost();
    const result = {
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
        await exec('ollama --version', (error, stdout) => {
            if (error) {
                return;
            }
            result.installed = stdout.trim().length > 0;
        });
    }
    catch {
        // `which` failed — not installed or not in PATH
        result.installed = false;
    }
    // Check if the API is responding
    try {
        const res = await ollamaFetch('/api/version', { host });
        if (res.ok) {
            const data = await res.json();
            result.running = true;
            result.version = data.version;
        }
    }
    catch {
        result.running = false;
    }
    // Count models
    if (result.running) {
        try {
            const res = await ollamaFetch('/api/tags', { host });
            if (res.ok) {
                const data = await res.json();
                result.models_count = data.models?.length ?? 0;
            }
        }
        catch {
            // ignore
        }
        // GPU availability (check running models for VRAM usage)
        try {
            const res = await ollamaFetch('/api/ps', { host });
            if (res.ok) {
                const data = await res.json();
                result.gpu_available = data.models?.some((m) => m.size_vram > 0) ?? false;
            }
        }
        catch {
            // ignore
        }
    }
    return result;
};
exports.getOllamaStatus = getOllamaStatus;
/**
 * List all locally available models from Ollama.
 */
const listModels = async () => {
    // Check if default model is set in settings, if not, set it to 'llama3.2'
    const settings = await repo.getSettings();
    if (settings?.provider === 'deepseek') {
        return deepseekUpdateSettings(settings);
    }
    const res = await ollamaFetch('/api/tags');
    if (!res.ok) {
        throw (0, error_middleware_1.createError)(`Failed to list models: Ollama returned ${res.status} ${JSON.stringify(settings)}`, 502);
    }
    const data = await res.json();
    return data.models ?? [];
};
exports.listModels = listModels;
const deepseekUpdateSettings = async (settings) => {
    const defModel = {
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
};
/**
 * Get detailed info about a specific model.
 */
const getModelInfo = async (modelName) => {
    const res = await ollamaFetch('/api/show', {
        method: 'POST',
        body: JSON.stringify({ name: modelName }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw (0, error_middleware_1.createError)(`Model not found: ${body || modelName}`, 404);
    }
    return res.json();
};
exports.getModelInfo = getModelInfo;
/**
 * Pull (download) a model from the Ollama registry.
 * Streams progress events to the callback.
 */
const pullModel = async (modelName, onProgress) => {
    const res = await ollamaFetch('/api/pull', {
        method: 'POST',
        body: JSON.stringify({ name: modelName, stream: true }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => 'unknown');
        throw (0, error_middleware_1.createError)(`Failed to pull model: ${body}`, 502);
    }
    const reader = res.body?.getReader();
    if (!reader)
        throw (0, error_middleware_1.createError)('No response stream from Ollama', 502);
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const parsed = JSON.parse(line);
                onProgress(parsed);
            }
            catch {
                // Ignore malformed lines
            }
        }
    }
};
exports.pullModel = pullModel;
/**
 * Delete a model from Ollama.
 */
const deleteModel = async (modelName) => {
    const res = await ollamaFetch('/api/delete', {
        method: 'DELETE',
        body: JSON.stringify({ name: modelName }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw (0, error_middleware_1.createError)(`Failed to delete model: ${body || modelName}`, 400);
    }
};
exports.deleteModel = deleteModel;
/**
 * Get currently running (loaded into memory) models.
 */
const getRunningModels = async () => {
    const res = await ollamaFetch('/api/ps');
    if (!res.ok) {
        throw (0, error_middleware_1.createError)(`Failed to list running models: Ollama returned ${res.status}`, 502);
    }
    const data = await res.json();
    return data.models ?? [];
};
exports.getRunningModels = getRunningModels;
// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
/**
 * Get the current AI settings, or sensible defaults if none exist yet.
 */
const getSettingsOrDefaults = async () => {
    const existing = await repo.getSettings();
    if (existing)
        return existing;
    return repo.upsertSettings({}); // inserts defaults
};
exports.getSettingsOrDefaults = getSettingsOrDefaults;
/**
 * Update AI settings (partial update supported).
 */
const updateSettings = async (data) => {
    return repo.upsertSettings(data);
};
exports.updateSettings = updateSettings;
// ---------------------------------------------------------------------------
// Conversation management (delegated to repository)
// ---------------------------------------------------------------------------
const listConversations = async (userId) => {
    return repo.listConversations(userId);
};
exports.listConversations = listConversations;
const getConversation = async (id, userId) => {
    const result = await repo.getConversationWithMessages(id);
    if (!result)
        throw (0, error_middleware_1.createError)('Conversation not found', 404);
    if (result.conversation.user_id !== userId)
        throw (0, error_middleware_1.createError)('Access denied', 403);
    return result;
};
exports.getConversation = getConversation;
const deleteConversation = async (id, userId) => {
    const conv = await repo.getConversation(id);
    if (!conv)
        throw (0, error_middleware_1.createError)('Conversation not found', 404);
    if (conv.user_id !== userId)
        throw (0, error_middleware_1.createError)('Access denied', 403);
    await repo.deleteConversation(id);
};
exports.deleteConversation = deleteConversation;
//# sourceMappingURL=ai.service.js.map