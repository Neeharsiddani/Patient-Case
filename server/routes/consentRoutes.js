import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, get, query } from '../db/database.js';
import { recordAuditLog } from '../middleware/audit.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/consent
 * Record formal patient consent (kiosk / patient intake submission)
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      patientId,
      status = 'GRANTED',
      scope = 'PATIENT_INTAKE_OPD',
      purpose = 'Clinical consultation, OPD triage and verified medical record storage under DPDP Act 2023',
      consentType = 'ELECTRONIC_TOUCH_SIGNATURE',
      signatureData
    } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'Missing Patient ID',
        message: 'Patient ID is required to record consent.'
      });
    }

    const patient = await get('SELECT id, hospital_id FROM patients WHERE id = ?', [patientId]);
    const hospitalId = patient?.hospital_id || req.body.hospitalId || 'hosp-ggh-hyd';

    const consentId = uuidv4();
    await run(`
      INSERT INTO consents (id, patient_id, hospital_id, status, scope, purpose, consent_type, signature_data, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      consentId, patientId, hospitalId, status, scope, purpose, consentType, signatureData || '', req.ip || '127.0.0.1'
    ]);

    await recordAuditLog({
      userId: req.user ? req.user.id : 'PATIENT_KIOSK',
      userRole: 'PATIENT',
      action: status === 'GRANTED' ? 'CONSENT_GRANTED' : 'CONSENT_DECLINED',
      resourceType: 'CONSENT',
      resourceId: consentId,
      details: { patientId, scope, purpose },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(201).json({
      success: true,
      message: 'Consent recorded successfully',
      consentId,
      status
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/consent/:id/revoke
 * Revoke existing consent with hospital authorization
 */
router.post('/:id/revoke', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const consent = await get('SELECT * FROM consents WHERE id = ?', [id]);
    if (!consent) {
      return res.status(404).json({
        success: false,
        error: 'Consent Not Found'
      });
    }

    // Verify hospital relationship through patient record
    const patient = await get('SELECT id, hospital_id FROM patients WHERE id = ?', [consent.patient_id]);
    if (patient && req.user.hospital_id && patient.hospital_id !== req.user.hospital_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to revoke consents belonging to another healthcare facility.'
      });
    }

    await run(`
      UPDATE consents
      SET status = 'REVOKED', revoked_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      hospitalId: req.user.hospital_id,
      action: 'CONSENT_REVOKED',
      resourceType: 'CONSENT',
      resourceId: id,
      details: { patientId: consent.patient_id },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'Consent revoked successfully. Patient records will not be shared for new consultations.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/consent/patient/:patientId
 * Get patient consent history (hospital scoped)
 */
router.get('/patient/:patientId', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const patient = await get('SELECT id, hospital_id FROM patients WHERE id = ?', [patientId]);
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
        message: 'You are not authorized to view consent records belonging to another healthcare facility.'
      });
    }

    const consents = await query('SELECT * FROM consents WHERE patient_id = ? ORDER BY granted_at DESC', [patientId]);
    res.json({
      success: true,
      consents
    });
  } catch (err) {
    next(err);
  }
});

export default router;
