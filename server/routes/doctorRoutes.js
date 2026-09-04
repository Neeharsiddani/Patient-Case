import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, get, query } from '../db/database.js';
import { recordAuditLog } from '../middleware/audit.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper to check doctor department authorization or explicit patient assignment
 */
async function verifyDoctorDepartmentAuthorization(userId, userRole, patient) {
  if (userRole !== 'DOCTOR') return true;
  const authorizedDepts = await query(
    'SELECT department_id FROM doctor_departments WHERE doctor_id = ?',
    [userId]
  );
  const authorizedDeptIds = authorizedDepts.map(d => d.department_id);
  const isAssigned = patient.assigned_doctor_id === userId;
  const isDeptAuthorized = authorizedDeptIds.includes(patient.department_id);
  if (!isAssigned && !isDeptAuthorized && authorizedDeptIds.length > 0) {
    return false;
  }
  return true;
}

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

    const patient = await get('SELECT id, name, status, hospital_id, department_id, assigned_doctor_id FROM patients WHERE id = ?', [patientId]);
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

    // Strict Doctor Department Authorization Check
    const isAuthorized = await verifyDoctorDepartmentAuthorization(req.user.id, req.user.role, patient);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to verify cases outside your registered clinical departments.'
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

      if (updates.length > 0) {
        params.push(patientId);
        await run(`UPDATE clinical_histories SET ${updates.join(', ')} WHERE patient_id = ?`, params);
      }

      // 3b. Update Vitals if provided
      if (editedFields.vitals) {
        const v = editedFields.vitals;
        await run(`
          UPDATE vitals
          SET bp_systolic = COALESCE(?, bp_systolic),
              bp_diastolic = COALESCE(?, bp_diastolic),
              pulse = COALESCE(?, pulse),
              spo2 = COALESCE(?, spo2),
              temp = COALESCE(?, temp),
              blood_sugar = COALESCE(?, blood_sugar),
              weight = COALESCE(?, weight),
              bmi = COALESCE(?, bmi)
          WHERE patient_id = ?
        `, [
          v.bpSystolic ?? v.bp_systolic ?? null,
          v.bpDiastolic ?? v.bp_diastolic ?? null,
          v.pulse ?? null,
          v.spo2 ?? null,
          v.temp ?? null,
          v.bloodSugar ?? v.blood_sugar ?? null,
          v.weight ?? null,
          v.bmi ?? null,
          patientId
        ]);
      }

      // 3c. Synchronize and Upsert AYUSH / Dashavidha Pariksha
      if (editedFields.ayushHistory || req.body.ayushHistory) {
        const ayushPayload = editedFields.ayushHistory || req.body.ayushHistory;
        const updatedMetadata = {
          ...(ayushPayload.metadata || {}),
          isAyushCase: true,
          verificationStatus: 'Clinician Verified',
          verifiedByDoctorId: doctorId,
          verifiedByDoctorName: doctorName,
          verifiedAt: verificationTimestamp
        };
        const synchronizedAyush = {
          ...ayushPayload,
          isSkipped: false,
          skipAyushAssessment: false,
          clinicianVerified: true,
          metadata: updatedMetadata
        };

        await run(`UPDATE patients SET ayush_history = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [
          JSON.stringify(synchronizedAyush),
          patientId
        ]);

        const existingAyush = await get('SELECT id FROM ayush_histories WHERE patient_id = ?', [patientId]);
        if (existingAyush) {
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
            JSON.stringify(synchronizedAyush.dashavidhaPariksha || {}),
            JSON.stringify(synchronizedAyush.additionalHistory || {}),
            doctorId,
            patientId
          ]);
        } else {
          // Explicit safe insert if intake record didn't exist
          await run(`
            INSERT INTO ayush_histories (
              id, patient_id, hospital_id, department_id, dashavidha_pariksha, additional_history,
              clinician_verified, verified_by_doctor_id, verified_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            uuidv4(),
            patientId,
            patient.hospital_id,
            patient.department_id || 'dept-ayurveda',
            JSON.stringify(synchronizedAyush.dashavidhaPariksha || {}),
            JSON.stringify(synchronizedAyush.additionalHistory || {}),
            doctorId
          ]);
        }
      }
    }

    // 4. Save doctor notes if provided (idempotent replacement for this patient)
    if (doctorNotes) {
      await run('DELETE FROM doctor_notes WHERE patient_id = ?', [patientId]);
      await run(`
        INSERT INTO doctor_notes (id, patient_id, doctor_id, provisional_diagnosis, advice, signed_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
 * POST /api/doctor/update-record
 * Doctor saves draft edits to clinical sections without marking case as 'History Verified'
 */
router.post('/update-record', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { patientId, editedFields } = req.body;

    if (!patientId || !editedFields) {
      return res.status(400).json({
        success: false,
        error: 'Missing Information',
        message: 'Patient ID and edited fields are required.'
      });
    }

    const patient = await get('SELECT id, name, status, hospital_id, department_id, assigned_doctor_id FROM patients WHERE id = ?', [patientId]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found',
        message: `No patient found with ID ${patientId}.`
      });
    }

    if (req.user.hospital_id && patient.hospital_id !== req.user.hospital_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to update clinical records belonging to another healthcare facility.'
      });
    }

    // Strict Doctor Department Authorization Check
    const isAuthorized = await verifyDoctorDepartmentAuthorization(req.user.id, req.user.role, patient);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to update cases outside your registered clinical departments.'
      });
    }

    const doctorId = req.user.id;

    // 1. Update clinical histories
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

    if (updates.length > 0) {
      params.push(patientId);
      await run(`UPDATE clinical_histories SET ${updates.join(', ')} WHERE patient_id = ?`, params);
    }

    // 2. Update AYUSH / Dashavidha Pariksha draft if present
    if (editedFields.ayushHistory) {
      const ayushPayload = editedFields.ayushHistory;
      await run(`UPDATE patients SET ayush_history = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [
        JSON.stringify(ayushPayload),
        patientId
      ]);

      const existingAyush = await get('SELECT id FROM ayush_histories WHERE patient_id = ?', [patientId]);
      if (existingAyush) {
        await run(`
          UPDATE ayush_histories
          SET dashavidha_pariksha = ?,
              additional_history = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE patient_id = ?
        `, [
          JSON.stringify(ayushPayload.dashavidhaPariksha || {}),
          JSON.stringify(ayushPayload.additionalHistory || {}),
          patientId
        ]);
      } else {
        await run(`
          INSERT INTO ayush_histories (
            id, patient_id, hospital_id, department_id, dashavidha_pariksha, additional_history,
            clinician_verified, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          uuidv4(),
          patientId,
          patient.hospital_id,
          patient.department_id || 'dept-ayurveda',
          JSON.stringify(ayushPayload.dashavidhaPariksha || {}),
          JSON.stringify(ayushPayload.additionalHistory || {})
        ]);
      }
    }

    // 3. Update Vitals if provided
    if (editedFields.vitals) {
      const v = editedFields.vitals;
      await run(`
        UPDATE vitals
        SET bp_systolic = COALESCE(?, bp_systolic),
            bp_diastolic = COALESCE(?, bp_diastolic),
            pulse = COALESCE(?, pulse),
            spo2 = COALESCE(?, spo2),
            temp = COALESCE(?, temp),
            blood_sugar = COALESCE(?, blood_sugar),
            weight = COALESCE(?, weight),
            bmi = COALESCE(?, bmi)
        WHERE patient_id = ?
      `, [
        v.bpSystolic ?? v.bp_systolic ?? null,
        v.bpDiastolic ?? v.bp_diastolic ?? null,
        v.pulse ?? null,
        v.spo2 ?? null,
        v.temp ?? null,
        v.bloodSugar ?? v.blood_sugar ?? null,
        v.weight ?? null,
        v.bmi ?? null,
        patientId
      ]);
    }

    await run('UPDATE patients SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [patientId]);

    // Record audit log
    await recordAuditLog({
      userId: doctorId,
      userRole: req.user.role,
      hospitalId: req.user.hospital_id,
      action: 'DOCTOR_UPDATED_CLINICAL_RECORD',
      resourceType: 'PATIENT',
      resourceId: patientId,
      details: { editedFields: Object.keys(editedFields) },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'Clinical record draft updated successfully.'
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

    const patient = await get('SELECT id, name, hospital_id, department_id, assigned_doctor_id FROM patients WHERE id = ?', [patientId]);
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

    // Strict Doctor Department Authorization Check
    const isAuthorized = await verifyDoctorDepartmentAuthorization(req.user.id, req.user.role, patient);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to reject cases outside your registered clinical departments.'
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

    const patient = await get('SELECT id, name, hospital_id, department_id, assigned_doctor_id FROM patients WHERE id = ?', [patientId]);
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

    // Strict Doctor Department Authorization Check
    const isAuthorized = await verifyDoctorDepartmentAuthorization(req.user.id, req.user.role, patient);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to prescribe for cases outside your registered clinical departments.'
      });
    }

    const noteId = uuidv4();
    const doctorId = req.user.id;

    // Insert or replace doctor notes (idempotent replacement for this patient)
    await run('DELETE FROM doctor_notes WHERE patient_id = ?', [patientId]);
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

    const verificationTimestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Authoritative state update: Completing consultation affirms history verification and sets consultation completed
    await run(`
      UPDATE patients
      SET status = 'Completed',
          case_status = 'Consultation Completed',
          verification_status = 'History Verified',
          verification_timestamp = COALESCE(verification_timestamp, ?),
          assigned_doctor_name = COALESCE(assigned_doctor_name, ?),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [verificationTimestamp, req.user.full_name || 'Attending Physician', patientId]);

    // Synchronize clinical_summaries verification status
    await run(`
      UPDATE clinical_summaries
      SET clinician_verified = 1,
          verified_by_doctor_id = ?,
          verified_at = COALESCE(verified_at, CURRENT_TIMESTAMP)
      WHERE patient_id = ?
    `, [doctorId, patientId]);

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
