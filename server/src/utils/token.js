import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';

/**
 * Access Token: Short-lived (15 minutes) for API authorization
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      type: 'access',
    },
    config.jwtSecret,
    { expiresIn: '15m' }
  );
};

// Backwards compatibility alias
export const generateToken = (payload) => {
  return generateAccessToken(payload);
};

/**
 * Refresh Token: Long-lived (7 days) for session renewal
 * Contains a unique cryptographic JTI for rotation and replay tracking
 */
export const generateRefreshToken = (payload, familyId = null) => {
  const jti = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  const family = familyId || (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));
  
  const token = jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      jti,
      family,
      type: 'refresh',
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  return { token, jti, family };
};

export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded && (decoded.type === 'access' || !decoded.type)) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
};

// Backwards compatibility alias
export const verifyToken = (token) => {
  return verifyAccessToken(token);
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded && decoded.type === 'refresh') {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Generates a short-lived, dedicated password reset token.
 * Valid for 15 minutes and strictly restricted to the reset action.
 */
export const generateResetToken = (payload) => {
  return jwt.sign(
    { ...payload, action: 'password_reset' },
    config.jwtSecret,
    { expiresIn: '15m' }
  );
};

/**
 * Validates a password reset token.
 * Rejects expired tokens or tokens not created for password reset.
 */
export const verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded && decoded.action === 'password_reset') {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
};
