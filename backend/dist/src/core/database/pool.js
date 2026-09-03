"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.poolInstance = exports.execute = exports.queryOne = exports.query = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const config_1 = __importDefault(require("../../config"));
const logger_1 = __importDefault(require("../logger"));
/**
 * MySQL connection pool — single instance for the entire application.
 *
 * Usage inside repositories:
 *   import pool from '../../core/database/pool';
 *   const [rows] = await pool.execute('SELECT ...', [param]);
 *
 * Rules (from README):
 *  - Always scope queries
 *  - Always use ? placeholders — never string interpolation
 *  - Soft deletes: filter `AND deleted_at IS NULL` on every SELECT
 *  - Transactions: pool.getConnection() → beginTransaction → commit/rollback → release
 */
const pool = promise_1.default.createPool({
    host: config_1.default.DB_HOST,
    port: config_1.default.DB_PORT,
    database: config_1.default.DB_NAME,
    user: config_1.default.DB_USER,
    password: config_1.default.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: config_1.default.DB_POOL_MAX,
    jsonStrings: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    // Return JS Date objects instead of strings for DATETIME columns
    dateStrings: false,
    // Auto-parse JSON columns
    typeCast(field, next) {
        if (field.type === 'JSON') {
            const value = field.string('utf8');
            if (value === null)
                return null;
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        }
        return next();
    },
});
// Verify connectivity at startup — fail fast if DB is unreachable
pool
    .getConnection()
    .then((conn) => {
    logger_1.default.info('[Database] MySQL pool connected successfully');
    conn.release();
})
    .catch((err) => {
    logger_1.default.error('[Database] Failed to connect to MySQL pool', { message: err.message });
    // Don't crash — the server may still be useful for health checks, etc.
});
const query = async (sql, params) => {
    const [rows] = await pool.query(sql, params);
    return rows;
};
exports.query = query;
const queryOne = async (sql, params) => {
    const result = await pool.execute(sql, params);
    return result[0][0] ?? null;
};
exports.queryOne = queryOne;
const execute = async (sql, params) => {
    sql = sql.replace(/\$1/g, params ? `"${params[0]}"` : '');
    const result = await pool.query(sql, params);
    return result[0][0] ?? null;
};
exports.execute = execute;
exports.poolInstance = pool;
exports.default = pool;
//# sourceMappingURL=pool.js.map