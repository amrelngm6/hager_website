"use strict";
// modules/ai/ai.action.executor.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeServerAction = void 0;
const ai_action_registry_1 = require("./ai.action.registry");
// ── Safety config ────────────────────────────────────────────────────────────
// Tools that require user confirmation before executing.
// The model must first ask the user, then re-call the tool with confirmed: true.
const DESTRUCTIVE_TOOLS = new Set([
    'create_email_account',
    'create_database',
    'change_php_version',
    //   'issue_ssl_certificate',
    //   'add_dns_record',
    'create_subdomain',
    'create_ftp_account',
    'restart_service',
]);
// Tools that only admins can call regardless of confirmation.
const ADMIN_ONLY_TOOLS = new Set([
    'restart_service',
    'get_system_info',
]);
const executeServerAction = async (toolName, args, user) => {
    console.log(`[AI] Executing server action: ${toolName} with args:`, args);
    const action = (0, ai_action_registry_1.getAction)(toolName);
    if (!action) {
        return {
            success: false,
            error: `Unknown server action: "${toolName}"`,
        };
    }
    // Confirmation
    if (action.destructive && args.confirmed !== true) {
        return {
            success: false,
            requiresConfirmation: true,
            confirmationMessage: buildConfirmationMessage(toolName, args),
        };
    }
    try {
        const result = await action.execute(args, { user });
        await auditLog(user, toolName, args, true);
        return {
            success: true,
            data: result,
        };
    }
    catch (err) {
        await auditLog(user, toolName, args, false, err.message);
        return {
            success: false,
            error: err.message ?? 'Action failed',
        };
    }
};
exports.executeServerAction = executeServerAction;
// ── Helpers ──────────────────────────────────────────────────────────────────
const buildConfirmationMessage = (toolName, args) => {
    // Strip the confirmed flag from the display
    const { confirmed, ...displayArgs } = args;
    return (`This action (${toolName}) will make changes to your server:\n` +
        `\`\`\`json\n${JSON.stringify(displayArgs, null, 2)}\n\`\`\`\n` +
        `Please confirm by saying "yes" or "confirm".`);
};
const auditLog = async (user, tool, args, success, error) => {
    // Write to your DB or a log file — this is essential for traceability
    // Example: repo.insertAiAuditLog({ user_id: user.id, tool, args, success, error })
    console.log(`[AI-AUDIT] user=${user.id} tool=${tool} ok=${success}`, error ?? '');
};
const generateRandomPassword = (length = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};
//# sourceMappingURL=ai.action.executor.js.map