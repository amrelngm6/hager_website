// ---------------------------------------------------------------------------
// AI Module — Routes
// ---------------------------------------------------------------------------

import { Router } from 'express';
import {
  chat,
  confirmAction,
  getStatus,
  getSettings,
  updateSettings,
  listModels,
  pullModel,
  deleteModel,
  getModelInfo,
  getRunningModels,
  listConversations,
  getConversation,
  deleteConversation,
} from './ai.controller';
import { requireAuth} from '../../middlewares/auth.middleware';

const router = Router();

// All AI endpoints require authentication
router.use(requireAuth);

// ─── Chat ────────────────────────────────────────────────────────────────────
router.post('/', chat);
router.post('/confirm/:id', confirmAction);

// ─── Ollama Status ───────────────────────────────────────────────────────────
router.get('/status', getStatus);

// ─── Settings ────────────────────────────────────────────────────────────────
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// ─── Model Management ───────────────────────────────────────────────────────
router.get('/models', listModels);
router.get('/models/running', getRunningModels);
router.post('/models/pull', pullModel);
router.get('/models/:name', getModelInfo);
router.delete('/models/:name', deleteModel);

// ─── Conversations ───────────────────────────────────────────────────────────
router.get('/conversations', listConversations);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);

export { router as aiRouter };
