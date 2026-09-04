"use strict";
// ---------------------------------------------------------------------------
// AI Module — Ollama Helper Layer
// Tool definitions and tool-call execution for Ollama integration.
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeEnrichedToolCall = exports.getOllamaTools = exports.handleOllamaTools = exports.ANALYTICS_TOOL_NAMES = void 0;
const ai_action_executor_1 = require("./ai.action.executor");
const ai_action_registry_1 = require("./ai.action.registry");
// ---------------------------------------------------------------------------
// Tool definitions — built from the action registry in Ollama's expected format
// ---------------------------------------------------------------------------
/** Tools exposed to the model when a chat is running in 'analytics' mode. */
exports.ANALYTICS_TOOL_NAMES = [
    'get_database_tables',
    'get_table_schema',
    'list_databases',
    'run_report_query',
    'generate_report_chart',
];
const handleOllamaTools = (allowedNames) => {
    return (0, exports.getOllamaTools)(allowedNames);
};
exports.handleOllamaTools = handleOllamaTools;
const getOllamaTools = (allowedNames) => {
    const actions = allowedNames
        ? (0, ai_action_registry_1.getAllActions)().filter((action) => allowedNames.includes(action.name))
        : (0, ai_action_registry_1.getAllActions)();
    return actions.map(action => ({
        type: 'function',
        function: {
            name: action.name,
            description: action.description,
            parameters: action.parameters,
        },
    }));
};
exports.getOllamaTools = getOllamaTools;
// ---------------------------------------------------------------------------
// Tool executor — dispatches every tool call through the action registry.
// ---------------------------------------------------------------------------
const executeEnrichedToolCall = async (toolCall, user, confirmed = false) => {
    const { name, arguments: args } = toolCall.function;
    const result = await (0, ai_action_executor_1.executeServerAction)(name, { ...args, confirmed }, user);
    return {
        role: 'tool',
        content: JSON.stringify(result),
    };
};
exports.executeEnrichedToolCall = executeEnrichedToolCall;
//# sourceMappingURL=ai.ollama.helper.js.map