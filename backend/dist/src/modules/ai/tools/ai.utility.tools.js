"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utilityTools = void 0;
exports.utilityTools = [
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
//# sourceMappingURL=ai.utility.tools.js.map