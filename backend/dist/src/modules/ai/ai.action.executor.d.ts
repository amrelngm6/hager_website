import { SessionUser } from '../../types';
export interface ActionResult {
    success: boolean;
    data?: unknown;
    error?: string;
    requiresConfirmation?: boolean;
    confirmationMessage?: string;
}
export declare const executeServerAction: (toolName: string, args: Record<string, unknown>, user: SessionUser) => Promise<ActionResult>;
