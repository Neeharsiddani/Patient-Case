import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, get, query } from '../db/database.js';
import { evaluateClinicalTriage } from '../services/redFlagEngine.js';
import { generateAssistiveSummary } from '../services/aiSummaryService.js';
import { recordAuditLog } from '../middleware/audit.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/patients/intake
 * Kiosk intake submission endpoint: routes patient case to selected Hospital and Department
 */
router.post('/intake', optionalAuth, async (req, res, next) => {
  try {
    const {
      name,
      age,
      gender,
      phone,
      address,
      abhaId,
      abhaAddress,
      language = 'English',
      hospitalId = 'hosp-ggh-hyd',
      hospitalName = 'Government General Hospital',
      departmentId = 'dept-ggh-hyd-genmed',
      department = 'General Medicine',
      reasonForVisit = '',
      consentAgreed,
      signatureData,
      chiefComplaints = [],
      duration = '1 day',
      painScore = 0,
      onset = '',
      hpi = {},
      pastMedicalHistory = [],
      pastSurgicalHistory = [],
      currentMedications = [],
      drugAllergies = [],
      familyHistory = '',
      personalHistory = '',
      reviewOfSystems = {},
      structuredDialogue = [],
      vitals = {},
      uploadedDocuments = [],
      ayushHistory = null
    } = req.body;

    // 1. Mandatory Data Validation
    if (!name || !age || !gender) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Patient name, age, and gender are required.'
      });
    }

    if (!consentAgreed) {
      return res.status(403).json({
        success: false,
        error: 'Consent Required',
        message: 'Patient intake cannot proceed without explicit consent under the DPDP Act 2023.'
      });
    }

    // 2. Hospital and Department verification
    const hospital = await get('SELECT id, name FROM hospitals WHERE id = ?', [hospitalId]);
    if (!hospital) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Hospital',
        message: 'A valid healthcare facility must be selected.'
      });
    }
    const validatedHospitalId = hospital.id;
    const validatedHospitalName = hospital.name;

    const dept = await get('SELECT id, name, room_number FROM departments WHERE id = ? AND hospital_id = ?', [departmentId, validatedHospitalId]);
    const validatedDeptId = dept ? dept.id : departmentId;
    const validatedDeptName = dept ? dept.name : department;
    const roomNumber = dept?.room_number || (validatedDeptName.includes('Cardiology') ? 'Room 104' : 'Room 101');

    // Auto-assign available primary doctor for this hospital & department if present
    const primaryDoctor = await get(
      `SELECT u.id, u.full_name 
       FROM doctor_departments dd
       JOIN users u ON dd.doctor_id = u.id
       WHERE dd.hospital_id = ? AND dd.department_id = ? AND u.status = 'ACTIVE'
       LIMIT 1`,
      [validatedHospitalId, validatedDeptId]
    );

    const assignedDoctorId = primaryDoctor ? primaryDoctor.id : null;
    const assignedDoctorName = primaryDoctor ? primaryDoctor.full_name : 'Assigned OPD Clinician';

    const patientId = `patient-${uuidv4().substring(0, 8)}`;
    const tokenNumber = `MED-${Math.floor(100 + Math.random() * 900)}`;

    // 3. Server-Side Deterministic Clinical Triage & Red-Flag Assessment
    const triageResult = evaluateClinicalTriage({
      chiefComplaints,
      hpi,
      vitals,
      painScore: parseInt(painScore, 10) || 0,
      drugAllergies,
      age: parseInt(age, 10) || 30
    });

    // 4. Assistive AI Clinical Summary Draft Generation
    const aiDraft = generateAssistiveSummary({
      patientName: name,
      age: parseInt(age, 10) || 30,
      gender,
      chiefComplaints,
      duration,
      painScore: parseInt(painScore, 10) || 0,
      onset,
      hpi,
      vitals,
      pastMedicalHistory,
      pastSurgicalHistory,
      currentMedications,
      drugAllergies,
      familyHistory,
      personalHistory,
      ayushHistory
    });

    // 5. Database Persistence: Insert Patient & Routed Case
    await run(`
      INSERT INTO patients (
        id, token_number, hospital_id, hospital_name, department_id, department, room_number,
        assigned_doctor_id, assigned_doctor_name, name, age, gender, phone, address,
        abha_id, abha_address, language, reason_for_visit, triage_level, triage_category, triage_color,
        wait_time, status, case_status, verification_status, ayush_history
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Waiting', 'Waiting for Review', 'Pending Verification', ?)
    `, [
      patientId, tokenNumber, validatedHospitalId, validatedHospitalName, validatedDeptId, validatedDeptName, roomNumber,
      assignedDoctorId, assignedDoctorName, name, parseInt(age, 10) || 30, gender,
      phone || '', address || '', abhaId || '', abhaAddress || '', language, reasonForVisit || chiefComplaints.join('; '),
      triageResult.triageLevel, triageResult.triageCategory, triageResult.triageColor, triageResult.waitTime,
      ayushHistory ? JSON.stringify(ayushHistory) : null
    ]);

    // 5b. Insert Granular AYUSH Clinical Record if present
    if (ayushHistory) {
      await run(`
        INSERT INTO ayush_histories (
          id, patient_id, hospital_id, department_id, dashavidha_pariksha, additional_history, clinician_verified
        ) VALUES (?, ?, ?, ?, ?, ?, 0)
      `, [
        uuidv4(),
        patientId,
        validatedHospitalId,
        validatedDeptId,
        JSON.stringify(ayushHistory.dashavidhaPariksha || {}),
        JSON.stringify(ayushHistory.additionalHistory || {})
      ]);
    }

    // 6. Insert Hospital-Scoped Consent Record (DPDP Act 2023)
    await run(`
      INSERT INTO consents (id, patient_id, hospital_id, status, scope, purpose, consent_type, signature_data, ip_address)
      VALUES (?, ?, ?, 'GRANTED', 'PATIENT_INTAKE_OPD', 'Clinical consultation, OPD triage and verified medical record storage under DPDP Act 2023', 'ELECTRONIC_TOUCH_SIGNATURE', ?, ?)
    `, [uuidv4(), patientId, validatedHospitalId, signatureData || '', req.ip || '127.0.0.1']);

    // 7. Insert Clinical History
    await run(`
      INSERT INTO clinical_histories (
        id, patient_id, chief_complaints, duration, pain_score, onset, hpi, past_medical_history,
        past_surgical_history, current_medications, drug_allergies, family_history, personal_history,
        review_of_systems, structured_dialogue
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(), patientId,
      JSON.stringify(chiefComplaints), duration, parseInt(painScore, 10) || 0, onset,
      JSON.stringify(hpi), JSON.stringify(pastMedicalHistory), JSON.stringify(pastSurgicalHistory),
      JSON.stringify(currentMedications), JSON.stringify(drugAllergies), familyHistory, personalHistory,
      JSON.stringify(reviewOfSystems), JSON.stringify(structuredDialogue)
    ]);

    // 8. Insert Vitals
    await run(`
      INSERT INTO vitals (
        id, patient_id, bp_systolic, bp_diastolic, pulse, spo2, temp, respiratory_rate, blood_sugar, weight, height
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(), patientId,
      vitals.bp_systolic || vitals.bpSystolic || null,
      vitals.bp_diastolic || vitals.bpDiastolic || null,
      vitals.pulse || null,
      vitals.spo2 || null,
      vitals.temp || null,
      vitals.respiratory_rate || null,
      vitals.blood_sugar || vitals.bloodSugar || null,
      vitals.weight || null,
      vitals.height || null
    ]);

    // 9. Insert Red Flags
    for (const flag of triageResult.redFlags) {
      await run(`
        INSERT INTO red_flags (id, patient_id, flag_text, severity, trigger_source)
        VALUES (?, ?, ?, 'HIGH', 'SERVER_DETERMINISTIC_RULES')
      `, [uuidv4(), patientId, flag]);
    }

    // 10. Insert AI Summary Draft
    await run(`
      INSERT INTO clinical_summaries (
        id, patient_id, subjective_summary, objective_summary, preliminary_risk_assessment,
        differential_diagnosis, suggested_next_steps, is_ai_draft, clinician_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
    `, [
      uuidv4(), patientId,
      aiDraft.subjective_summary, aiDraft.objective_summary, aiDraft.preliminary_risk_assessment,
      JSON.stringify(aiDraft.differential_diagnosis), JSON.stringify(aiDraft.suggested_next_steps)
    ]);

    // 11. Record Immutable Audit Log
    await recordAuditLog({
      userId: req.user ? req.user.id : 'KIOSK_INTAKE_STATION',
      userRole: 'PATIENT_KIOSK',
      hospitalId: validatedHospitalId,
      action: 'PATIENT_CASE_SUBMITTED',
      resourceType: 'PATIENT',
      resourceId: patientId,
      details: { tokenNumber, name, hospital: validatedHospitalName, department: validatedDeptName, triageCategory: triageResult.triageCategory },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(201).json({
      success: true,
      message: 'Patient intake registered and routed to hospital department queue successfully',
      data: {
        id: patientId,
        tokenNumber,
        hospitalId: validatedHospitalId,
        hospitalName: validatedHospitalName,
        departmentId: validatedDeptId,
        department: validatedDeptName,
        roomNumber,
        assignedDoctorName,
        triageLevel: triageResult.triageLevel,
        triageCategory: triageResult.triageCategory,
        triageColor: triageResult.triageColor,
        waitTime: triageResult.waitTime,
        redFlags: triageResult.redFlags
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/patients
 * Retrieve patient cases in the OPD queue with strict Role-Based Access Control
 * Hierarchy: Hospital -> Department -> Assigned/Authorized Cases
 */
router.get('/', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { status, triage, search, hospitalId, departmentId, myAssignedOnly } = req.query;

    // Reject attempt to access another hospital's patient list
    if (hospitalId && req.user.hospital_id && hospitalId !== req.user.hospital_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to query patient queues from another healthcare facility.'
      });
    }

    let sql = `
      SELECT 
        p.*,
        v.bp_systolic, v.bp_diastolic, v.pulse, v.spo2, v.temp, v.blood_sugar,
        ch.chief_complaints, ch.duration, ch.pain_score, ch.hpi, ch.past_medical_history,
        ch.past_surgical_history, ch.current_medications, ch.drug_allergies, ch.family_history,
        ch.personal_history, ch.review_of_systems,
        cs.subjective_summary, cs.objective_summary, cs.preliminary_risk_assessment,
        cs.differential_diagnosis, cs.suggested_next_steps, cs.is_ai_draft, cs.clinician_verified,
        cs.verified_at, cs.verified_by_doctor_id,
        dn.provisional_diagnosis, dn.icd10_codes, dn.prescriptions, dn.investigations, dn.advice
      FROM patients p
      LEFT JOIN vitals v ON p.id = v.patient_id
      LEFT JOIN clinical_histories ch ON p.id = ch.patient_id
      LEFT JOIN clinical_summaries cs ON p.id = cs.patient_id
      LEFT JOIN doctor_notes dn ON p.id = dn.patient_id
      WHERE 1=1
    `;
    const params = [];

    // --- STRICT HEALTHCARE RBAC AUTHORIZATION ENFORCEMENT ---
    if (req.user.role === 'DOCTOR') {
      // Doctor can ONLY view patients in their assigned hospital
      if (req.user.hospital_id) {
        sql += ' AND p.hospital_id = ?';
        params.push(req.user.hospital_id);
      }

      // Retrieve authorized departments for this doctor
      const authorizedDepts = await query(
        'SELECT department_id FROM doctor_departments WHERE doctor_id = ?',
        [req.user.id]
      );
      const authorizedDeptIds = authorizedDepts.map(d => d.department_id);

      if (myAssignedOnly === 'true') {
        sql += ' AND p.assigned_doctor_id = ?';
        params.push(req.user.id);
      } else if (authorizedDeptIds.length > 0) {
        // Doctor sees cases in their authorized departments OR cases assigned directly to them
        const placeholders = authorizedDeptIds.map(() => '?').join(', ');
        sql += ` AND (p.department_id IN (${placeholders}) OR p.assigned_doctor_id = ?)`;
        params.push(...authorizedDeptIds, req.user.id);
      } else {
        // If no departments mapped, only directly assigned cases
        sql += ' AND p.assigned_doctor_id = ?';
        params.push(req.user.id);
      }
    } else if (req.user.role === 'HOSPITAL_ADMIN') {
      // Hospital admin can only see patients belonging to their hospital
      if (req.user.hospital_id) {
        sql += ' AND p.hospital_id = ?';
        params.push(req.user.hospital_id);
      }
    }

    if (departmentId && departmentId !== 'all') {
      sql += ' AND (p.department_id = ? OR p.department LIKE ?)';
      params.push(departmentId, `%${departmentId}%`);
    }

    if (status && status !== 'all') {
      sql += ' AND (p.status = ? OR p.case_status = ?)';
      params.push(status, status);
    }

    if (triage && triage !== 'all') {
      sql += ' AND p.triage_level = ?';
      params.push(parseInt(triage, 10));
    }

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.token_number LIKE ? OR p.abha_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY p.triage_level ASC, p.created_at ASC';

    const rows = await query(sql, params);

    // Fetch red flags and documents for each patient
    const formattedPatients = await Promise.all(rows.map(async (row) => {
      const redFlags = await query('SELECT flag_text FROM red_flags WHERE patient_id = ?', [row.id]);
      const documents = await query('SELECT * FROM documents WHERE patient_id = ? ORDER BY uploaded_at DESC', [row.id]);

      return {
        id: row.id,
        tokenNumber: row.token_number,
        hospitalId: row.hospital_id,
        hospitalName: row.hospital_name,
        departmentId: row.department_id,
        department: row.department,
        roomNumber: row.room_number,
        assignedDoctorId: row.assigned_doctor_id,
        assignedDoctorName: row.assigned_doctor_name,
        name: row.name,
        age: row.age,
        gender: row.gender,
        phone: row.phone,
        address: row.address,
        abhaId: row.abha_id,
        abhaAddress: row.abha_address,
        language: row.language,
        reasonForVisit: row.reason_for_visit,
        triageLevel: row.triage_level,
        triageCategory: row.triage_category,
        triageColor: row.triage_color,
        waitTime: row.wait_time,
        status: row.status,
        caseStatus: row.case_status || row.status,
        verificationStatus: row.verification_status,
        verificationTimestamp: row.verification_timestamp,
        rejectionReason: row.rejection_reason,
        createdAt: row.created_at,
        redFlags: redFlags.map(f => f.flag_text),
        chiefComplaints: row.chief_complaints ? JSON.parse(row.chief_complaints) : [],
        duration: row.duration,
        painScore: row.pain_score,
        hpi: row.hpi ? JSON.parse(row.hpi) : {},
        pastMedicalHistory: row.past_medical_history ? JSON.parse(row.past_medical_history) : [],
        pastSurgicalHistory: row.past_surgical_history ? JSON.parse(row.past_surgical_history) : [],
        currentMedications: row.current_medications ? JSON.parse(row.current_medications) : [],
        drugAllergies: row.drug_allergies ? JSON.parse(row.drug_allergies) : [],
        familyHistory: row.family_history || '',
        personalHistory: row.personal_history || '',
        reviewOfSystems: row.review_of_systems ? JSON.parse(row.review_of_systems) : {},
        vitals: {
          bp_systolic: row.bp_systolic,
          bp_diastolic: row.bp_diastolic,
          pulse: row.pulse,
          spo2: row.spo2,
          temp: row.temp,
          blood_sugar: row.blood_sugar
        },
        aiSummary: {
          subjective_summary: row.subjective_summary,
          objective_summary: row.objective_summary,
          preliminary_risk_assessment: row.preliminary_risk_assessment,
          differential_diagnosis: row.differential_diagnosis ? JSON.parse(row.differential_diagnosis) : [],
          suggested_next_steps: row.suggested_next_steps ? JSON.parse(row.suggested_next_steps) : [],
          is_ai_draft: Boolean(row.is_ai_draft),
          clinician_verified: Boolean(row.clinician_verified),
          verified_at: row.verified_at
        },
        documents: documents.map(d => ({
          id: d.id,
          originalFilename: d.original_filename,
          storedFilename: d.stored_filename,
          docType: d.doc_type,
          hospitalName: d.hospital_name,
          docDate: d.doc_date,
          ocrConfidence: d.ocr_confidence,
          extractedData: d.extracted_data ? JSON.parse(d.extracted_data) : {}
        })),
        ayushHistory: row.ayush_history ? JSON.parse(row.ayush_history) : null
      };
    }));

    res.json({
      success: true,
      count: formattedPatients.length,
      patients: formattedPatients
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/patients/:id
 * Retrieve detailed patient record by ID with strict Permission & Consent verification
 */
router.get('/:id', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await get('SELECT * FROM patients WHERE id = ?', [id]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found',
        message: `No patient record found for ID ${id}.`
      });
    }

    // --- STRICT PATIENT PRIVACY & ACCESS CONTROL CHECK ---
    if (req.user.role === 'DOCTOR') {
      // Verify hospital relationship
      if (req.user.hospital_id && patient.hospital_id !== req.user.hospital_id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden Access',
          message: 'You are not authorized to view patient records belonging to another healthcare facility.'
        });
      }

      // Verify department authorization
      const authorizedDepts = await query(
        'SELECT department_id FROM doctor_departments WHERE doctor_id = ?',
        [req.user.id]
      );
      const authorizedDeptIds = authorizedDepts.map(d => d.department_id);

      const isAssigned = patient.assigned_doctor_id === req.user.id;
      const isDeptAuthorized = authorizedDeptIds.includes(patient.department_id);

      if (!isAssigned && !isDeptAuthorized && authorizedDeptIds.length > 0) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden Access',
          message: 'You are not authorized to view cases outside your registered clinical departments.'
        });
      }
    } else if (req.user.role === 'HOSPITAL_ADMIN') {
      if (req.user.hospital_id && patient.hospital_id !== req.user.hospital_id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden Access',
          message: 'Hospital Administrators can only access records from their registered facility.'
        });
      }
    }

    const vitals = await get('SELECT * FROM vitals WHERE patient_id = ?', [id]);
    const clinicalHistory = await get('SELECT * FROM clinical_histories WHERE patient_id = ?', [id]);
    const redFlags = await query('SELECT * FROM red_flags WHERE patient_id = ?', [id]);
    const aiSummary = await get('SELECT * FROM clinical_summaries WHERE patient_id = ?', [id]);
    const documents = await query('SELECT * FROM documents WHERE patient_id = ?', [id]);
    const consent = await get('SELECT * FROM consents WHERE patient_id = ? ORDER BY granted_at DESC LIMIT 1', [id]);

    // Record Audit Log for sensitive medical record access
    await recordAuditLog({
      userId: req.user ? req.user.id : 'UNAUTHENTICATED_KIOSK_VIEW',
      userRole: req.user ? req.user.role : 'CLIENT',
      hospitalId: patient.hospital_id,
      action: 'PATIENT_RECORD_VIEWED',
      resourceType: 'PATIENT',
      resourceId: id,
      details: { patientName: patient.name, tokenNumber: patient.token_number },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      patient: {
        ...patient,
        vitals: vitals || {},
        clinicalHistory: clinicalHistory ? {
          chiefComplaints: JSON.parse(clinicalHistory.chief_complaints || '[]'),
          duration: clinicalHistory.duration,
          painScore: clinicalHistory.pain_score,
          onset: clinicalHistory.onset,
          hpi: JSON.parse(clinicalHistory.hpi || '{}'),
          pastMedicalHistory: JSON.parse(clinicalHistory.past_medical_history || '[]'),
          pastSurgicalHistory: JSON.parse(clinicalHistory.past_surgical_history || '[]'),
          currentMedications: JSON.parse(clinicalHistory.current_medications || '[]'),
          drugAllergies: JSON.parse(clinicalHistory.drug_allergies || '[]'),
          familyHistory: clinicalHistory.family_history,
          personalHistory: clinicalHistory.personal_history,
          reviewOfSystems: JSON.parse(clinicalHistory.review_of_systems || '{}')
        } : {},
        redFlags: redFlags.map(f => f.flag_text),
        aiSummary: aiSummary ? {
          subjective_summary: aiSummary.subjective_summary,
          objective_summary: aiSummary.objective_summary,
          preliminary_risk_assessment: aiSummary.preliminary_risk_assessment,
          differential_diagnosis: JSON.parse(aiSummary.differential_diagnosis || '[]'),
          suggested_next_steps: JSON.parse(aiSummary.suggested_next_steps || '[]'),
          is_ai_draft: Boolean(aiSummary.is_ai_draft),
          clinician_verified: Boolean(aiSummary.clinician_verified),
          verified_at: aiSummary.verified_at
        } : null,
        documents: documents.map(d => ({
          id: d.id,
          originalFilename: d.original_filename,
          storedFilename: d.stored_filename,
          docType: d.doc_type,
          hospitalName: d.hospital_name,
          docDate: d.doc_date,
          ocrConfidence: d.ocr_confidence,
          extractedData: JSON.parse(d.extracted_data || '{}')
        })),
        ayushHistory: patient.ayush_history ? JSON.parse(patient.ayush_history) : null,
        consent: consent || null
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/patients/:id
 * Authorized hospital administrators can delete patient records
 * Enforces strict hospital tenant isolation and records immutable audit log
 */
router.delete('/:id', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await get('SELECT id, name, hospital_id FROM patients WHERE id = ?', [id]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found',
        message: `No patient record found for ID '${id}'.`
      });
    }

    if (req.user.hospital_id && patient.hospital_id !== req.user.hospital_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to delete patient records belonging to another healthcare facility.'
      });
    }

    // Cascading delete patient record (foreign keys clean up vitals, red flags, summaries, notes, etc.)
    await run('DELETE FROM patients WHERE id = ?', [id]);

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      hospitalId: req.user.hospital_id,
      action: 'PATIENT_RECORD_DELETED',
      resourceType: 'PATIENT',
      resourceId: id,
      details: { patientName: patient.name, hospitalId: patient.hospital_id },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Patient record for '${patient.name}' successfully deleted.`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
