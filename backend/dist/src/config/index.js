"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionConfig = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// ---------------------------------------------------------------------------
// Schema — every env var the app needs, validated at startup.
// If any required var is missing the process exits with a clear message.
// ---------------------------------------------------------------------------
const envSchema = zod_1.z.object({
    // Server
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(3005),
    // MySQL pool
    DB_HOST: zod_1.z.string().min(1),
    DB_PORT: zod_1.z.coerce.number().int().positive().default(3306),
    DB_NAME: zod_1.z.string().min(1),
    DB_USER: zod_1.z.string().min(1),
    DB_PASSWORD: zod_1.z.string().default(''),
    DB_POOL_MIN: zod_1.z.coerce.number().int().nonnegative().default(2),
    DB_POOL_MAX: zod_1.z.coerce.number().int().positive().default(20),
    // CORS / Socket
    // CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
    CORS_ORIGIN: zod_1.z.string().url().default('http://localhost:8081'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    const formatted = parsed.error.issues
        .map((e) => `  • ${e.path.join('.')}: ${e.message}`)
        .join('\n');
    console.error(`\n[Config] ❌  Missing or invalid environment variables:\n${formatted}\n` +
        `  → Check your .env file and compare against .env.example\n`);
    process.exit(1);
}
/** Typed, validated configuration object. Import this everywhere instead of process.env. */
const config = parsed.data;
exports.default = config;
exports.sessionConfig = {
    secret: process.env.SESSION_SECRET ?? 'fallback-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'mcpanel.sid',
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    },
};
//# sourceMappingURL=index.js.map