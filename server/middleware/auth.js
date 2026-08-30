import jwt from 'jsonwebtoken';
import { get } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'medimitra_secure_healthcare_jwt_key_2026';

/**
 * Authentication Middleware
 * Extracts and verifies Bearer JWT token from Authorization header.
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
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user exists in database
    const user = await get('SELECT id, username, role, full_name, email, department FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Token',
        message: 'The user account associated with this session token no longer exists.'
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
 * @param  {...string} allowedRoles List of roles permitted to access the route ('DOCTOR', 'ADMIN', 'PATIENT')
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
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await get('SELECT id, username, role, full_name, email, department FROM users WHERE id = ?', [decoded.id]);
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid tokens for optional endpoints
  }
  next();
};
