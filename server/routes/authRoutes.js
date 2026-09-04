import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get, query } from '../db/database.js';
import { requireAuth, getJwtSecret } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = express.Router();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Helper to fetch complete user profile including hospital and authorized departments
 */
const buildUserProfile = async (user) => {
  let hospital = null;
  if (user.hospital_id) {
    hospital = await get(
      'SELECT id, name, code, location, district, city, state, pincode, facility_type, hfr_id, phone, email, status FROM hospitals WHERE id = ?',
      [user.hospital_id]
    );
  }

  let authorizedDepartments = [];
  if (user.role === 'DOCTOR') {
    authorizedDepartments = await query(
      `SELECT d.id, d.name, d.code, d.room_number 
       FROM doctor_departments dd
       JOIN departments d ON dd.department_id = d.id
       WHERE dd.doctor_id = ?`,
      [user.id]
    );
  } else if (user.role === 'HOSPITAL_ADMIN' && user.hospital_id) {
    authorizedDepartments = await query(
      `SELECT id, name, code, room_number FROM departments WHERE hospital_id = ? AND status = 'ACTIVE'`,
      [user.hospital_id]
    );
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    hospitalId: user.hospital_id,
    hospitalName: hospital?.name || 'Healthcare Facility',
    hospitalCode: hospital?.code || '',
    hospital: hospital || null,
    department: user.department,
    licenseNumber: user.license_number,
    authorizedDepartments
  };
};

/**
 * POST /api/auth/login
 * Staff / Doctor / Hospital Admin Login
 * Verifies credentials server-side via bcrypt against SQLite users table.
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

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Account Inactive',
        message: 'This user account is inactive or disabled.'
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

    const userProfile = await buildUserProfile(user);

    const secret = getJwtSecret();
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.full_name,
        hospital_id: user.hospital_id
      },
      secret,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await recordAuditLog({
      userId: user.id,
      userRole: user.role,
      hospitalId: user.hospital_id,
      action: 'USER_LOGIN',
      resourceType: 'USER',
      resourceId: user.id,
      details: { username: user.username, role: user.role, hospital: userProfile.hospitalName },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      token,
      user: userProfile
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user with active facility scope
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User Not Found' });
    }
    const userProfile = await buildUserProfile(user);
    res.json({
      success: true,
      user: userProfile
    });
  } catch (err) {
    next(err);
  }
});

export default router;
