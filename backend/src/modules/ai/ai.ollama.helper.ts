// ---------------------------------------------------------------------------
// AI Module — Ollama Helper Layer
// Tool definitions and tool-call execution for Ollama integration.
// ---------------------------------------------------------------------------

import { executeServerAction } from './ai.action.executor';
import { SessionUser } from "../../types";
import { getAllActions } from "./ai.action.registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tool definitions — built from the action registry in Ollama's expected format
// ---------------------------------------------------------------------------

/** Tools exposed to the model when a chat is running in 'analytics' mode. */
export const ANALYTICS_TOOL_NAMES = [
  'get_database_tables',
  'get_table_schema',
  'list_databases',
  'run_report_query',
  'generate_report_chart',
];

export const handleOllamaTools = (allowedNames?: string[]): Record<string, unknown>[] => {
  return getOllamaTools(allowedNames);
};

export const getOllamaTools = (allowedNames?: string[]) => {
  const actions = allowedNames
    ? getAllActions().filter((action) => allowedNames.includes(action.name))
    : getAllActions();
  return actions.map(action => ({
    type: 'function',
    function: {
      name: action.name,
      description: action.description,
      parameters: action.parameters,
    },
  }));
};

// ---------------------------------------------------------------------------
// Tool executor — dispatches every tool call through the action registry.
// ---------------------------------------------------------------------------

export const executeEnrichedToolCall = async (
  toolCall: OllamaToolCall,
  user: SessionUser,
  confirmed: boolean = false,
): Promise<OllamaToolResult> => {
  const { name, arguments: args } = toolCall.function;
  const result = await executeServerAction(name, { ...args, confirmed }, user);
  return {
    role: 'tool',
    content: JSON.stringify(result),
  };
};