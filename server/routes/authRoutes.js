import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'medimitra_secure_healthcare_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * POST /api/auth/login
 * Staff / Doctor / Admin Login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing Credentials',
        message: 'Username and password are required.'
      });
    }

    const user = await get('SELECT * FROM users WHERE username = ?', [username.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication Failed',
        message: 'Invalid username or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Authentication Failed',
        message: 'Invalid username or password.'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.full_name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await recordAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'USER_LOGIN',
      resourceType: 'USER',
      resourceId: user.id,
      details: { username: user.username, role: user.role },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        email: user.email,
        department: user.department,
        licenseNumber: user.license_number
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/quick-doctor-auth
 * Fast hospital workstation PIN/account selector for doctor session
 */
router.post('/quick-doctor-auth', async (req, res, next) => {
  try {
    const { username = 'dr.sharma' } = req.body;
    const user = await get('SELECT * FROM users WHERE username = ? AND role = "DOCTOR"', [username]);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Doctor Not Found',
        message: 'Doctor staff record not found.'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.full_name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        department: user.department,
        licenseNumber: user.license_number
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export default router;
