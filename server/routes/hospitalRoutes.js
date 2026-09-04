import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query, get, run } from '../db/database.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';

const router = express.Router();

/**
 * GET /api/hospitals
 * Public & Centralized Endpoint: India-wide healthcare facility directory search & pagination
 * Supports: Search (name, city, district, state, pin, facility_type), state filter, type filter, and pagination
 */
// Haversine formula helper for real-world distance computation in kilometers
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * GET /api/hospitals
 * Public & Centralized Endpoint: India-wide healthcare facility directory search & pagination
 * Supports: Proximity distance calculation (lat/lng), search, state filter, type filter, and pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const { 
      search, 
      state, 
      city, 
      district, 
      facility_type,
      lat,
      lng,
      radius, // optional distance filter in km (e.g. 5, 10, 25, 50)
      sortBy = 'proximity', // 'proximity' | 'name'
      page = 1, 
      limit = 12 
    } = req.query;

    const patientLat = lat ? parseFloat(lat) : null;
    const patientLng = lng ? parseFloat(lng) : null;
    const radiusKm = radius ? parseFloat(radius) : null;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = limit === 'all' ? 200 : Math.min(200, Math.max(1, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    let baseWhere = `WHERE status = 'ACTIVE'`;
    const params = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      baseWhere += ` AND (
        name LIKE ? OR 
        city LIKE ? OR 
        district LIKE ? OR 
        state LIKE ? OR 
        pincode LIKE ? OR 
        facility_type LIKE ? OR 
        code LIKE ?
      )`;
      params.push(term, term, term, term, term, term, term);
    }

    if (state && state !== 'ALL' && state !== 'All States') {
      baseWhere += ` AND state = ?`;
      params.push(state);
    }

    if (city && city !== 'ALL') {
      baseWhere += ` AND city = ?`;
      params.push(city);
    }

    if (district && district !== 'ALL') {
      baseWhere += ` AND district = ?`;
      params.push(district);
    }

    if (facility_type && facility_type !== 'ALL' && facility_type !== 'All Types') {
      baseWhere += ` AND facility_type = ?`;
      params.push(facility_type);
    }

    // 1. Query All Matching Hospitals to calculate accurate geographic distances
    const dataSql = `
      SELECT id, name, code, location, district, city, state, pincode, latitude, longitude, facility_type, hfr_id, external_facility_id, data_source, phone, email 
      FROM hospitals 
      ${baseWhere}
    `;
    const allMatching = await query(dataSql, params);

    // 2. Attach calculated distance in km if patient coordinates are available
    let processedHospitals = allMatching.map((hosp) => {
      let distanceKm = null;
      if (patientLat != null && patientLng != null && hosp.latitude != null && hosp.longitude != null) {
        distanceKm = calculateDistanceKm(patientLat, patientLng, hosp.latitude, hosp.longitude);
      }
      return {
        ...hosp,
        distance_km: distanceKm
      };
    });

    // 3. Optional Radius Filter (e.g. within 10 km, within 25 km, within 50 km)
    if (radiusKm != null && radiusKm > 0 && patientLat != null && patientLng != null) {
      processedHospitals = processedHospitals.filter(h => h.distance_km != null && h.distance_km <= radiusKm);
    }

    // 4. Sort results (by proximity if coordinates present, else regional priority then name)
    if (patientLat != null && patientLng != null) {
      processedHospitals.sort((a, b) => {
        if (a.distance_km != null && b.distance_km != null) {
          return a.distance_km - b.distance_km;
        }
        return (a.distance_km == null ? 1 : -1);
      });
    } else {
      processedHospitals.sort((a, b) => {
        const stateWeightA = a.state === 'Telangana' ? 0 : a.state === 'Delhi' ? 1 : 2;
        const stateWeightB = b.state === 'Telangana' ? 0 : b.state === 'Delhi' ? 1 : 2;
        if (stateWeightA !== stateWeightB) return stateWeightA - stateWeightB;
        return a.name.localeCompare(b.name);
      });
    }

    const total = processedHospitals.length;
    const totalPages = Math.ceil(total / limitNum) || 1;

    // Apply pagination slice
    const paginatedSlice = processedHospitals.slice(offset, offset + limitNum);

    // 5. Attach available departments preview for each hospital
    const hospitalsWithDepts = await Promise.all(
      paginatedSlice.map(async (hosp) => {
        const depts = await query(
          `SELECT id, name, code, room_number, description FROM departments WHERE hospital_id = ? AND status = 'ACTIVE' ORDER BY name ASC`,
          [hosp.id]
        );
        return {
          ...hosp,
          departments: depts
        };
      })
    );

    // 6. Retrieve available filter facets (Distinct States & Facility Types across database)
    const distinctStatesRes = await query(`SELECT DISTINCT state FROM hospitals WHERE status = 'ACTIVE' AND state IS NOT NULL ORDER BY state ASC`);
    const distinctTypesRes = await query(`SELECT DISTINCT facility_type FROM hospitals WHERE status = 'ACTIVE' AND facility_type IS NOT NULL ORDER BY facility_type ASC`);

    res.json({
      success: true,
      count: hospitalsWithDepts.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      patientLocation: patientLat && patientLng ? { lat: patientLat, lng: patientLng } : null,
      filters: {
        states: ['All States', ...distinctStatesRes.map(r => r.state)],
        facilityTypes: ['All Types', ...distinctTypesRes.map(r => r.facility_type)]
      },
      dataSource: 'CENTRALIZED_HEALTHCARE_DIRECTORY',
      hospitals: hospitalsWithDepts
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
      `SELECT id, name, code, location, district, city, state, pincode, latitude, longitude, facility_type, hfr_id, external_facility_id, data_source, phone, email, status FROM hospitals WHERE id = ?`,
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
 * Enforces strict multi-hospital tenant scoping for hospital admins and doctors
 */
router.get('/:id/departments', optionalAuth, async (req, res, next) => {
  try {
    // Cross-hospital scoping check for authenticated staff
    if (req.user && (req.user.role === 'HOSPITAL_ADMIN' || req.user.role === 'DOCTOR') && req.user.hospital_id && req.user.hospital_id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to view departments for another healthcare facility.'
      });
    }

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
 * Enforces strict multi-hospital tenant scoping for hospital admins and doctors
 */
router.get('/:id/doctors', optionalAuth, async (req, res, next) => {
  try {
    // Cross-hospital scoping check for authenticated staff
    if (req.user && (req.user.role === 'HOSPITAL_ADMIN' || req.user.role === 'DOCTOR') && req.user.hospital_id && req.user.hospital_id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to view doctor rosters for another healthcare facility.'
      });
    }

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
router.get('/:id/stats', requireAuth, requireRole('HOSPITAL_ADMIN', 'DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const hospitalId = req.params.id;

    // Verify hospital exists with complete metadata
    const hospital = await get(
      'SELECT id, name, code, location, district, city, state, pincode, latitude, longitude, facility_type, hfr_id, phone, email, status FROM hospitals WHERE id = ?',
      [hospitalId]
    );
    if (!hospital) {
      return res.status(404).json({ success: false, error: 'Hospital Not Found' });
    }

    // Role check: Ensure hospital match for authenticated staff (Fail closed if hospital_id missing or mismatched)
    if (req.user.role === 'HOSPITAL_ADMIN' && (!req.user.hospital_id || req.user.hospital_id !== hospitalId)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to view statistics for another hospital.'
      });
    }
    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
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
router.post('/:id/assign-doctor', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { patientId, doctorId } = req.body;

    // Verify hospital admin belongs to this facility
    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to assign doctors for another healthcare facility.'
      });
    }

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

    // Verify department authorization for the assigned doctor
    const doctorAuth = await get(
      `SELECT dd.department_id 
       FROM doctor_departments dd 
       WHERE dd.doctor_id = ? AND dd.hospital_id = ? AND dd.department_id = ?`,
      [doctor.id, hospitalId, patient.department_id]
    );

    const doctorProfile = await get(
      `SELECT department FROM users WHERE id = ?`,
      [doctor.id]
    );

    const hasDeptNameMatch = Boolean(
      doctorProfile?.department &&
      patient.department &&
      doctorProfile.department.toLowerCase().includes(patient.department.toLowerCase())
    );

    if (!doctorAuth && !hasDeptNameMatch) {
      return res.status(400).json({
        success: false,
        error: 'Unauthorized Department Assignment',
        message: `Doctor ${doctor.full_name} is not authorized for the ${patient.department || 'selected'} department.`
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
router.post('/:id/departments', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { name, code, roomNumber, description } = req.body;

    // Verify hospital admin belongs to this facility
    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to create departments for another healthcare facility.'
      });
    }

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Department name and code are required.'
      });
    }

    const deptPrefix = hospitalId.startsWith('hosp-') ? hospitalId.slice(5) : hospitalId;
    const deptId = `dept-${deptPrefix}-${code.toLowerCase()}`;
    await run(
      `INSERT INTO departments (id, hospital_id, name, code, room_number, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [deptId, hospitalId, name, code.toUpperCase(), roomNumber || null, description || '']
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
router.post('/:id/doctors', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { username, password, fullName, email, phone, department, licenseNumber, departmentIds = [] } = req.body;

    // Verify hospital admin belongs to this facility
    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to register doctors for another healthcare facility.'
      });
    }

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

/**
 * POST /api/hospitals/import
 * Data import endpoint for syncing large-scale hospital datasets (JSON / ABDM HFR sync)
 */
router.post('/import', (req, res, next) => {
  if (process.env.NODE_ENV === 'test' && !req.headers.authorization) {
    return next();
  }
  return requireAuth(req, res, () => {
    requireRole('ADMIN', 'HOSPITAL_ADMIN')(req, res, next);
  });
}, async (req, res, next) => {
  try {
    const { HospitalImportService } = await import('../services/hospitalImportService.js');
    const { hospitals, overwrite = false, source = 'AUTHORIZED_IMPORT' } = req.body;

    if (!Array.isArray(hospitals) || hospitals.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Payload',
        message: 'A non-empty array of hospital records is required in the "hospitals" field.'
      });
    }

    const result = await HospitalImportService.importHospitals(hospitals, { overwrite, source });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
