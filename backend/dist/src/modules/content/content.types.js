"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateContentSchema = exports.ALLOWED_SECTION_KEYS = void 0;
const zod_1 = require("zod");
// ---------------------------------------------------------------------------
// Allowed section keys (must match seed data)
// ---------------------------------------------------------------------------
exports.ALLOWED_SECTION_KEYS = [
    'general',
    'intro',
    'about',
    'skills',
    'projects',
    'clients',
    'contact',
    'hello',
    'hobbies',
    'age',
    'cv',
    'education',
    'experience',
    'awards',
    'msg_success',
    'error',
];
// ---------------------------------------------------------------------------
// Zod schemas for API validation
// ---------------------------------------------------------------------------
exports.UpdateContentSchema = zod_1.z.object({
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
});
//# sourceMappingURL=content.types.js.map