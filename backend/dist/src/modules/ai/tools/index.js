"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allTools = void 0;
// modules/ai/tools/index.ts
const ai_emails_tools_1 = require("./ai.emails.tools");
const ai_utility_tools_1 = require("./ai.utility.tools");
const ai_action_registry_1 = require("../ai.action.registry");
exports.allTools = [
    ...ai_emails_tools_1.emailTools,
    ...ai_utility_tools_1.utilityTools,
];
for (const tool of exports.allTools) {
    (0, ai_action_registry_1.registerAction)(tool);
}
//# sourceMappingURL=index.js.map