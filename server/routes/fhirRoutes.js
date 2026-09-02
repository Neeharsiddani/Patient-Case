import express from 'express';
import { get, query } from '../db/database.js';
import { generateFhirBundle } from '../services/fhirService.js';
import { validateFhirBundle } from '../services/fhirValidator.js';
import { recordAuditLog } from '../middleware/audit.js';

import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper to fetch complete patient record for FHIR serialization
 */
async function getFullPatientRecord(patientId) {
  const patient = await get('SELECT * FROM patients WHERE id = ?', [patientId]);
  if (!patient) return null;

  const vitals = await get('SELECT * FROM vitals WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 1', [patientId]);
  const history = await get('SELECT * FROM clinical_histories WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1', [patientId]);
  const consent = await get('SELECT * FROM consents WHERE patient_id = ? ORDER BY granted_at DESC LIMIT 1', [patientId]);
  const documents = await query('SELECT * FROM documents WHERE patient_id = ? ORDER BY uploaded_at DESC', [patientId]);
  const doctorNotes = await get('SELECT * FROM doctor_notes WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1', [patientId]);
  const hospital = await get('SELECT * FROM hospitals WHERE id = ?', [patient.hospital_id]);

  let chiefComplaints = [];
  let drugAllergies = [];
  try {
    chiefComplaints = history ? JSON.parse(history.chief_complaints || '[]') : [];
  } catch {}
  try {
    drugAllergies = history ? JSON.parse(history.drug_allergies || '[]') : [];
  } catch {}

  let doctorNotesParsed = {};
  if (doctorNotes) {
    try {
      doctorNotesParsed = {
        provisional_diagnosis: doctorNotes.provisional_diagnosis,
        icd10_codes: JSON.parse(doctorNotes.icd10_codes || '[]'),
        prescriptions: JSON.parse(doctorNotes.prescriptions || '[]'),
        investigations: JSON.parse(doctorNotes.investigations || '[]'),
        advice: doctorNotes.advice
      };
    } catch {
      doctorNotesParsed = { provisional_diagnosis: doctorNotes.provisional_diagnosis };
    }
  }

  return {
    ...patient,
    vitals: vitals || {},
    chief_complaints: chiefComplaints,
    drug_allergies: drugAllergies,
    documents: documents || [],
    doctor_notes: doctorNotesParsed,
    consent_status: consent ? consent.status : 'GRANTED',
    consent_granted_at: consent ? consent.granted_at : patient.created_at,
    hfr_id: hospital ? hospital.hfr_id : null,
    hospital_phone: hospital ? hospital.phone : null,
    hospital_location: hospital ? hospital.location : null
  };
}

/**
 * GET /api/fhir/patient/:id
 * Exports complete patient record as an ABDM FHIR R4 JSON Document Bundle
 */
router.get('/patient/:id', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const patientFull = await getFullPatientRecord(id);
    if (!patientFull) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found'
      });
    }

    if (req.user.hospital_id && patientFull.hospital_id !== req.user.hospital_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to export FHIR records belonging to another healthcare facility.'
      });
    }

    const fhirBundle = generateFhirBundle(patientFull);
    const validation = validateFhirBundle(fhirBundle);

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      hospitalId: patientFull.hospital_id,
      action: 'FHIR_BUNDLE_EXPORTED',
      resourceType: 'FHIR_BUNDLE',
      resourceId: fhirBundle.id,
      details: { patientId: id, totalEntries: fhirBundle.entry?.length, isValid: validation.isValid },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.setHeader('Content-Type', 'application/fhir+json');
    res.setHeader('X-FHIR-Validation-Valid', String(validation.isValid));
    res.setHeader('X-FHIR-Entry-Count', String(validation.summary.totalEntries));
    res.json(fhirBundle);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/fhir/patient/:id/validate
 * Returns detailed validation report for a patient's FHIR R4 bundle
 */
router.get('/patient/:id/validate', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const patientFull = await getFullPatientRecord(id);
    if (!patientFull) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found'
      });
    }

    if (req.user.hospital_id && patientFull.hospital_id !== req.user.hospital_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to validate FHIR records belonging to another healthcare facility.'
      });
    }

    const fhirBundle = generateFhirBundle(patientFull);
    const validation = validateFhirBundle(fhirBundle);

    res.json({
      success: true,
      bundleId: fhirBundle.id,
      patientId: id,
      validation,
      bundleSummary: {
        type: fhirBundle.type,
        timestamp: fhirBundle.timestamp,
        entryCount: fhirBundle.entry?.length,
        resourceTypes: Object.keys(validation.summary.resourceCounts)
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/fhir/validate
 * Validates any arbitrary FHIR bundle JSON payload
 */
router.post('/validate', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), (req, res) => {
  const bundle = req.body;
  if (!bundle || typeof bundle !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Invalid Payload',
      message: 'A valid FHIR R4 Bundle JSON object is required.'
    });
  }
  const validation = validateFhirBundle(bundle);
  res.json({
    success: true,
    validation
  });
});

export default router;
