import { ActionDefinition } from './ai.types';
export declare const registerAction: (action: ActionDefinition) => void;
export declare const getAction: (name: string) => ActionDefinition | undefined;
export declare const getAllActions: () => ActionDefinition[];
