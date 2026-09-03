"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pool_1 = __importDefault(require("../database/pool"));
async function migrate() {
    const schemaFiles = ['alters.sql', 'mysql.sql', 'content_sections.sql'];
    try {
        for (const fileName of schemaFiles) {
            const schemaPath = path_1.default.join(__dirname, fileName);
            if (!fs_1.default.existsSync(schemaPath)) {
                console.warn(`[migrate] Schema file not found: ${fileName}, skipping.`);
                continue;
            }
            const sql = fs_1.default.readFileSync(schemaPath, 'utf-8');
            console.log(`[migrate] Applying schema from ${fileName}...`);
            const queries = sql
                .split(';')
                .map((q) => q.trim())
                .filter((q) => q.length > 0);
            for (const q of queries) {
                await pool_1.default.query(q);
            }
            console.log(`[migrate] ${fileName} applied successfully.`);
        }
    }
    finally {
    }
    await pool_1.default.end();
}
migrate().catch((err) => {
    console.error('[migrate] Failed:', err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map