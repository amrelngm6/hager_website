// modules/ai/tools/index.ts
import { emailTools } from './ai.emails.tools';
import { utilityTools } from './ai.utility.tools';
import { registerAction } from '../ai.action.registry';

export const allTools = [
  ...emailTools,
  ...utilityTools,
];
for (const tool of allTools) {
  registerAction(tool);
}