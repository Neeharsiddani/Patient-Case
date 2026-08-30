import express from 'express';
import { get, query } from '../db/database.js';
import { generateFhirBundle } from '../services/fhirService.js';

const router = express.Router();

/**
 * GET /api/fhir/patient/:id
 * Exports complete patient record as an ABDM FHIR R4 JSON Document Bundle
 */
router.get('/patient/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await get('SELECT * FROM patients WHERE id = ?', [id]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found'
      });
    }

    const vitals = await get('SELECT * FROM vitals WHERE patient_id = ?', [id]);
    const history = await get('SELECT * FROM clinical_histories WHERE patient_id = ?', [id]);
    const consent = await get('SELECT * FROM consents WHERE patient_id = ? ORDER BY granted_at DESC LIMIT 1', [id]);

    const patientFull = {
      ...patient,
      vitals: vitals || {},
      chief_complaints: history ? JSON.parse(history.chief_complaints || '[]') : [],
      consent_status: consent ? consent.status : 'GRANTED',
      consent_granted_at: consent ? consent.granted_at : patient.created_at
    };

    const fhirBundle = generateFhirBundle(patientFull);

    res.setHeader('Content-Type', 'application/fhir+json');
    res.json(fhirBundle);
  } catch (err) {
    next(err);
  }
});

export default router;
