import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, get, query } from '../db/database.js';
import { evaluateClinicalTriage } from '../services/redFlagEngine.js';
import { generateAssistiveSummary } from '../services/aiSummaryService.js';
import { recordAuditLog } from '../middleware/audit.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/patients/intake
 * Kiosk intake submission endpoint: saves complete patient case persistently
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
      uploadedDocuments = []
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

    const patientId = `patient-${uuidv4().substring(0, 8)}`;
    const tokenNumber = `MED-${Math.floor(100 + Math.random() * 900)}`;
    const department = chiefComplaints.some(c => String(c).toLowerCase().includes('chest')) 
      ? 'Cardiology & General Medicine' 
      : 'General Medicine';
    const roomNumber = department.includes('Cardiology') ? 'Room 104' : 'Room 102';
    const assignedDoctorName = department.includes('Cardiology') 
      ? 'Dr. Rajesh Sharma, MD' 
      : 'Dr. Priya Nair, MBBS, DNB';

    // 2. Server-Side Deterministic Clinical Triage & Red-Flag Assessment
    const triageResult = evaluateClinicalTriage({
      chiefComplaints,
      hpi,
      vitals,
      painScore: parseInt(painScore, 10) || 0,
      drugAllergies,
      age: parseInt(age, 10) || 30
    });

    // 3. Assistive AI Clinical Summary Draft Generation
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
      personalHistory
    });

    // 4. Database Persistence: Insert Patient
    await run(`
      INSERT INTO patients (
        id, token_number, room_number, department, assigned_doctor_name, name, age, gender, phone, address,
        abha_id, abha_address, language, triage_level, triage_category, triage_color, wait_time, status, verification_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Waiting', 'Pending Verification')
    `, [
      patientId, tokenNumber, roomNumber, department, assignedDoctorName, name, parseInt(age, 10) || 30, gender,
      phone || '', address || '', abhaId || '', abhaAddress || '', language,
      triageResult.triageLevel, triageResult.triageCategory, triageResult.triageColor, triageResult.waitTime
    ]);

    // 5. Insert Consent Record
    await run(`
      INSERT INTO consents (id, patient_id, status, scope, purpose, consent_type, signature_data, ip_address)
      VALUES (?, ?, 'GRANTED', 'PATIENT_INTAKE_OPD', 'Clinical assessment, OPD triage and verified medical record storage under DPDP Act 2023', 'ELECTRONIC_TOUCH_SIGNATURE', ?, ?)
    `, [uuidv4(), patientId, signatureData || '', req.ip || '127.0.0.1']);

    // 6. Insert Clinical History
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

    // 7. Insert Vitals
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

    // 8. Insert Red Flags
    for (const flag of triageResult.redFlags) {
      await run(`
        INSERT INTO red_flags (id, patient_id, flag_text, severity, trigger_source)
        VALUES (?, ?, ?, 'HIGH', 'SERVER_DETERMINISTIC_RULES')
      `, [uuidv4(), patientId, flag]);
    }

    // 9. Insert AI Summary Draft
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

    // 10. Record Audit Log
    await recordAuditLog({
      userId: req.user ? req.user.id : 'KIOSK_INTAKE_STATION',
      userRole: 'PATIENT_KIOSK',
      action: 'PATIENT_INTAKE_SUBMITTED',
      resourceType: 'PATIENT',
      resourceId: patientId,
      details: { tokenNumber, name, triageCategory: triageResult.triageCategory },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(201).json({
      success: true,
      message: 'Patient intake registered successfully',
      data: {
        id: patientId,
        tokenNumber,
        roomNumber,
        department,
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
 * Retrieve all patients in the OPD queue with associated history and triage indicators
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, triage, search } = req.query;

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

    if (status && status !== 'all') {
      sql += ' AND p.status = ?';
      params.push(status);
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
        roomNumber: row.room_number,
        department: row.department,
        assignedDoctorName: row.assigned_doctor_name,
        name: row.name,
        age: row.age,
        gender: row.gender,
        phone: row.phone,
        address: row.address,
        abhaId: row.abha_id,
        abhaAddress: row.abha_address,
        language: row.language,
        triageLevel: row.triage_level,
        triageCategory: row.triage_category,
        triageColor: row.triage_color,
        waitTime: row.wait_time,
        status: row.status,
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
        }))
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
 * Retrieve detailed patient record by ID
 */
router.get('/:id', async (req, res, next) => {
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

    const vitals = await get('SELECT * FROM vitals WHERE patient_id = ?', [id]);
    const clinicalHistory = await get('SELECT * FROM clinical_histories WHERE patient_id = ?', [id]);
    const redFlags = await query('SELECT * FROM red_flags WHERE patient_id = ?', [id]);
    const aiSummary = await get('SELECT * FROM clinical_summaries WHERE patient_id = ?', [id]);
    const documents = await query('SELECT * FROM documents WHERE patient_id = ?', [id]);
    const consent = await get('SELECT * FROM consents WHERE patient_id = ? ORDER BY granted_at DESC LIMIT 1', [id]);

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
        consent: consent || null
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
