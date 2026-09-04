import { ActionDefinition } from './ai.types';

const actions = new Map<string, ActionDefinition>();

export const registerAction = (action: ActionDefinition) => {
  if (actions.has(action.name)) {
    throw new Error(`AI action already registered: ${action.name}`);
  }
  actions.set(action.name, action);
};

export const getAction = (name: string) => {
  return actions.get(name);
};

export const getAllActions = () => {
  return Array.from(actions.values());
};