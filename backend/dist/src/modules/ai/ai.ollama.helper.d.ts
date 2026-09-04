import { SessionUser } from "../../types";
export interface OllamaToolCall {
    function: {
        name: string;
        arguments: Record<string, unknown>;
    };
}
export interface OllamaToolResult {
    role: 'tool';
    content: string;
}
/** Tools exposed to the model when a chat is running in 'analytics' mode. */
export declare const ANALYTICS_TOOL_NAMES: string[];
export declare const handleOllamaTools: (allowedNames?: string[]) => Record<string, unknown>[];
export declare const getOllamaTools: (allowedNames?: string[]) => {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, unknown>;
            required?: string[];
        };
    };
}[];
export declare const executeEnrichedToolCall: (toolCall: OllamaToolCall, user: SessionUser, confirmed?: boolean) => Promise<OllamaToolResult>;
