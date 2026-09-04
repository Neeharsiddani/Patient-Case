import express from 'express';
import fs from 'fs';
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
      hospitalName = 'Government General Hospital (Osmania General Hospital)',
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

    // Resolve department strictly within the validated hospital
    let dept = await get(
      'SELECT id, name, room_number, code FROM departments WHERE id = ? AND hospital_id = ?',
      [departmentId, validatedHospitalId]
    );

    if (!dept && departmentId) {
      // Match by department code or ID suffix (e.g. 'genmed' -> 'GENMED', 'dept-genmed' -> '%genmed%')
      const rawCode = departmentId.replace(/^dept-/, '').toUpperCase();
      dept = await get(
        `SELECT id, name, room_number, code FROM departments 
         WHERE hospital_id = ? AND (
           UPPER(code) = ? 
           OR id LIKE ?
           OR UPPER(code) = UPPER(?)
         ) LIMIT 1`,
        [validatedHospitalId, rawCode, `%${departmentId.replace(/^dept-/, '')}%`, department]
      );
    }

    if (!dept && department) {
      // Match by department name
      dept = await get(
        `SELECT id, name, room_number, code FROM departments 
         WHERE hospital_id = ? AND (
           LOWER(name) = LOWER(?) 
           OR LOWER(name) LIKE LOWER(?)
         ) LIMIT 1`,
        [validatedHospitalId, department, `%${department}%`]
      );
    }

    if (!dept) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Department',
        message: `Department '${departmentId || department}' is not available at this healthcare facility.`
      });
    }

    const validatedDeptId = dept.id;
    const validatedDeptName = dept.name;
    const roomNumber = dept.room_number || null;

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
    const assignedDoctorName = primaryDoctor ? primaryDoctor.full_name : null;

    // 2b. Idempotency Check: Prevent duplicate submissions within 10 seconds
    if (name) {
      const recentSubmission = phone ? await get(
        `SELECT id, token_number, created_at FROM patients 
         WHERE hospital_id = ? AND phone = ? AND name = ?
         AND datetime(created_at) >= datetime('now', '-10 seconds')
         ORDER BY created_at DESC LIMIT 1`,
        [validatedHospitalId, phone, name]
      ) : await get(
        `SELECT id, token_number, created_at FROM patients 
         WHERE hospital_id = ? AND (phone = '' OR phone IS NULL) AND name = ?
         AND datetime(created_at) >= datetime('now', '-10 seconds')
         ORDER BY created_at DESC LIMIT 1`,
        [validatedHospitalId, name]
      );

      if (recentSubmission) {
        return res.status(200).json({
          success: true,
          message: 'Patient intake already registered (idempotent)',
          data: {
            id: recentSubmission.id,
            tokenNumber: recentSubmission.token_number,
            hospitalId: validatedHospitalId,
            hospitalName: validatedHospitalName,
            departmentId: validatedDeptId,
            department: validatedDeptName,
            roomNumber,
            assignedDoctorName
          }
        });
      }
    }

    const patientId = `patient-${uuidv4().substring(0, 8)}`;
    
    // Unique token number generation per hospital per day
    const deptPrefix = (validatedDeptName.includes('Cardiology') ? 'CARD' 
      : validatedDeptName.includes('Ortho') ? 'ORTH' 
      : validatedDeptName.includes('Pediatric') ? 'PED' 
      : validatedDeptName.includes('AYUSH') ? 'AYU'
      : 'MED');

    let tokenNumber;
    let isTokenUnique = false;
    let tokenAttempts = 0;
    while (!isTokenUnique && tokenAttempts < 10) {
      const candidate = `${deptPrefix}-${Math.floor(100 + Math.random() * 900)}`;
      const existingToken = await get(
        'SELECT id FROM patients WHERE hospital_id = ? AND token_number = ? AND DATE(created_at) = DATE("now")',
        [validatedHospitalId, candidate]
      );
      if (!existingToken) {
        tokenNumber = candidate;
        isTokenUnique = true;
      }
      tokenAttempts++;
    }
    if (!tokenNumber) {
      tokenNumber = `${deptPrefix}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const parsedAge = (age !== undefined && age !== null && age !== '' && !isNaN(parseInt(age, 10))) 
      ? parseInt(age, 10) 
      : null;

    // 3. Server-Side Deterministic Clinical Triage & Red-Flag Assessment
    const triageResult = evaluateClinicalTriage({
      chiefComplaints,
      hpi,
      vitals,
      painScore: parseInt(painScore, 10) || 0,
      drugAllergies,
      age: parsedAge || 0
    });

    // 4. Assistive AI Clinical Summary Draft Generation
    const aiDraft = generateAssistiveSummary({
      patientName: name,
      age: parsedAge,
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

    // 5. Database Persistence: Transactional multi-table insertion
    await run('BEGIN TRANSACTION');
    try {
      await run(`
        INSERT INTO patients (
          id, token_number, hospital_id, hospital_name, department_id, department, room_number,
          assigned_doctor_id, assigned_doctor_name, name, age, gender, phone, address,
          abha_id, abha_address, language, reason_for_visit, triage_level, triage_category, triage_color,
          wait_time, status, case_status, verification_status, ayush_history
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Waiting', 'Waiting for Review', 'Pending Verification', ?)
      `, [
        patientId, tokenNumber, validatedHospitalId, validatedHospitalName, validatedDeptId, validatedDeptName, roomNumber,
        assignedDoctorId, assignedDoctorName, name, parsedAge, gender,
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

      // Sanitize reviewOfSystems so it never makes false claims about unrecorded vitals
      const sanitizedRos = { ...(reviewOfSystems || {}) };
      const hasBp = Boolean(vitals.bp_systolic || vitals.bpSystolic);
      const hasPulse = Boolean(vitals.pulse);
      const hasSpo2 = Boolean(vitals.spo2);

      if (!sanitizedRos.cardiovascular || sanitizedRos.cardiovascular === 'Heart rate and BP recorded at kiosk.') {
        if (hasBp && hasPulse) {
          sanitizedRos.cardiovascular = `Heart rate (${vitals.pulse} bpm) and BP (${vitals.bp_systolic || vitals.bpSystolic}/${vitals.bp_diastolic || vitals.bpDiastolic || '--'} mmHg) recorded at kiosk.`;
        } else if (hasBp) {
          sanitizedRos.cardiovascular = `BP (${vitals.bp_systolic || vitals.bpSystolic}/${vitals.bp_diastolic || vitals.bpDiastolic || '--'} mmHg) recorded at kiosk. Heart rate not recorded.`;
        } else if (hasPulse) {
          sanitizedRos.cardiovascular = `Heart rate (${vitals.pulse} bpm) recorded at kiosk. Blood pressure not recorded.`;
        } else {
          sanitizedRos.cardiovascular = 'Blood pressure and heart rate: Not recorded during intake.';
        }
      }

      if (!sanitizedRos.respiratory || sanitizedRos.respiratory === 'SpO2 saturation monitored at kiosk.') {
        if (hasSpo2) {
          sanitizedRos.respiratory = `SpO2 saturation (${vitals.spo2}%) monitored at kiosk.`;
        } else {
          sanitizedRos.respiratory = 'SpO2: Not recorded during intake.';
        }
      }

      if (!sanitizedRos.intakeNote) {
        sanitizedRos.intakeNote = 'Clinical review of systems to be conducted by attending physician.';
      }

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
        JSON.stringify(sanitizedRos), JSON.stringify(structuredDialogue)
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

      // 10b. Persist Uploaded Documents linked to this newly created Patient
      if (Array.isArray(uploadedDocuments) && uploadedDocuments.length > 0) {
        for (const doc of uploadedDocuments) {
          const docId = doc.id || uuidv4();
          const existingDoc = await get('SELECT id FROM documents WHERE id = ?', [docId]);
          const docType = doc.typeName || doc.docType || doc.type || 'Document type not detected';
          const extData = doc.extractedData || {
            medicines: doc.medicines || [],
            investigations: doc.investigations || [],
            procedures: doc.procedures || [],
            rawOcrText: doc.rawOcrText || ''
          };

          if (existingDoc) {
            // Re-assign document from temporary upload session to permanent patient record
            await run(`
              UPDATE documents
              SET patient_id = ?,
                  hospital_name = COALESCE(?, hospital_name),
                  doc_type = COALESCE(?, doc_type),
                  doc_type_name = COALESCE(?, doc_type_name)
              WHERE id = ?
            `, [patientId, validatedHospitalName, docType, docType, docId]);
          } else {
            // Document processed client-side or newly uploaded
            await run(`
              INSERT INTO documents (
                id, patient_id, original_filename, stored_filename, file_path,
                mime_type, file_size, doc_type, doc_type_name, doc_date, doc_year,
                hospital_name, doctor_name, diagnosis, ocr_confidence, raw_ocr_text, extracted_data, verification_status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              docId,
              patientId,
              doc.title || doc.originalFilename || 'Medical_Record.pdf',
              doc.storedFilename || `${docId}.pdf`,
              doc.filePath || `uploads/${docId}.pdf`,
              doc.mimeType || 'application/pdf',
              doc.fileSize || 0,
              docType,
              docType,
              doc.date || doc.docDate || null,
              doc.year || doc.docYear || null,
              doc.hospital || doc.hospitalName || validatedHospitalName,
              doc.doctor || doc.doctorName || null,
              doc.diagnosis || null,
              doc.ocrConfidence ?? null,
              doc.rawOcrText || '',
              JSON.stringify(extData),
              doc.verificationStatus || 'MACHINE_EXTRACTED_UNVERIFIED'
            ]);
          }
        }
      }

      await run('COMMIT');
    } catch (txErr) {
      await run('ROLLBACK');
      throw txErr;
    }

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
        redFlags: triageResult.redFlags,
        aiSummary: {
          subjective_summary: aiDraft.subjective_summary,
          objective_summary: aiDraft.objective_summary,
          preliminary_risk_assessment: aiDraft.preliminary_risk_assessment,
          differential_diagnosis: aiDraft.differential_diagnosis,
          suggested_next_steps: aiDraft.suggested_next_steps,
          is_ai_draft: true,
          clinician_verified: false
        },
        aiGeneratedDraft: {
          disclaimer: aiDraft.disclaimer,
          subjectiveSummary: aiDraft.subjective_summary,
          objectiveSummary: aiDraft.objective_summary,
          preliminaryRiskAssessment: aiDraft.preliminary_risk_assessment,
          differentialDiagnosisDraft: aiDraft.differential_diagnosis,
          suggestedNextSteps: aiDraft.suggested_next_steps
        }
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
        dn.provisional_diagnosis, dn.icd10_codes, dn.prescriptions, dn.investigations, dn.advice, dn.follow_up, dn.signed_at, dn.doctor_id
      FROM patients p
      LEFT JOIN vitals v ON p.id = v.patient_id
      LEFT JOIN clinical_histories ch ON p.id = ch.patient_id
      LEFT JOIN (
        SELECT patient_id, subjective_summary, objective_summary, preliminary_risk_assessment,
               differential_diagnosis, suggested_next_steps, is_ai_draft, clinician_verified,
               verified_at, verified_by_doctor_id
        FROM clinical_summaries
        GROUP BY patient_id
        HAVING MAX(rowid)
      ) cs ON p.id = cs.patient_id
      LEFT JOIN (
        SELECT patient_id, provisional_diagnosis, icd10_codes, prescriptions, investigations, advice, follow_up, signed_at, doctor_id
        FROM doctor_notes
        GROUP BY patient_id
        HAVING MAX(rowid)
      ) dn ON p.id = dn.patient_id
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
        `SELECT dd.department_id, d.name, d.code 
         FROM doctor_departments dd
         LEFT JOIN departments d ON dd.department_id = d.id
         WHERE dd.doctor_id = ?`,
        [req.user.id]
      );
      const authorizedDeptIds = authorizedDepts.map(d => d.department_id).filter(Boolean);
      const authorizedDeptNames = authorizedDepts.map(d => d.name).filter(Boolean);

      if (myAssignedOnly === 'true') {
        sql += ' AND p.assigned_doctor_id = ?';
        params.push(req.user.id);
      } else if (authorizedDeptIds.length > 0) {
        // Doctor sees cases in their authorized departments (by ID or Name) OR cases assigned directly to them
        const idPlaceholders = authorizedDeptIds.map(() => '?').join(', ');
        const namePlaceholders = authorizedDeptNames.map(() => '?').join(', ');
        
        let deptCondition = `(p.department_id IN (${idPlaceholders})`;
        const deptParams = [...authorizedDeptIds];

        if (authorizedDeptNames.length > 0) {
          deptCondition += ` OR p.department IN (${namePlaceholders})`;
          deptParams.push(...authorizedDeptNames);
        }
        deptCondition += ' OR p.assigned_doctor_id = ?)';
        deptParams.push(req.user.id);

        sql += ` AND ${deptCondition}`;
        params.push(...deptParams);
      } else {
        // If no doctor_departments rows, check user's assigned department string or directly assigned cases
        if (req.user.department) {
          sql += ' AND (p.department LIKE ? OR p.assigned_doctor_id = ?)';
          params.push(`%${req.user.department}%`, req.user.id);
        } else {
          sql += ' AND p.assigned_doctor_id = ?';
          params.push(req.user.id);
        }
      }
    } else if (req.user.role === 'HOSPITAL_ADMIN') {
      // Hospital admin can only see patients belonging to their hospital
      if (req.user.hospital_id) {
        sql += ' AND p.hospital_id = ?';
        params.push(req.user.hospital_id);
      } else {
        return res.status(403).json({
          success: false,
          error: 'Forbidden Access',
          message: 'Hospital Administrator must have an assigned hospital.'
        });
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
        assignedDoctor: row.assigned_doctor_name || null,
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
          bpSystolic: row.bp_systolic,
          bpDiastolic: row.bp_diastolic,
          pulse: row.pulse,
          spo2: row.spo2,
          temp: row.temp,
          blood_sugar: row.blood_sugar,
          bloodSugar: row.blood_sugar
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
        aiGeneratedDraft: row.subjective_summary ? {
          disclaimer: 'AI-generated draft — Doctor verification required. Not a final clinical diagnosis.',
          subjectiveSummary: row.subjective_summary,
          objectiveSummary: row.objective_summary,
          preliminaryRiskAssessment: row.preliminary_risk_assessment,
          differentialDiagnosisDraft: row.differential_diagnosis ? JSON.parse(row.differential_diagnosis) : [],
          suggestedNextSteps: row.suggested_next_steps ? JSON.parse(row.suggested_next_steps) : []
        } : null,
        doctorNotes: (row.provisional_diagnosis != null || row.icd10_codes != null || row.prescriptions != null || row.investigations != null || row.advice != null || row.follow_up != null) ? {
          provisionalDiagnosis: (row.provisional_diagnosis && row.provisional_diagnosis !== 'Clinical Assessment Recorded' && row.provisional_diagnosis !== 'Clinical History Verified') ? row.provisional_diagnosis : '',
          icd10: row.icd10_codes ? (typeof row.icd10_codes === 'string' ? JSON.parse(row.icd10_codes) : row.icd10_codes) : [],
          prescriptions: row.prescriptions ? (typeof row.prescriptions === 'string' ? JSON.parse(row.prescriptions) : row.prescriptions) : [],
          investigations: row.investigations ? (typeof row.investigations === 'string' ? JSON.parse(row.investigations) : row.investigations) : [],
          advice: row.advice || '',
          followUp: row.follow_up || '',
          signedAt: row.signed_at || null,
          doctorId: row.doctor_id || null
        } : {
          provisionalDiagnosis: '',
          icd10: [],
          prescriptions: [],
          investigations: [],
          advice: '',
          followUp: ''
        },
        documents: documents.map(d => {
          const ext = d.extracted_data ? (typeof d.extracted_data === 'string' ? JSON.parse(d.extracted_data) : d.extracted_data) : {};
          return {
            id: d.id,
            title: d.original_filename,
            originalFilename: d.original_filename,
            storedFilename: d.stored_filename,
            docType: d.doc_type,
            type: d.doc_type,
            hospital: d.hospital_name,
            hospitalName: d.hospital_name,
            doctor: d.doctor_name,
            doctorName: d.doctor_name,
            date: d.doc_date,
            docDate: d.doc_date,
            year: d.doc_year,
            docYear: d.doc_year,
            diagnosis: d.diagnosis,
            ocrConfidence: d.ocr_confidence,
            rawOcrText: d.raw_ocr_text,
            extractedData: ext,
            medicines: ext.medicines || [],
            investigations: ext.investigations || [],
            procedures: ext.procedures || [],
            verificationStatus: d.verification_status,
            verifiedByDoctorId: d.verified_by_doctor_id,
            verifiedByDoctorName: d.verified_by_doctor_name,
            verifiedAt: d.verified_at,
            uploadedAt: d.uploaded_at
          };
        }),
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
    const doctorNotes = await get('SELECT * FROM doctor_notes WHERE patient_id = ? ORDER BY signed_at DESC LIMIT 1', [id]);
    const consent = await get('SELECT * FROM consents WHERE patient_id = ? ORDER BY granted_at DESC LIMIT 1', [id]);
    const ayushRecord = await get('SELECT * FROM ayush_histories WHERE patient_id = ?', [id]);

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
        tokenNumber: patient.token_number,
        hospitalId: patient.hospital_id,
        hospitalName: patient.hospital_name,
        departmentId: patient.department_id,
        roomNumber: patient.room_number,
        assignedDoctorId: patient.assigned_doctor_id,
        assignedDoctorName: patient.assigned_doctor_name,
        assignedDoctor: patient.assigned_doctor_name || null,
        abhaId: patient.abha_id,
        abhaAddress: patient.abha_address,
        reasonForVisit: patient.reason_for_visit,
        triageLevel: patient.triage_level,
        triageCategory: patient.triage_category,
        triageColor: patient.triage_color,
        waitTime: patient.wait_time,
        caseStatus: patient.case_status || patient.status,
        verificationStatus: patient.verification_status,
        verificationTimestamp: patient.verification_timestamp,
        rejectionReason: patient.rejection_reason,
        createdAt: patient.created_at,
        vitals: vitals ? {
          bp_systolic: vitals.bp_systolic,
          bp_diastolic: vitals.bp_diastolic,
          bpSystolic: vitals.bp_systolic,
          bpDiastolic: vitals.bp_diastolic,
          pulse: vitals.pulse,
          spo2: vitals.spo2,
          temp: vitals.temp,
          blood_sugar: vitals.blood_sugar,
          bloodSugar: vitals.blood_sugar,
          weight: vitals.weight,
          height: vitals.height
        } : {},
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
        aiGeneratedDraft: aiSummary ? {
          disclaimer: 'AI-generated draft — Doctor verification required. Not a final clinical diagnosis.',
          subjectiveSummary: aiSummary.subjective_summary,
          objectiveSummary: aiSummary.objective_summary,
          preliminaryRiskAssessment: aiSummary.preliminary_risk_assessment,
          differentialDiagnosisDraft: JSON.parse(aiSummary.differential_diagnosis || '[]'),
          suggestedNextSteps: JSON.parse(aiSummary.suggested_next_steps || '[]')
        } : null,
        doctorNotes: doctorNotes ? {
          provisionalDiagnosis: (doctorNotes.provisional_diagnosis && doctorNotes.provisional_diagnosis !== 'Clinical Assessment Recorded' && doctorNotes.provisional_diagnosis !== 'Clinical History Verified') ? doctorNotes.provisional_diagnosis : '',
          icd10: doctorNotes.icd10_codes ? (typeof doctorNotes.icd10_codes === 'string' ? JSON.parse(doctorNotes.icd10_codes) : doctorNotes.icd10_codes) : [],
          prescriptions: doctorNotes.prescriptions ? (typeof doctorNotes.prescriptions === 'string' ? JSON.parse(doctorNotes.prescriptions) : doctorNotes.prescriptions) : [],
          investigations: doctorNotes.investigations ? (typeof doctorNotes.investigations === 'string' ? JSON.parse(doctorNotes.investigations) : doctorNotes.investigations) : [],
          advice: doctorNotes.advice || '',
          followUp: doctorNotes.follow_up || '',
          signedAt: doctorNotes.signed_at || null,
          doctorId: doctorNotes.doctor_id || null
        } : {
          provisionalDiagnosis: '',
          icd10: [],
          prescriptions: [],
          investigations: [],
          advice: '',
          followUp: ''
        },
        documents: documents.map(d => {
          const ext = d.extracted_data ? (typeof d.extracted_data === 'string' ? JSON.parse(d.extracted_data) : d.extracted_data) : {};
          return {
            id: d.id,
            title: d.original_filename,
            originalFilename: d.original_filename,
            storedFilename: d.stored_filename,
            docType: d.doc_type,
            type: d.doc_type,
            hospital: d.hospital_name,
            hospitalName: d.hospital_name,
            doctor: d.doctor_name,
            doctorName: d.doctor_name,
            date: d.doc_date,
            docDate: d.doc_date,
            year: d.doc_year,
            docYear: d.doc_year,
            diagnosis: d.diagnosis,
            ocrConfidence: d.ocr_confidence,
            rawOcrText: d.raw_ocr_text,
            extractedData: ext,
            medicines: ext.medicines || [],
            investigations: ext.investigations || [],
            procedures: ext.procedures || [],
            verificationStatus: d.verification_status,
            verifiedByDoctorId: d.verified_by_doctor_id,
            verifiedByDoctorName: d.verified_by_doctor_name,
            verifiedAt: d.verified_at,
            uploadedAt: d.uploaded_at
          };
        }),
        ayushHistory: (() => {
          if (!patient.ayush_history && !ayushRecord) return null;
          const parsed = patient.ayush_history ? JSON.parse(patient.ayush_history) : {};
          if (ayushRecord) {
            return {
              ...parsed,
              dashavidhaPariksha: ayushRecord.dashavidha_pariksha ? JSON.parse(ayushRecord.dashavidha_pariksha) : (parsed.dashavidhaPariksha || null),
              additionalHistory: ayushRecord.additional_history ? JSON.parse(ayushRecord.additional_history) : (parsed.additionalHistory || null),
              clinicianVerified: Boolean(ayushRecord.clinician_verified),
              verifiedByDoctorId: ayushRecord.verified_by_doctor_id,
              verifiedAt: ayushRecord.verified_at
            };
          }
          return parsed;
        })(),
        consent: consent || null
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/patients/:id
 * Authorized hospital administrators and doctors can delete patient records
 * Enforces strict hospital tenant isolation, department RBAC, and records immutable audit log
 */
router.delete('/:id', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await get('SELECT id, name, hospital_id, department_id, assigned_doctor_id FROM patients WHERE id = ?', [id]);
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

    // If DOCTOR role, verify doctor has authorization for this patient's department or is assigned
    if (req.user.role === 'DOCTOR') {
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
          message: 'You are not authorized to delete cases outside your registered clinical departments.'
        });
      }
    }

    // Clean up any physical uploaded document files on disk before cascading database deletion
    const docs = await query('SELECT file_path FROM documents WHERE patient_id = ?', [id]);
    for (const doc of docs) {
      if (doc.file_path && fs.existsSync(doc.file_path)) {
        try {
          fs.unlinkSync(doc.file_path);
        } catch (e) {
          console.warn('[Cleanup] Failed to unlink file:', doc.file_path, e.message);
        }
      }
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
