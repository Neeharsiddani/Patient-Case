import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, get, query } from '../db/database.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = express.Router();

/**
 * POST /api/consent
 * Record formal patient consent
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

    const consentId = uuidv4();
    await run(`
      INSERT INTO consents (id, patient_id, status, scope, purpose, consent_type, signature_data, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      consentId, patientId, status, scope, purpose, consentType, signatureData || '', req.ip || '127.0.0.1'
    ]);

    await recordAuditLog({
      userId: 'PATIENT_KIOSK',
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
 * Revoke existing consent
 */
router.post('/:id/revoke', async (req, res, next) => {
  try {
    const { id } = req.params;
    const consent = await get('SELECT * FROM consents WHERE id = ?', [id]);
    if (!consent) {
      return res.status(404).json({
        success: false,
        error: 'Consent Not Found'
      });
    }

    await run(`
      UPDATE consents
      SET status = 'REVOKED', revoked_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    await recordAuditLog({
      userId: 'PATIENT_REQUEST',
      userRole: 'PATIENT',
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
 * Get patient consent history
 */
router.get('/patient/:patientId', async (req, res, next) => {
  try {
    const { patientId } = req.params;
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
