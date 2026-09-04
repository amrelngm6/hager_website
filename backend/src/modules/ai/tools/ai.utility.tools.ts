import { ActionDefinition } from '../ai.types';

export const utilityTools: ActionDefinition[] = [
  {
    name: 'getSystemTime',
    description: 'Returns the current server time and timezone.',
    category: 'system',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async () => ({
      time: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  },
];
