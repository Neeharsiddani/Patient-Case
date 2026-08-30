import { get } from '../db/database.js';

/**
 * Middleware: Verify Patient Consent
 * Ensures that any clinical data processing or doctor retrieval is backed by active consent.
 */
export const requirePatientConsent = async (req, res, next) => {
  try {
    const patientId = req.params.patientId || req.body.patientId || req.body.patient_id;
    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'Missing Patient Identifier',
        message: 'Patient ID is required to verify legal consent.'
      });
    }

    const consent = await get(
      'SELECT id, status, scope, granted_at, revoked_at FROM consents WHERE patient_id = ? AND status = "GRANTED" ORDER BY granted_at DESC LIMIT 1',
      [patientId]
    );

    if (!consent) {
      return res.status(403).json({
        success: false,
        error: 'Consent Not Granted',
        message: 'Clinical data processing cannot proceed without explicit patient consent under the DPDP Act 2023.'
      });
    }

    req.consent = consent;
    next();
  } catch (err) {
    console.error('Consent check error:', err);
    return res.status(500).json({
      success: false,
      error: 'Consent Verification Failure',
      message: 'Unable to verify patient consent status.'
    });
  }
};
