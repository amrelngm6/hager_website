import rateLimit from 'express-rate-limit';

/** Strict limiter for auth endpoints (login, password change) */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000, // 15 minutes
  max: 20,
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** General API limiter */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1_000, // 1 minute
  max: 300,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
