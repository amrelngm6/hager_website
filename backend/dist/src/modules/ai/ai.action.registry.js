"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllActions = exports.getAction = exports.registerAction = void 0;
const actions = new Map();
const registerAction = (action) => {
    if (actions.has(action.name)) {
        throw new Error(`AI action already registered: ${action.name}`);
    }
    actions.set(action.name, action);
};
exports.registerAction = registerAction;
const getAction = (name) => {
    return actions.get(name);
};
exports.getAction = getAction;
const getAllActions = () => {
    return Array.from(actions.values());
};
exports.getAllActions = getAllActions;
//# sourceMappingURL=ai.action.registry.js.map