/** Strict limiter for auth endpoints (login, password change) */
export declare const authRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/** General API limiter */
export declare const apiRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
