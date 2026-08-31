import express from 'express';
import { get, query } from '../db/database.js';
import { hisAdapterService } from '../services/hisAdapterService.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = express.Router();

/**
 * GET /api/his/status/:hospitalId
 * Check HIS configuration for a specific hospital
 */
router.get('/status/:hospitalId', async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const config = await hisAdapterService.getHospitalHisConfig(hospitalId);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Hospital Not Found'
      });
    }
    res.json({
      success: true,
      config
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/his/dispatch/:patientId
 * Dispatch a patient's FHIR R4 Bundle to the hospital's HIS/EMR
 */
router.post('/dispatch/:patientId', async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const patient = await get('SELECT * FROM patients WHERE id = ?', [patientId]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found'
      });
    }

    const vitals = await get('SELECT * FROM vitals WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 1', [patientId]);
    const history = await get('SELECT * FROM clinical_histories WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1', [patientId]);
    const consent = await get('SELECT * FROM consents WHERE patient_id = ? ORDER BY granted_at DESC LIMIT 1', [patientId]);
    const documents = await query('SELECT * FROM documents WHERE patient_id = ? ORDER BY uploaded_at DESC', [patientId]);
    const doctorNotes = await get('SELECT * FROM doctor_notes WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1', [patientId]);

    const patientFull = {
      ...patient,
      vitals: vitals || {},
      chief_complaints: history ? JSON.parse(history.chief_complaints || '[]') : [],
      drug_allergies: history ? JSON.parse(history.drug_allergies || '[]') : [],
      documents: documents || [],
      doctor_notes: doctorNotes ? { provisional_diagnosis: doctorNotes.provisional_diagnosis } : {},
      consent_status: consent ? consent.status : 'GRANTED'
    };

    const result = await hisAdapterService.dispatchPatientRecordToHis(patientFull);

    await recordAuditLog({
      userId: req.user?.id || 'DOCTOR_DISPATCH',
      userRole: req.user?.role || 'DOCTOR',
      hospitalId: patient.hospital_id,
      action: 'HIS_DISPATCH_ATTEMPT',
      resourceType: 'HOSPITAL_HIS',
      resourceId: patientId,
      details: { status: result.status, success: result.success },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
