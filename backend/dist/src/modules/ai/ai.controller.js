"use strict";
// ---------------------------------------------------------------------------
// AI Module — Controller
// Thin HTTP handlers: parse request → call service → send response.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversation = exports.getConversation = exports.listConversations = exports.updateSettings = exports.getSettings = exports.getRunningModels = exports.deleteModel = exports.pullModel = exports.getModelInfo = exports.listModels = exports.getStatus = exports.confirmAction = exports.chat = void 0;
const aiService = __importStar(require("./ai.service"));
// ---------------------------------------------------------------------------
// Chat (SSE streaming)
// ---------------------------------------------------------------------------
const chat = async (req, res, next) => {
    try {
        const { message, conversation_id, model, mode } = req.body;
        if (!message || typeof message !== 'string' || !message.trim()) {
            res.status(400).json({ message: 'message is required' });
            return;
        }
        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
        res.flushHeaders();
        const onChunk = (chunk) => {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        };
        await aiService.chat({ message: message.trim(), conversation_id, model, mode: mode === 'analytics' ? 'analytics' : undefined }, req.user, onChunk);
        res.end();
    }
    catch (err) {
        // If headers already sent (SSE started), send error as SSE event
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`);
            res.end();
        }
        else {
            next(err);
        }
    }
};
exports.chat = chat;
// ---------------------------------------------------------------------------
// Confirm pending action (SSE streaming)
// ---------------------------------------------------------------------------
const confirmAction = async (req, res, next) => {
    try {
        const { id: conversationId } = req.params;
        if (!conversationId) {
            res.status(400).json({ message: 'conversationId is required' });
            return;
        }
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
        const onChunk = (chunk) => {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        };
        await aiService.confirmPendingAction(conversationId, req.user, onChunk);
        res.end();
    }
    catch (err) {
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`);
            res.end();
        }
        else {
            next(err);
        }
    }
};
exports.confirmAction = confirmAction;
// ---------------------------------------------------------------------------
// Ollama Status
// ---------------------------------------------------------------------------
const getStatus = async (_req, res, next) => {
    try {
        const status = await aiService.getOllamaStatus();
        res.json(status);
    }
    catch (err) {
        next(err);
    }
};
exports.getStatus = getStatus;
// ---------------------------------------------------------------------------
// Model Management
// ---------------------------------------------------------------------------
const listModels = async (_req, res, next) => {
    try {
        const models = await aiService.listModels();
        res.json({ models });
    }
    catch (err) {
        next(err);
    }
};
exports.listModels = listModels;
const getModelInfo = async (req, res, next) => {
    try {
        const info = await aiService.getModelInfo(req.params.name);
        res.json(info);
    }
    catch (err) {
        next(err);
    }
};
exports.getModelInfo = getModelInfo;
const pullModel = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) {
            res.status(400).json({ message: 'model name is required' });
            return;
        }
        // Stream pull progress via SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
        await aiService.pullModel(name, (progress) => {
            res.write(`data: ${JSON.stringify(progress)}\n\n`);
        });
        res.write(`data: ${JSON.stringify({ status: 'success' })}\n\n`);
        res.end();
    }
    catch (err) {
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ status: 'error', error: err.message })}\n\n`);
            res.end();
        }
        else {
            next(err);
        }
    }
};
exports.pullModel = pullModel;
const deleteModel = async (req, res, next) => {
    try {
        await aiService.deleteModel(req.params.name);
        res.json({ message: 'Model deleted' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteModel = deleteModel;
const getRunningModels = async (_req, res, next) => {
    try {
        const models = await aiService.getRunningModels();
        res.json({ models });
    }
    catch (err) {
        next(err);
    }
};
exports.getRunningModels = getRunningModels;
// ---------------------------------------------------------------------------
// Ollama Installation
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
const getSettings = async (_req, res, next) => {
    try {
        const settings = await aiService.getSettingsOrDefaults();
        // Mask API keys in the response
        res.json({
            ...settings,
            openai_api_key: settings.openai_api_key ? '••••' + settings.openai_api_key.slice(-4) : null,
            anthropic_api_key: settings.anthropic_api_key ? '••••' + settings.anthropic_api_key.slice(-4) : null,
            deepseek_api_key: settings.deepseek_api_key ? '••••' + settings.deepseek_api_key.slice(-4) : null,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res, next) => {
    try {
        const settings = await aiService.updateSettings(req.body);
        res.json(settings);
    }
    catch (err) {
        next(err);
    }
};
exports.updateSettings = updateSettings;
// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------
const listConversations = async (req, res, next) => {
    try {
        const conversations = await aiService.listConversations(req.user.id);
        res.json({ conversations });
    }
    catch (err) {
        next(err);
    }
};
exports.listConversations = listConversations;
const getConversation = async (req, res, next) => {
    try {
        const result = await aiService.getConversation(req.params.id, req.user.id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
};
exports.getConversation = getConversation;
const deleteConversation = async (req, res, next) => {
    try {
        await aiService.deleteConversation(req.params.id, req.user.id);
        res.json({ message: 'Conversation deleted' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteConversation = deleteConversation;
//# sourceMappingURL=ai.controller.js.map