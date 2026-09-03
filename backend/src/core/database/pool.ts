import mysql from 'mysql2/promise';
import config from '../../config';
import logger from '../logger';

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
const pool = mysql.createPool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: config.DB_POOL_MAX,
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
      if (value === null) return null;
      try {
        return JSON.parse(value);
      } catch {
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
    logger.info('[Database] MySQL pool connected successfully');
    conn.release();
  })
  .catch((err: Error) => {
    logger.error('[Database] Failed to connect to MySQL pool', { message: err.message });
    // Don't crash — the server may still be useful for health checks, etc.
  });


export const query = async <T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> => {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
};

export const queryOne = async <T = Record<string, unknown>>(
  sql: string,
  params?: any[]
): Promise<T | null> => {

  const result = await pool.execute(
    sql,
    params
  );
  return (result[0] as T[])[0] ?? null;
};

export const execute = async <T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T | null> => {
  sql = sql.replace(/\$1/g, params ? `"${params[0]}"` : '');

  const result = await pool.query(
    sql,
    params
  );
  return (result[0] as T[])[0] ?? null;
};

export const poolInstance = pool;

export default pool;
