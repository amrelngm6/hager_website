import mysql from 'mysql2/promise';
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
declare const pool: mysql.Pool;
export declare const query: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;
export declare const queryOne: <T = Record<string, unknown>>(sql: string, params?: any[]) => Promise<T | null>;
export declare const execute: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T | null>;
export declare const poolInstance: mysql.Pool;
export default pool;
