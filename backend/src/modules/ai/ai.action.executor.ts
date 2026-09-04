// modules/ai/ai.action.executor.ts

import { SessionUser } from '../../types';
import { getAction } from './ai.action.registry';

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

// ── Executor ─────────────────────────────────────────────────────────────────

export interface ActionResult {
    success: boolean;
    data?: unknown;
    error?: string;
    requiresConfirmation?: boolean;   // tells the model to ask the user first
    confirmationMessage?: string;     // human-readable "are you sure?" text
}


export const executeServerAction = async (
    toolName: string,
    args: Record<string, unknown>,
    user: SessionUser,
): Promise<ActionResult> => {

    console.log(`[AI] Executing server action: ${toolName} with args:`, args);

    const action = getAction(toolName);

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
            confirmationMessage: buildConfirmationMessage(
                toolName,
                args,
            ),
        };
    }

    try {

        const result = await action.execute(
            args,
            { user },
        );

        await auditLog(
            user,
            toolName,
            args,
            true,
        );

        return {
            success: true,
            data: result,
        };

    } catch (err: any) {

        await auditLog(
            user,
            toolName,
            args,
            false,
            err.message,
        );

        return {
            success: false,
            error: err.message ?? 'Action failed',
        };
    }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const buildConfirmationMessage = (
    toolName: string,
    args: Record<string, unknown>,
): string => {
    // Strip the confirmed flag from the display
    const { confirmed, ...displayArgs } = args;
    return (
        `This action (${toolName}) will make changes to your server:\n` +
        `\`\`\`json\n${JSON.stringify(displayArgs, null, 2)}\n\`\`\`\n` +
        `Please confirm by saying "yes" or "confirm".`
    );
};

const auditLog = async (
    user: SessionUser,
    tool: string,
    args: Record<string, unknown>,
    success: boolean,
    error?: string,
): Promise<void> => {
    // Write to your DB or a log file — this is essential for traceability
    // Example: repo.insertAiAuditLog({ user_id: user.id, tool, args, success, error })
    console.log(`[AI-AUDIT] user=${user.id} tool=${tool} ok=${success}`, error ?? '');
};

const generateRandomPassword = (length = 12): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};