// ---------------------------------------------------------------------------
// AI Module — Controller
// Thin HTTP handlers: parse request → call service → send response.
// ---------------------------------------------------------------------------

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as aiService from './ai.service';
import type { ChatStreamChunk } from './ai.types';

// ---------------------------------------------------------------------------
// Chat (SSE streaming)
// ---------------------------------------------------------------------------

export const chat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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

    const onChunk = (chunk: ChatStreamChunk) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    };

    await aiService.chat(
      { message: message.trim(), conversation_id, model, mode: mode === 'analytics' ? 'analytics' : undefined },
      req.user!,
      onChunk,
    );

    res.end();
  } catch (err) {
    // If headers already sent (SSE started), send error as SSE event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', content: (err as Error).message })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
};

// ---------------------------------------------------------------------------
// Confirm pending action (SSE streaming)
// ---------------------------------------------------------------------------

export const confirmAction = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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

    const onChunk = (chunk: ChatStreamChunk) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    };

    await aiService.confirmPendingAction(conversationId, req.user!, onChunk);
    res.end();
  } catch (err) {
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', content: (err as Error).message })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
};

// ---------------------------------------------------------------------------
// Ollama Status
// ---------------------------------------------------------------------------

export const getStatus = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const status = await aiService.getOllamaStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Model Management
// ---------------------------------------------------------------------------

export const listModels = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const models = await aiService.listModels();
    res.json({ models });
  } catch (err) {
    next(err);
  }
};

export const getModelInfo = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const info = await aiService.getModelInfo(req.params.name);
    res.json(info);
  } catch (err) {
    next(err);
  }
};

export const pullModel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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
  } catch (err) {
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ status: 'error', error: (err as Error).message })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
};

export const deleteModel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await aiService.deleteModel(req.params.name);
    res.json({ message: 'Model deleted' });
  } catch (err) {
    next(err);
  }
};

export const getRunningModels = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const models = await aiService.getRunningModels();
    res.json({ models });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Ollama Installation
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const getSettings = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const settings = await aiService.getSettingsOrDefaults();
    // Mask API keys in the response
    res.json({
      ...settings,
      openai_api_key: settings.openai_api_key ? '••••' + settings.openai_api_key.slice(-4) : null,
      anthropic_api_key: settings.anthropic_api_key ? '••••' + settings.anthropic_api_key.slice(-4) : null,
      deepseek_api_key: settings.deepseek_api_key ? '••••' + settings.deepseek_api_key.slice(-4) : null,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const settings = await aiService.updateSettings(req.body);
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export const listConversations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const conversations = await aiService.listConversations(req.user!.id);
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

export const getConversation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await aiService.getConversation(req.params.id, req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteConversation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await aiService.deleteConversation(req.params.id, req.user!.id);
    res.json({ message: 'Conversation deleted' });
  } catch (err) {
    next(err);
  }
};
