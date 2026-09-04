"use strict";
// ---------------------------------------------------------------------------
// AI Module — Routes
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const ai_controller_1 = require("./ai.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
exports.aiRouter = router;
// All AI endpoints require authentication
router.use(auth_middleware_1.requireAuth);
// ─── Chat ────────────────────────────────────────────────────────────────────
router.post('/', ai_controller_1.chat);
router.post('/confirm/:id', ai_controller_1.confirmAction);
// ─── Ollama Status ───────────────────────────────────────────────────────────
router.get('/status', ai_controller_1.getStatus);
// ─── Settings ────────────────────────────────────────────────────────────────
router.get('/settings', ai_controller_1.getSettings);
router.put('/settings', ai_controller_1.updateSettings);
// ─── Model Management ───────────────────────────────────────────────────────
router.get('/models', ai_controller_1.listModels);
router.get('/models/running', ai_controller_1.getRunningModels);
router.post('/models/pull', ai_controller_1.pullModel);
router.get('/models/:name', ai_controller_1.getModelInfo);
router.delete('/models/:name', ai_controller_1.deleteModel);
// ─── Conversations ───────────────────────────────────────────────────────────
router.get('/conversations', ai_controller_1.listConversations);
router.get('/conversations/:id', ai_controller_1.getConversation);
router.delete('/conversations/:id', ai_controller_1.deleteConversation);
//# sourceMappingURL=ai.routes.js.map