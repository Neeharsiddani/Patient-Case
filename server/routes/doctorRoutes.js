import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, get, query } from '../db/database.js';
import { recordAuditLog } from '../middleware/audit.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/doctor/confirm-summary
 * Doctor confirms and signs the patient's clinical summary
 */
router.post('/confirm-summary', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { patientId, doctorNotes, editedFields } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'Missing Patient ID',
        message: 'Patient ID is required to verify clinical summary.'
      });
    }

    const patient = await get('SELECT id, name, status, hospital_id FROM patients WHERE id = ?', [patientId]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found',
        message: `No patient found with ID ${patientId}.`
      });
    }

    // Strict Cross-Hospital Authorization Check
    if (req.user.hospital_id && patient.hospital_id !== req.user.hospital_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to verify clinical records belonging to another healthcare facility.'
      });
    }

    const verificationTimestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const doctorId = req.user.id;
    const doctorName = req.user.full_name;

    // 1. Update patient status to 'History Verified'
    await run(`
      UPDATE patients
      SET status = 'History Verified',
          verification_status = 'History Verified',
          verification_timestamp = ?,
          assigned_doctor_name = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [verificationTimestamp, doctorName, patientId]);

    // 2. Mark AI summary as verified
    await run(`
      UPDATE clinical_summaries
      SET clinician_verified = 1,
          verified_by_doctor_id = ?,
          verified_at = CURRENT_TIMESTAMP
      WHERE patient_id = ?
    `, [doctorId, patientId]);

    // 3. Update any edited fields into clinical history if provided
    if (editedFields) {
      const updates = [];
      const params = [];

      if (editedFields.chiefComplaints) {
        updates.push('chief_complaints = ?');
        params.push(JSON.stringify(editedFields.chiefComplaints));
      }
      if (editedFields.hpi) {
        updates.push('hpi = ?');
        params.push(JSON.stringify(editedFields.hpi));
      }
      if (editedFields.pastMedicalHistory) {
        updates.push('past_medical_history = ?');
        params.push(JSON.stringify(editedFields.pastMedicalHistory));
      }
      if (editedFields.pastSurgicalHistory) {
        updates.push('past_surgical_history = ?');
        params.push(JSON.stringify(editedFields.pastSurgicalHistory));
      }
      if (editedFields.currentMedications) {
        updates.push('current_medications = ?');
        params.push(JSON.stringify(editedFields.currentMedications));
      }
      if (editedFields.drugAllergies) {
        updates.push('drug_allergies = ?');
        params.push(JSON.stringify(editedFields.drugAllergies));
      }

      // 3b. Update AYUSH / Dashavidha Pariksha if present in edited fields
      if (editedFields.ayushHistory || req.body.ayushHistory) {
        const ayushPayload = editedFields.ayushHistory || req.body.ayushHistory;
        await run(`UPDATE patients SET ayush_history = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [
          JSON.stringify(ayushPayload),
          patientId
        ]);

        await run(`
          UPDATE ayush_histories
          SET dashavidha_pariksha = ?,
              additional_history = ?,
              clinician_verified = 1,
              verified_by_doctor_id = ?,
              verified_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE patient_id = ?
        `, [
          JSON.stringify(ayushPayload.dashavidhaPariksha || {}),
          JSON.stringify(ayushPayload.additionalHistory || {}),
          doctorId,
          patientId
        ]);
      }
    }

    // 4. Save doctor notes if provided
    if (doctorNotes) {
      await run(`
        INSERT INTO doctor_notes (id, patient_id, doctor_id, provisional_diagnosis, advice, signed_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          advice = excluded.advice,
          signed_at = CURRENT_TIMESTAMP
      `, [uuidv4(), patientId, doctorId, 'Clinical History Verified', doctorNotes]);
    }

    // 5. Immutable Audit Log
    await recordAuditLog({
      userId: doctorId,
      userRole: req.user.role,
      hospitalId: req.user.hospital_id,
      action: 'DOCTOR_VERIFIED_SUMMARY',
      resourceType: 'PATIENT',
      resourceId: patientId,
      details: { doctorName, editedFields: Object.keys(editedFields || {}) },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'Clinical summary verified and signed successfully',
      verificationStatus: 'History Verified',
      verificationTimestamp,
      verifiedBy: doctorName
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/doctor/reject-summary
 * Doctor rejects summary with a mandatory clinical reason
 */
router.post('/reject-summary', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { patientId, reason } = req.body;

    if (!patientId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing Information',
        message: 'Patient ID and rejection reason are required.'
      });
    }

    const patient = await get('SELECT id, name, hospital_id FROM patients WHERE id = ?', [patientId]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found',
        message: `No patient found with ID ${patientId}.`
      });
    }

    // Strict Cross-Hospital Authorization Check
    if (req.user.hospital_id && patient.hospital_id !== req.user.hospital_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to reject clinical records belonging to another healthcare facility.'
      });
    }

    await run(`
      UPDATE patients
      SET status = 'Rejected',
          verification_status = 'Rejected (Re-Intake Required)',
          rejection_reason = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [reason, patientId]);

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      hospitalId: req.user.hospital_id,
      action: 'DOCTOR_REJECTED_SUMMARY',
      resourceType: 'PATIENT',
      resourceId: patientId,
      details: { reason },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'Patient case marked for re-intake',
      status: 'Rejected',
      reason
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/doctor/eprescribe
 * Save official doctor diagnosis, ICD-10 codes, prescriptions, and lab orders
 */
router.post('/eprescribe', requireAuth, requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const {
      patientId,
      provisionalDiagnosis,
      icd10Codes = [],
      prescriptions = [],
      investigations = [],
      advice = '',
      followUp = ''
    } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'Missing Patient ID'
      });
    }

    const patient = await get('SELECT id, name, hospital_id FROM patients WHERE id = ?', [patientId]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found',
        message: `No patient found with ID ${patientId}.`
      });
    }

    // Strict Cross-Hospital Authorization Check
    if (req.user.hospital_id && patient.hospital_id !== req.user.hospital_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to prescribe for patients from another healthcare facility.'
      });
    }

    const noteId = uuidv4();
    const doctorId = req.user.id;

    // Insert or replace doctor notes
    await run(`
      INSERT INTO doctor_notes (
        id, patient_id, doctor_id, provisional_diagnosis, icd10_codes,
        prescriptions, investigations, advice, follow_up, signed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      noteId, patientId, doctorId, provisionalDiagnosis,
      JSON.stringify(icd10Codes), JSON.stringify(prescriptions),
      JSON.stringify(investigations), advice, followUp
    ]);

    await run(`UPDATE patients SET status = 'Completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [patientId]);

    await recordAuditLog({
      userId: doctorId,
      userRole: 'DOCTOR',
      hospitalId: req.user.hospital_id,
      action: 'DOCTOR_EPRESCRIBE_COMPLETED',
      resourceType: 'PATIENT',
      resourceId: patientId,
      details: { provisionalDiagnosis, prescriptionsCount: prescriptions.length },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'e-Prescription and outpatient slip generated successfully'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
