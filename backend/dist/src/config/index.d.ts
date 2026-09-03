import { SessionOptions } from 'express-session';
/** Typed, validated configuration object. Import this everywhere instead of process.env. */
declare const config: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_POOL_MIN: number;
    DB_POOL_MAX: number;
    CORS_ORIGIN: string;
};
export default config;
export declare const sessionConfig: SessionOptions;
