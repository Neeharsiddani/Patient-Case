import jwt from 'jsonwebtoken';
import { get } from '../db/database.js';

/**
 * Returns JWT Secret.
 * In production: FAIL CLOSED if JWT_SECRET environment variable is absent or empty.
 * In development: Allowed only with explicit local development testing key.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing in production. Server failing closed.');
    }
    return 'dev_insecure_jwt_secret_only_for_local_development_testing_39824';
  }
  return secret.trim();
};

/**
 * Authentication Middleware
 * Extracts and verifies Bearer JWT token from Authorization header.
 * Enforces token expiration, secret validity, and active user verification.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication Required',
        message: 'Missing or malformed Authorization header. Please provide a valid Bearer token.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        error: 'Authentication Required',
        message: 'Missing session token.'
      });
    }

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);

    // Verify user exists and is active in database (fetching hospital_id for RBAC)
    const user = await get(
      'SELECT id, username, role, full_name, email, department, hospital_id, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        error: 'Invalid Token',
        message: 'The user account associated with this session token no longer exists or is inactive.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token Expired',
        message: 'Your session has expired. Please sign in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid session token.'
    });
  }
};

/**
 * Role-Based Access Control Middleware (RBAC)
 * @param  {...string} allowedRoles List of roles permitted to access the route ('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required before verifying role authorization.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: `Your account role (${req.user.role}) is not authorized to access this resource. Required roles: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
};

/**
 * Optional Auth Middleware
 * Populates req.user if a valid token is present, but doesn't reject if missing.
 * Useful for public Kiosk intake endpoints where patients can submit without a login token.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token.trim()) {
        const secret = getJwtSecret();
        const decoded = jwt.verify(token, secret);
        const user = await get(
          'SELECT id, username, role, full_name, email, department, hospital_id, status FROM users WHERE id = ?',
          [decoded.id]
        );
        if (user && user.status === 'ACTIVE') {
          req.user = user;
        }
      }
    }
  } catch {
    // Ignore invalid tokens for optional endpoints
  }
  next();
};
