// server/src/utils/jwt.util.js
import jwt from 'jsonwebtoken';
import config from '../config/env.js';

const ACCESS_SECRET  = config.jwt.accessSecret;
const REFRESH_SECRET = config.jwt.refreshSecret;

/**
 * Generate a short-lived access token (15 min)
 * @param {{ id, role, email }} payload
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(
    { sub: payload.id, role: payload.role, email: payload.email },
    ACCESS_SECRET,
    { expiresIn: config.jwt.accessExpiration, issuer: 'estatevision-api' }
  );
};

/**
 * Generate a long-lived refresh token (7 days)
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(
    { sub: payload.id, role: payload.role },
    REFRESH_SECRET,
    { expiresIn: config.jwt.refreshExpiration, issuer: 'estatevision-api' }
  );
};

export const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);
