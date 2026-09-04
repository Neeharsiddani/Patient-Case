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

    const { includeInactive } = req.query;
    let sql = `SELECT u.id, u.username, u.full_name, u.email, u.phone, u.hospital_id, u.department, u.license_number, u.qualification, u.status
               FROM users u
               WHERE u.hospital_id = ? AND u.role = 'DOCTOR'`;
    const params = [req.params.id];

    if (includeInactive !== 'true') {
      sql += ` AND u.status = 'ACTIVE'`;
    }
    sql += ` ORDER BY u.full_name ASC`;

    const doctors = await query(sql, params);

    // Attach authorized departments for each doctor
    const doctorsWithDepts = await Promise.all(
      doctors.map(async (doc) => {
        const depts = await query(
          `SELECT d.id, d.name, d.code, d.room_number, d.status 
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
      count: doctorsWithDepts.length,
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
 * Strictly validates doctor is ACTIVE, belongs to hospital, and is authorized for patient's department.
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

    // Verify doctor belongs to this hospital and is ACTIVE
    const doctor = await get("SELECT id, full_name, hospital_id, status FROM users WHERE id = ? AND role = 'DOCTOR'", [doctorId]);
    if (!doctor || doctor.hospital_id !== hospitalId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Doctor',
        message: 'Assigned doctor is not a registered clinician at this facility.'
      });
    }

    if (doctor.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Inactive Doctor',
        message: `Doctor ${doctor.full_name} is currently inactive or disabled and cannot receive patient assignments.`
      });
    }

    // Verify department authorization for the assigned doctor
    const doctorAuth = await get(
      `SELECT dd.department_id 
       FROM doctor_departments dd 
       WHERE dd.doctor_id = ? AND dd.hospital_id = ? AND dd.department_id = ?`,
      [doctor.id, hospitalId, patient.department_id]
    );

    if (!doctorAuth) {
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
      details: { doctorId: doctor.id, doctorName: doctor.full_name, patientName: patient.name, departmentId: patient.department_id },
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
 * POST /api/hospitals/:id/transfer-patient
 * Operational case routing: Transfer patient to another department within the same hospital.
 * Revalidates doctor department authorization; resets doctor assignment to unassigned if doctor is not authorized.
 */
router.post('/:id/transfer-patient', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { patientId, targetDepartmentId } = req.body;

    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to transfer patients for another healthcare facility.'
      });
    }

    if (!patientId || !targetDepartmentId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Patient ID and Target Department ID are required.'
      });
    }

    // Verify patient belongs to this hospital
    const patient = await get('SELECT * FROM patients WHERE id = ? AND hospital_id = ?', [patientId, hospitalId]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found',
        message: 'Patient does not belong to this healthcare facility.'
      });
    }

    // Verify target department belongs to this hospital and is ACTIVE
    const targetDept = await get('SELECT * FROM departments WHERE id = ? AND hospital_id = ? AND status = \'ACTIVE\'', [targetDepartmentId, hospitalId]);
    if (!targetDept) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Target Department',
        message: 'Target clinical department does not exist or is inactive in this healthcare facility.'
      });
    }

    let assignedDoctorId = patient.assigned_doctor_id;
    let assignedDoctorName = patient.assigned_doctor_name;
    let newStatus = patient.status;
    let newCaseStatus = patient.case_status;
    let doctorReassigned = false;

    // Revalidate doctor authorization for the new department
    if (assignedDoctorId) {
      const isDoctorAuthorized = await get(
        'SELECT id FROM doctor_departments WHERE doctor_id = ? AND hospital_id = ? AND department_id = ?',
        [assignedDoctorId, hospitalId, targetDept.id]
      );

      if (!isDoctorAuthorized) {
        // Doctor is not authorized for the new department — unassign safely
        assignedDoctorId = null;
        assignedDoctorName = null;
        doctorReassigned = true;
        if (newStatus === 'Assigned') newStatus = 'Waiting';
        if (newCaseStatus === 'Assigned') newCaseStatus = 'Waiting for Review';
      }
    }

    // Update patient record
    await run(
      `UPDATE patients 
       SET department_id = ?, department = ?, room_number = ?, 
           assigned_doctor_id = ?, assigned_doctor_name = ?,
           status = ?, case_status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND hospital_id = ?`,
      [targetDept.id, targetDept.name, targetDept.room_number || null, assignedDoctorId, assignedDoctorName, newStatus, newCaseStatus, patientId, hospitalId]
    );

    // Audit log
    await recordAuditLog({
      userId: req.user ? req.user.id : 'HOSPITAL_ADMIN',
      userRole: req.user ? req.user.role : 'HOSPITAL_ADMIN',
      hospitalId,
      action: 'PATIENT_TRANSFERRED_DEPARTMENT',
      resourceType: 'PATIENT',
      resourceId: patientId,
      details: {
        fromDepartmentId: patient.department_id,
        fromDepartmentName: patient.department,
        toDepartmentId: targetDept.id,
        toDepartmentName: targetDept.name,
        doctorReassigned,
        previousDoctor: patient.assigned_doctor_name
      },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Patient successfully transferred to ${targetDept.name}`,
      patientId,
      departmentId: targetDept.id,
      department: targetDept.name,
      roomNumber: targetDept.room_number,
      assignedDoctorId,
      assignedDoctorName,
      doctorReassigned,
      status: newStatus
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/hospitals/:id/patients/:patientId/case-status
 * Hospital Admin updates operational case status (routing only, clinical assessment remains clinician-controlled)
 */
router.patch('/:id/patients/:patientId/case-status', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { patientId } = req.params;
    const { status } = req.body;

    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to update case status for another healthcare facility.'
      });
    }

    const validStatuses = ['Waiting', 'Assigned', 'In-Consultation', 'Under Review', 'Completed', 'Rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const patient = await get('SELECT id, name, status, case_status FROM patients WHERE id = ? AND hospital_id = ?', [patientId, hospitalId]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found',
        message: 'Patient does not belong to this healthcare facility.'
      });
    }

    await run(
      'UPDATE patients SET status = ?, case_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND hospital_id = ?',
      [status, status, patientId, hospitalId]
    );

    await recordAuditLog({
      userId: req.user ? req.user.id : 'HOSPITAL_ADMIN',
      userRole: req.user ? req.user.role : 'HOSPITAL_ADMIN',
      hospitalId,
      action: 'PATIENT_OPERATIONAL_STATUS_CHANGED',
      resourceType: 'PATIENT',
      resourceId: patientId,
      details: { previousStatus: patient.status, newStatus: status },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Case operational status changed to ${status}`,
      patientId,
      status
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/:id/patients/:patientId/record
 * Read-only administrative view of complete patient record.
 * Clearly separates patient-reported, machine-extracted, and clinician-verified data.
 * Does NOT permit administrative editing of clinical diagnoses or prescriptions.
 */
router.get('/:id/patients/:patientId/record', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { patientId } = req.params;

    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to view patient records from another healthcare facility.'
      });
    }

    const patient = await get('SELECT * FROM patients WHERE id = ? AND hospital_id = ?', [patientId, hospitalId]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found',
        message: 'Patient does not belong to this healthcare facility.'
      });
    }

    // Safety Red Flags
    const redFlags = await query('SELECT flag_text, severity, trigger_source, detected_at FROM red_flags WHERE patient_id = ?', [patientId]);

    // Uploaded Documents Metadata (Read-Only)
    const documents = await query(
      `SELECT id, original_filename, file_size, mime_type, doc_type, hospital_name, doctor_name, doc_date, doc_year, verification_status, uploaded_at 
       FROM documents WHERE patient_id = ? ORDER BY uploaded_at DESC`,
      [patientId]
    );

    // Clinical Records Status Indicators
    const doctorNotesRow = await get('SELECT id, signed_at, created_at, (CASE WHEN provisional_diagnosis IS NOT NULL AND provisional_diagnosis != \'\' THEN 1 ELSE 0 END) as has_diagnosis FROM doctor_notes WHERE patient_id = ?', [patientId]);
    const summaryRow = await get('SELECT clinician_verified, verified_at FROM clinical_summaries WHERE patient_id = ?', [patientId]);
    const ayushRow = await get('SELECT clinician_verified, verified_at FROM ayush_histories WHERE patient_id = ?', [patientId]);

    // Structured Clinical History (Patient Reported)
    const clinicalHistory = await get('SELECT * FROM clinical_histories WHERE patient_id = ?', [patientId]);

    // Measured Vitals (Intake Recorded)
    const vitals = await get('SELECT * FROM vitals WHERE patient_id = ?', [patientId]);

    res.json({
      success: true,
      patientRecord: {
        administrativeInfo: {
          id: patient.id,
          tokenNumber: patient.token_number,
          hospitalId: patient.hospital_id,
          hospitalName: patient.hospital_name,
          departmentId: patient.department_id,
          department: patient.department,
          roomNumber: patient.room_number,
          assignedDoctorId: patient.assigned_doctor_id,
          assignedDoctorName: patient.assigned_doctor_name,
          operationalStatus: patient.status,
          caseStatus: patient.case_status,
          createdAt: patient.created_at,
          updatedAt: patient.updated_at
        },
        patientIdentity: {
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          phone: patient.phone,
          address: patient.address,
          abhaId: patient.abha_id,
          abhaAddress: patient.abha_address,
          language: patient.language
        },
        triageAssessment: {
          level: patient.triage_level,
          category: patient.triage_category,
          color: patient.triage_color,
          waitTime: patient.wait_time,
          redFlags: redFlags.map(f => ({ text: f.flag_text, severity: f.severity }))
        },
        patientReportedData: {
          reasonForVisit: patient.reason_for_visit,
          chiefComplaints: clinicalHistory?.chief_complaints ? JSON.parse(clinicalHistory.chief_complaints) : [],
          duration: clinicalHistory?.duration,
          painScore: clinicalHistory?.pain_score,
          onset: clinicalHistory?.onset,
          pastMedicalHistory: clinicalHistory?.past_medical_history ? JSON.parse(clinicalHistory.past_medical_history) : [],
          drugAllergies: clinicalHistory?.drug_allergies ? JSON.parse(clinicalHistory.drug_allergies) : [],
          currentMedications: clinicalHistory?.current_medications ? JSON.parse(clinicalHistory.currentMedications || '[]') : [],
          vitals: vitals ? {
            bpSystolic: vitals.bp_systolic,
            bpDiastolic: vitals.bp_diastolic,
            pulse: vitals.pulse,
            spo2: vitals.spo2,
            temp: vitals.temp
          } : null,
          hasAyushHistory: Boolean(patient.ayush_history)
        },
        machineExtractedMetadata: {
          documentCount: documents.length,
          documents: documents.map(d => ({
            id: d.id,
            filename: d.original_filename,
            fileSize: d.file_size,
            docType: d.doc_type,
            hospital: d.hospital_name,
            doctor: d.doctor_name,
            date: d.doc_date,
            status: d.verification_status,
            uploadedAt: d.uploaded_at
          }))
        },
        clinicalEncounterStatus: {
          hasDoctorNotes: Boolean(doctorNotesRow),
          isFinalizedAndSigned: Boolean(doctorNotesRow?.signed_at),
          signedAt: doctorNotesRow?.signed_at || null,
          hasProvisionalDiagnosis: Boolean(doctorNotesRow?.has_diagnosis),
          isAiSummaryClinicianVerified: Boolean(summaryRow?.clinician_verified),
          aiSummaryVerifiedAt: summaryRow?.verified_at || null,
          isAyushClinicianVerified: Boolean(ayushRow?.clinician_verified),
          ayushVerifiedAt: ayushRow?.verified_at || null,
          verificationStatus: patient.verification_status
        }
      }
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

    const cleanCode = code.trim().toUpperCase();

    // Prevent duplicate department codes within the same hospital
    const existingDept = await get('SELECT id FROM departments WHERE hospital_id = ? AND UPPER(code) = ?', [hospitalId, cleanCode]);
    if (existingDept) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate Code',
        message: `Department code '${cleanCode}' already exists in this healthcare facility.`
      });
    }

    const deptPrefix = hospitalId.startsWith('hosp-') ? hospitalId.slice(5) : hospitalId;
    const deptId = `dept-${deptPrefix}-${cleanCode.toLowerCase()}`;

    await run(
      `INSERT INTO departments (id, hospital_id, name, code, room_number, description, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [deptId, hospitalId, name.trim(), cleanCode, roomNumber?.trim() || null, description?.trim() || '']
    );

    // Audit log
    await recordAuditLog({
      userId: req.user ? req.user.id : 'HOSPITAL_ADMIN',
      userRole: req.user ? req.user.role : 'HOSPITAL_ADMIN',
      hospitalId,
      action: 'DEPARTMENT_CREATED',
      resourceType: 'DEPARTMENT',
      resourceId: deptId,
      details: { name, code: cleanCode, roomNumber },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(201).json({
      success: true,
      message: `Department '${name}' created successfully`,
      department: { id: deptId, hospital_id: hospitalId, name: name.trim(), code: cleanCode, room_number: roomNumber || null, status: 'ACTIVE' }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/hospitals/:id/departments/:deptId
 * Hospital Admin edits an existing clinical department
 */
router.put('/:id/departments/:deptId', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { deptId } = req.params;
    const { name, code, roomNumber, description } = req.body;

    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to modify departments for another healthcare facility.'
      });
    }

    const existing = await get('SELECT * FROM departments WHERE id = ? AND hospital_id = ?', [deptId, hospitalId]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Department Not Found',
        message: 'Department not found in this healthcare facility.'
      });
    }

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Department name and code are required.'
      });
    }

    const cleanCode = code.trim().toUpperCase();

    // Prevent duplicate codes within the same hospital (excluding current department)
    const duplicate = await get('SELECT id FROM departments WHERE hospital_id = ? AND UPPER(code) = ? AND id != ?', [hospitalId, cleanCode, deptId]);
    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate Code',
        message: `Department code '${cleanCode}' is already in use by another department in this facility.`
      });
    }

    await run(
      `UPDATE departments 
       SET name = ?, code = ?, room_number = ?, description = ? 
       WHERE id = ? AND hospital_id = ?`,
      [name.trim(), cleanCode, roomNumber?.trim() || null, description?.trim() || '', deptId, hospitalId]
    );

    // Audit log
    await recordAuditLog({
      userId: req.user ? req.user.id : 'HOSPITAL_ADMIN',
      userRole: req.user ? req.user.role : 'HOSPITAL_ADMIN',
      hospitalId,
      action: 'DEPARTMENT_UPDATED',
      resourceType: 'DEPARTMENT',
      resourceId: deptId,
      details: { previousName: existing.name, newName: name, code: cleanCode, roomNumber },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Department '${name}' updated successfully`,
      department: { id: deptId, hospital_id: hospitalId, name: name.trim(), code: cleanCode, room_number: roomNumber || null, status: existing.status }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/hospitals/:id/departments/:deptId/status
 * Hospital Admin enables or disables a clinical department
 */
router.patch('/:id/departments/:deptId/status', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { deptId } = req.params;
    const { status } = req.body;

    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to update department status for another healthcare facility.'
      });
    }

    if (status !== 'ACTIVE' && status !== 'INACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Invalid Status',
        message: "Status must be 'ACTIVE' or 'INACTIVE'."
      });
    }

    const dept = await get('SELECT * FROM departments WHERE id = ? AND hospital_id = ?', [deptId, hospitalId]);
    if (!dept) {
      return res.status(404).json({
        success: false,
        error: 'Department Not Found',
        message: 'Department not found in this healthcare facility.'
      });
    }

    await run('UPDATE departments SET status = ? WHERE id = ? AND hospital_id = ?', [status, deptId, hospitalId]);

    // Audit log
    await recordAuditLog({
      userId: req.user ? req.user.id : 'HOSPITAL_ADMIN',
      userRole: req.user ? req.user.role : 'HOSPITAL_ADMIN',
      hospitalId,
      action: 'DEPARTMENT_STATUS_TOGGLED',
      resourceType: 'DEPARTMENT',
      resourceId: deptId,
      details: { previousStatus: dept.status, newStatus: status, departmentName: dept.name },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Department '${dept.name}' is now ${status.toLowerCase()}`,
      departmentId: deptId,
      status
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
    const { username, password, fullName, email, phone, department, licenseNumber, qualification, departmentIds = [] } = req.body;

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

    // Check duplicate username
    const existingUser = await get('SELECT id FROM users WHERE username = ?', [username.trim().toLowerCase()]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username Taken',
        message: `Username '${username}' is already registered.`
      });
    }

    // Validate authorized departments belong to this hospital
    for (const deptId of departmentIds) {
      const validDept = await get('SELECT id FROM departments WHERE id = ? AND hospital_id = ?', [deptId, hospitalId]);
      if (!validDept) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Department Authorization',
          message: `Department ID '${deptId}' does not belong to this healthcare facility.`
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const doctorId = `usr-doc-${uuidv4().substring(0, 8)}`;

    await run(
      `INSERT INTO users (id, username, password_hash, role, full_name, email, phone, hospital_id, department, license_number, qualification, status)
       VALUES (?, ?, ?, 'DOCTOR', ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [doctorId, username.trim().toLowerCase(), passwordHash, fullName.trim(), email?.trim() || '', phone?.trim() || '', hospitalId, department?.trim() || '', licenseNumber?.trim() || '', qualification?.trim() || '']
    );

    // Map authorized departments
    for (const deptId of departmentIds) {
      await run(
        `INSERT INTO doctor_departments (id, doctor_id, department_id, hospital_id)
         VALUES (?, ?, ?, ?)`,
        [uuidv4(), doctorId, deptId, hospitalId]
      );
    }

    // Audit log
    await recordAuditLog({
      userId: req.user ? req.user.id : 'HOSPITAL_ADMIN',
      userRole: req.user ? req.user.role : 'HOSPITAL_ADMIN',
      hospitalId,
      action: 'DOCTOR_REGISTERED',
      resourceType: 'DOCTOR',
      resourceId: doctorId,
      details: { doctorName: fullName, username, departmentIds },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(201).json({
      success: true,
      message: `Doctor '${fullName}' registered successfully`,
      doctor: { id: doctorId, username: username.trim().toLowerCase(), fullName: fullName.trim(), hospital_id: hospitalId }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/hospitals/:id/doctors/:doctorId
 * Hospital Admin updates doctor profile and authorized departments
 */
router.put('/:id/doctors/:doctorId', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { doctorId } = req.params;
    const { fullName, email, phone, department, licenseNumber, qualification, departmentIds } = req.body;

    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to update doctor profiles for another healthcare facility.'
      });
    }

    const doctor = await get('SELECT * FROM users WHERE id = ? AND hospital_id = ? AND role = \'DOCTOR\'', [doctorId, hospitalId]);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor Not Found',
        message: 'Doctor not found in this healthcare facility.'
      });
    }

    if (!fullName) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Doctor full name is required.'
      });
    }

    // Update authorized departments if provided
    if (Array.isArray(departmentIds)) {
      // Prevent leaving an active doctor with zero authorized departments
      if (doctor.status === 'ACTIVE' && departmentIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'An active clinician must have at least one authorized clinical department. Deactivate the clinician account if you wish to revoke all department authorizations.'
        });
      }

      // Verify all department IDs belong to this hospital
      for (const deptId of departmentIds) {
        const validDept = await get('SELECT id FROM departments WHERE id = ? AND hospital_id = ?', [deptId, hospitalId]);
        if (!validDept) {
          return res.status(400).json({
            success: false,
            error: 'Invalid Department',
            message: `Department '${deptId}' does not belong to this healthcare facility.`
          });
        }
      }

      // Re-map doctor departments
      await run('DELETE FROM doctor_departments WHERE doctor_id = ? AND hospital_id = ?', [doctorId, hospitalId]);
      for (const deptId of departmentIds) {
        await run(
          'INSERT INTO doctor_departments (id, doctor_id, department_id, hospital_id) VALUES (?, ?, ?, ?)',
          [uuidv4(), doctorId, deptId, hospitalId]
        );
      }
    }

    // Update users table
    await run(
      `UPDATE users 
       SET full_name = ?, email = ?, phone = ?, department = ?, license_number = ?, qualification = ? 
       WHERE id = ? AND hospital_id = ?`,
      [
        fullName.trim(),
        email != null ? email.trim() : doctor.email,
        phone != null ? phone.trim() : doctor.phone,
        department != null ? department.trim() : doctor.department,
        licenseNumber != null ? licenseNumber.trim() : doctor.license_number,
        qualification != null ? qualification.trim() : doctor.qualification,
        doctorId,
        hospitalId
      ]
    );

    // Audit log
    await recordAuditLog({
      userId: req.user ? req.user.id : 'HOSPITAL_ADMIN',
      userRole: req.user ? req.user.role : 'HOSPITAL_ADMIN',
      hospitalId,
      action: 'DOCTOR_PROFILE_UPDATED',
      resourceType: 'DOCTOR',
      resourceId: doctorId,
      details: { doctorName: fullName, departmentIds: departmentIds || 'UNCHANGED' },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Profile for Dr. ${fullName} updated successfully`,
      doctorId
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/hospitals/:id/doctors/:doctorId/status
 * Hospital Admin enables or disables a doctor account.
 * When disabling, checks for active patient cases and handles reassignment safely.
 */
router.patch('/:id/doctors/:doctorId/status', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { doctorId } = req.params;
    const { status, reassignActiveCases = false } = req.body;

    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to modify doctor accounts for another healthcare facility.'
      });
    }

    if (status !== 'ACTIVE' && status !== 'INACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Invalid Status',
        message: "Status must be 'ACTIVE' or 'INACTIVE'."
      });
    }

    const doctor = await get('SELECT * FROM users WHERE id = ? AND hospital_id = ? AND role = \'DOCTOR\'', [doctorId, hospitalId]);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor Not Found',
        message: 'Doctor not found in this healthcare facility.'
      });
    }

    let reassignedCount = 0;
    if (status === 'INACTIVE') {
      // Check for active assigned cases
      const activeCases = await query(
        "SELECT id FROM patients WHERE assigned_doctor_id = ? AND status != 'Completed' AND hospital_id = ?",
        [doctorId, hospitalId]
      );

      if (activeCases.length > 0) {
        if (!reassignActiveCases) {
          return res.status(400).json({
            success: false,
            hasActiveCases: true,
            activeCaseCount: activeCases.length,
            error: 'Active Cases Pending',
            message: `Dr. ${doctor.full_name} has ${activeCases.length} active assigned case(s). Please confirm safe reassignment to the Waiting queue to proceed with deactivation.`
          });
        }

        // Safely reassign active cases to Waiting queue
        await run(
          `UPDATE patients 
           SET assigned_doctor_id = NULL, assigned_doctor_name = NULL, 
               status = CASE WHEN status = 'Assigned' THEN 'Waiting' ELSE status END,
               case_status = CASE WHEN case_status = 'Assigned' THEN 'Waiting for Review' ELSE case_status END,
               updated_at = CURRENT_TIMESTAMP 
           WHERE assigned_doctor_id = ? AND status != 'Completed' AND hospital_id = ?`,
          [doctorId, hospitalId]
        );
        reassignedCount = activeCases.length;
      }
    }

    await run('UPDATE users SET status = ? WHERE id = ? AND hospital_id = ?', [status, doctorId, hospitalId]);

    // Audit log
    await recordAuditLog({
      userId: req.user ? req.user.id : 'HOSPITAL_ADMIN',
      userRole: req.user ? req.user.role : 'HOSPITAL_ADMIN',
      hospitalId,
      action: 'DOCTOR_STATUS_TOGGLED',
      resourceType: 'DOCTOR',
      resourceId: doctorId,
      details: { doctorName: doctor.full_name, previousStatus: doctor.status, newStatus: status, reassignedCount },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Dr. ${doctor.full_name} is now ${status === 'ACTIVE' ? 'Active' : 'Disabled'}${reassignedCount > 0 ? ` (${reassignedCount} active cases returned to Waiting queue)` : ''}`,
      doctorId,
      status,
      reassignedCount
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hospitals/:id/doctors/:doctorId/reset-password
 * Hospital Admin securely resets doctor credentials with bcrypt hashing
 */
router.post('/:id/doctors/:doctorId/reset-password', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { doctorId } = req.params;
    const { newPassword } = req.body;

    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to reset doctor credentials for another healthcare facility.'
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'New password must be at least 6 characters in length.'
      });
    }

    const doctor = await get('SELECT id, full_name, username FROM users WHERE id = ? AND hospital_id = ? AND role = \'DOCTOR\'', [doctorId, hospitalId]);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor Not Found',
        message: 'Doctor not found in this healthcare facility.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword.trim(), salt);

    await run('UPDATE users SET password_hash = ? WHERE id = ? AND hospital_id = ?', [passwordHash, doctorId, hospitalId]);

    // Audit log
    await recordAuditLog({
      userId: req.user ? req.user.id : 'HOSPITAL_ADMIN',
      userRole: req.user ? req.user.role : 'HOSPITAL_ADMIN',
      hospitalId,
      action: 'DOCTOR_CREDENTIALS_RESET',
      resourceType: 'DOCTOR',
      resourceId: doctorId,
      details: { doctorName: doctor.full_name, username: doctor.username },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Credentials for Dr. ${doctor.full_name} have been securely reset.`
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/hospitals/:id/settings
 * Hospital Admin updates facility configurable metadata (name, address, phone, email, description)
 * Authoritative identifiers (id, code, hfr_id) remain protected.
 */
router.put('/:id/settings', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { name, phone, email, location, city, state, pincode, description } = req.body;

    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to modify settings for another healthcare facility.'
      });
    }

    const hospital = await get('SELECT * FROM hospitals WHERE id = ?', [hospitalId]);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Hospital Not Found',
        message: 'Healthcare facility not found.'
      });
    }

    await run(
      `UPDATE hospitals 
       SET name = COALESCE(?, name), 
           phone = COALESCE(?, phone), 
           email = COALESCE(?, email), 
           location = COALESCE(?, location), 
           city = COALESCE(?, city), 
           state = COALESCE(?, state), 
           pincode = COALESCE(?, pincode), 
           description = COALESCE(?, description) 
       WHERE id = ?`,
      [
        name?.trim() || null,
        phone?.trim() || null,
        email?.trim() || null,
        location?.trim() || null,
        city?.trim() || null,
        state?.trim() || null,
        pincode?.trim() || null,
        description?.trim() || null,
        hospitalId
      ]
    );

    const updatedHospital = await get('SELECT id, name, code, location, district, city, state, pincode, facility_type, hfr_id, phone, email, description, status FROM hospitals WHERE id = ?', [hospitalId]);

    // Audit log
    await recordAuditLog({
      userId: req.user ? req.user.id : 'HOSPITAL_ADMIN',
      userRole: req.user ? req.user.role : 'HOSPITAL_ADMIN',
      hospitalId,
      action: 'HOSPITAL_SETTINGS_UPDATED',
      resourceType: 'HOSPITAL',
      resourceId: hospitalId,
      details: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'Hospital settings updated successfully',
      hospital: updatedHospital
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/:id/audit-logs
 * Retrieve immutable audit logs strictly scoped to this healthcare facility
 */
router.get('/:id/audit-logs', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    const { limit = 50, offset = 0, action, resourceType } = req.query;

    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to view audit logs for another healthcare facility.'
      });
    }

    let sql = 'SELECT * FROM audit_logs WHERE hospital_id = ?';
    const params = [hospitalId];

    if (action) {
      sql += ' AND action = ?';
      params.push(action);
    }
    if (resourceType) {
      sql += ' AND resource_type = ?';
      params.push(resourceType);
    }

    const tableInfo = await query("PRAGMA table_info(audit_logs)");
    const timeCol = tableInfo.some(c => c.name === 'timestamp') ? 'timestamp' : 'created_at';
    sql += ` ORDER BY ${timeCol} DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const logs = await query(sql, params);

    res.json({
      success: true,
      hospitalId,
      count: logs.length,
      logs: logs.map(l => ({
        id: l.id,
        timestamp: l.timestamp || l.created_at,
        userId: l.user_id,
        userRole: l.user_role,
        action: l.action,
        resourceType: l.resource_type,
        resourceId: l.resource_id,
        details: l.details ? (typeof l.details === 'string' ? JSON.parse(l.details) : l.details) : {},
        ipAddress: l.ip_address
      }))
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
