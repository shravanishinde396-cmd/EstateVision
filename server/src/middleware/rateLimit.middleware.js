// server/src/middleware/rateLimit.middleware.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis.js';
import { sendError } from '../utils/response.util.js';
import config from '../config/env.js';

const isDev = config.env === 'development';

// General API limiter: 100 req/15min
export const apiLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              100,
  standardHeaders:  true,
  legacyHeaders:    false,
  store: isDev ? undefined : new RedisStore({ sendCommand: (...args) => redisClient.call(...args) }),
  handler: (req, res) => sendError(res, 429, 'Too many requests. Please slow down.'),
  skip: () => isDev,
});

// Auth limiter: 10 req/15min (strict)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  store: isDev ? undefined : new RedisStore({ sendCommand: (...args) => redisClient.call(...args) }),
  handler: (req, res) => sendError(res, 429, 'Too many login attempts. Try again in 15 minutes.'),
  skip: () => isDev,
});

// Upload limiter: 20 req/hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      20,
  handler:  (req, res) => sendError(res, 429, 'Upload limit reached. Try again in an hour.'),
  skip: () => isDev,
});
