import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query, get, run } from '../db/database.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';

const router = express.Router();

/**
 * GET /api/hospitals
 * Public endpoint: Search & retrieve active healthcare facilities (ABDM HFR ready)
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, city } = req.query;
    let sql = `SELECT id, name, code, location, city, state, facility_type, hfr_id, phone, email FROM hospitals WHERE status = 'ACTIVE'`;
    const params = [];

    if (search) {
      sql += ` AND (name LIKE ? OR location LIKE ? OR city LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (city) {
      sql += ` AND city = ?`;
      params.push(city);
    }

    sql += ` ORDER BY name ASC`;
    const hospitals = await query(sql, params);

    res.json({
      success: true,
      count: hospitals.length,
      hospitals
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/:id
 * Retrieve details for a specific healthcare facility
 */
router.get('/:id', async (req, res, next) => {
  try {
    const hospital = await get(
      `SELECT id, name, code, location, city, state, facility_type, hfr_id, phone, email, status FROM hospitals WHERE id = ?`,
      [req.params.id]
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Hospital Not Found',
        message: `No hospital found with ID ${req.params.id}`
      });
    }

    const departments = await query(
      `SELECT id, name, code, room_number, description FROM departments WHERE hospital_id = ? AND status = 'ACTIVE' ORDER BY name ASC`,
      [hospital.id]
    );

    res.json({
      success: true,
      hospital: {
        ...hospital,
        departments
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/:id/departments
 * Retrieve active clinical departments/OPDs for a specific hospital
 */
router.get('/:id/departments', async (req, res, next) => {
  try {
    const departments = await query(
      `SELECT id, hospital_id, name, code, room_number, description, status 
       FROM departments 
       WHERE hospital_id = ? AND status = 'ACTIVE' 
       ORDER BY name ASC`,
      [req.params.id]
    );

    res.json({
      success: true,
      hospitalId: req.params.id,
      count: departments.length,
      departments
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/:id/doctors
 * Retrieve doctors registered at a specific hospital with authorized departments
 */
router.get('/:id/doctors', optionalAuth, async (req, res, next) => {
  try {
    const doctors = await query(
      `SELECT u.id, u.username, u.full_name, u.email, u.phone, u.hospital_id, u.department, u.license_number, u.status
       FROM users u
       WHERE u.hospital_id = ? AND u.role = 'DOCTOR' AND u.status = 'ACTIVE'
       ORDER BY u.full_name ASC`,
      [req.params.id]
    );

    // Attach authorized departments for each doctor
    const doctorsWithDepts = await Promise.all(
      doctors.map(async (doc) => {
        const depts = await query(
          `SELECT d.id, d.name, d.code, d.room_number 
           FROM doctor_departments dd
           JOIN departments d ON dd.department_id = d.id
           WHERE dd.doctor_id = ?`,
          [doc.id]
        );
        return {
          ...doc,
          authorizedDepartments: depts
        };
      })
    );

    res.json({
      success: true,
      hospitalId: req.params.id,
      doctors: doctorsWithDepts
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/:id/stats
 * Hospital Admin Analytics & Queue Breakdown
 * STRICT: Accessible by Hospital Admin and Doctor for that hospital
 */
router.get('/:id/stats', optionalAuth, async (req, res, next) => {
  try {
    const hospitalId = req.params.id;

    // Verify hospital exists
    const hospital = await get('SELECT id, name, code, location, city, state FROM hospitals WHERE id = ?', [hospitalId]);
    if (!hospital) {
      return res.status(404).json({ success: false, error: 'Hospital Not Found' });
    }

    // Role check: If user is authenticated as Hospital Admin, ensure hospital match
    if (req.user && req.user.role === 'HOSPITAL_ADMIN' && req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not authorized to view statistics for another hospital.'
      });
    }

    // 1. Department Breakdown
    const departments = await query(
      `SELECT d.id, d.name, d.code, d.room_number,
              COUNT(p.id) as total_cases,
              SUM(CASE WHEN p.status = 'Waiting' THEN 1 ELSE 0 END) as waiting_count,
              SUM(CASE WHEN p.triage_level <= 2 AND p.status != 'Completed' THEN 1 ELSE 0 END) as red_flag_count,
              SUM(CASE WHEN p.status = 'History Verified' OR p.verification_status = 'History Verified' THEN 1 ELSE 0 END) as verified_count,
              SUM(CASE WHEN p.status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
              SUM(CASE WHEN p.assigned_doctor_id IS NULL AND p.status != 'Completed' THEN 1 ELSE 0 END) as unassigned_count
       FROM departments d
       LEFT JOIN patients p ON d.id = p.department_id AND p.hospital_id = ?
       WHERE d.hospital_id = ? AND d.status = 'ACTIVE'
       GROUP BY d.id, d.name, d.code, d.room_number
       ORDER BY d.name ASC`,
      [hospitalId, hospitalId]
    );

    // 2. High-level aggregates
    const aggregates = await get(
      `SELECT 
         COUNT(id) as total_patients,
         SUM(CASE WHEN status = 'Waiting' THEN 1 ELSE 0 END) as waiting_patients,
         SUM(CASE WHEN triage_level <= 2 AND status != 'Completed' THEN 1 ELSE 0 END) as red_flag_cases,
         SUM(CASE WHEN status = 'History Verified' OR verification_status = 'History Verified' THEN 1 ELSE 0 END) as verified_cases,
         SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_cases,
         SUM(CASE WHEN assigned_doctor_id IS NULL AND status != 'Completed' THEN 1 ELSE 0 END) as unassigned_cases,
         SUM(CASE WHEN assigned_doctor_id IS NOT NULL AND status != 'Completed' THEN 1 ELSE 0 END) as assigned_cases
       FROM patients
       WHERE hospital_id = ?`,
      [hospitalId]
    );

    res.json({
      success: true,
      hospital,
      stats: {
        totalPatients: aggregates?.total_patients || 0,
        waitingPatients: aggregates?.waiting_patients || 0,
        redFlagCases: aggregates?.red_flag_cases || 0,
        verifiedCases: aggregates?.verified_cases || 0,
        completedCases: aggregates?.completed_cases || 0,
        unassignedCases: aggregates?.unassigned_cases || 0,
        assignedCases: aggregates?.assigned_cases || 0,
        departmentBreakdown: departments
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hospitals/:id/assign-doctor
 * Hospital Admin assigns a patient case to an authorized doctor
 */
router.post('/:id/assign-doctor', optionalAuth, async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { patientId, doctorId } = req.body;

    if (!patientId || !doctorId) {
      return res.status(400).json({
        success: false,
        error: 'Missing Information',
        message: 'Patient ID and Doctor ID are required.'
      });
    }

    // Verify patient belongs to this hospital
    const patient = await get('SELECT id, name, hospital_id, department_id, department FROM patients WHERE id = ?', [patientId]);
    if (!patient || patient.hospital_id !== hospitalId) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found',
        message: 'Patient does not belong to this healthcare facility.'
      });
    }

    // Verify doctor belongs to this hospital
    const doctor = await get("SELECT id, full_name, hospital_id FROM users WHERE id = ? AND role = 'DOCTOR'", [doctorId]);
    if (!doctor || doctor.hospital_id !== hospitalId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Doctor',
        message: 'Assigned doctor is not an active clinician at this facility.'
      });
    }

    // Update patient record
    await run(
      `UPDATE patients 
       SET assigned_doctor_id = ?, assigned_doctor_name = ?, status = CASE WHEN status = 'Waiting' THEN 'Assigned' ELSE status END,
           case_status = 'Assigned', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [doctor.id, doctor.full_name, patientId]
    );

    // Audit Log
    await recordAuditLog({
      userId: req.user ? req.user.id : 'HOSPITAL_ADMIN',
      userRole: req.user ? req.user.role : 'HOSPITAL_ADMIN',
      hospitalId,
      action: 'DOCTOR_ASSIGNED_TO_CASE',
      resourceType: 'PATIENT',
      resourceId: patientId,
      details: { doctorId: doctor.id, doctorName: doctor.full_name, patientName: patient.name },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Case successfully assigned to ${doctor.full_name}`,
      assignedDoctorId: doctor.id,
      assignedDoctorName: doctor.full_name
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hospitals/:id/departments
 * Hospital Admin creates a new clinical department
 */
router.post('/:id/departments', optionalAuth, async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { name, code, roomNumber, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Department name and code are required.'
      });
    }

    const deptId = `dept-${hospitalId}-${code.toLowerCase()}`;
    await run(
      `INSERT INTO departments (id, hospital_id, name, code, room_number, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [deptId, hospitalId, name, code.toUpperCase(), roomNumber || 'Room 101', description || '']
    );

    res.status(201).json({
      success: true,
      message: `Department '${name}' created successfully`,
      department: { id: deptId, hospital_id: hospitalId, name, code: code.toUpperCase(), room_number: roomNumber }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hospitals/:id/doctors
 * Hospital Admin registers a new doctor with authorized departments
 */
router.post('/:id/doctors', optionalAuth, async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { username, password, fullName, email, phone, department, licenseNumber, departmentIds = [] } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Username, password, and Full Name are required.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const doctorId = `usr-doc-${uuidv4().substring(0, 8)}`;

    await run(
      `INSERT INTO users (id, username, password_hash, role, full_name, email, phone, hospital_id, department, license_number)
       VALUES (?, ?, ?, 'DOCTOR', ?, ?, ?, ?, ?, ?)`,
      [doctorId, username, passwordHash, fullName, email || '', phone || '', hospitalId, department || '', licenseNumber || '']
    );

    // Map authorized departments
    for (const deptId of departmentIds) {
      await run(
        `INSERT INTO doctor_departments (id, doctor_id, department_id, hospital_id)
         VALUES (?, ?, ?, ?)`,
        [uuidv4(), doctorId, deptId, hospitalId]
      );
    }

    res.status(201).json({
      success: true,
      message: `Doctor '${fullName}' registered successfully`,
      doctor: { id: doctorId, username, fullName, hospital_id: hospitalId }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
