import express from 'express';
import { get, query } from '../db/database.js';
import { hisAdapterService } from '../services/hisAdapterService.js';
import { recordAuditLog } from '../middleware/audit.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/his/status/:hospitalId
 * Check HIS configuration for a specific hospital
 */
router.get('/status/:hospitalId', requireAuth, requireRole('HOSPITAL_ADMIN', 'DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const { hospitalId } = req.params;

    if (req.user.hospital_id && req.user.hospital_id !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to view HIS configuration for another healthcare facility.'
      });
    }

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
router.post('/dispatch/:patientId', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const patient = await get('SELECT * FROM patients WHERE id = ?', [patientId]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found'
      });
    }

    if (req.user.hospital_id && patient.hospital_id !== req.user.hospital_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to dispatch patient records belonging to another healthcare facility.'
      });
    }

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
          message: 'You are not authorized to dispatch records outside your registered clinical departments.'
        });
      }
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
      userId: req.user.id,
      userRole: req.user.role,
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
