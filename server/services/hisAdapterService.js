/**
 * MediMitra Hospital Information System (HIS) & EMR Interoperability Adapter
 * 
 * Provides an integration interface to dispatch FHIR R4 Case Bundles directly to hospital HIS/EMR servers.
 * Persists all dispatch transactions into `his_dispatches` table.
 */

import { v4 as uuidv4 } from 'uuid';
import { get, query, run } from '../db/database.js';
import { generateFhirBundle } from './fhirService.js';
import { validateFhirBundle } from './fhirValidator.js';

class HospitalHisAdapterService {
  async getHospitalHisConfig(hospitalId) {
    const hospital = await get('SELECT * FROM hospitals WHERE id = ?', [hospitalId]);
    if (!hospital) return null;

    const envKey = `HIS_ENDPOINT_${(hospital.code || '').replace(/[^a-zA-Z0-9]/g, '_')}`;
    const endpoint = process.env[envKey] || null;

    return {
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      hfrId: hospital.hfr_id,
      hisConfigured: Boolean(hospital.external_facility_id && endpoint),
      hisEndpoint: endpoint,
      supportedFormats: ['FHIR_R4_JSON', 'HL7_V2_XML', 'ABDM_DOCUMENT_BUNDLE']
    };
  }

  async dispatchPatientRecordToHis(patientFull, userId = null) {
    const hospitalId = patientFull.hospital_id || 'hosp-ggh-hyd';
    const config = await this.getHospitalHisConfig(hospitalId);

    const fhirBundle = generateFhirBundle(patientFull);
    const validation = validateFhirBundle(fhirBundle);

    if (!config || !config.hisConfigured) {
      const dispatchId = `disp-${uuidv4()}`;
      const msg = `Hospital HIS endpoint for '${patientFull.hospital_name || hospitalId}' is not configured in the environment. FHIR R4 record remains stored securely in MediMitra hospital database.`;

      try {
        await run(`
          INSERT INTO his_dispatches (id, patient_id, hospital_id, fhir_bundle_id, status, message, dispatched_by_user_id)
          VALUES (?, ?, ?, ?, 'CONFIGURATION_REQUIRED', ?, ?)
        `, [dispatchId, patientFull.id, hospitalId, fhirBundle.id, msg, userId]);
      } catch (dbErr) {
        console.warn('Could not persist HIS dispatch log:', dbErr.message);
      }

      return {
        success: false,
        status: 'CONFIGURATION_REQUIRED',
        message: msg,
        patientId: patientFull.id,
        hospitalId,
        fhirBundleId: fhirBundle.id,
        validationStatus: validation.isValid ? 'VALID_FHIR_R4' : 'INVALID_FHIR_R4',
        dispatchId
      };
    }

    try {
      const response = await fetch(config.hisEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'X-Hospital-HFR': config.hfrId || hospitalId,
          'Authorization': `Bearer ${process.env[`HIS_API_KEY_${hospitalId}`] || 'internal-his-token'}`
        },
        body: JSON.stringify(fhirBundle)
      });

      const responseData = await response.json().catch(() => ({}));
      const dispatchId = `disp-${uuidv4()}`;
      const status = response.ok ? 'HIS_DISPATCHED_SUCCESS' : 'HIS_DISPATCH_FAILED';
      const txnId = responseData?.id || `HIS-${Date.now()}`;
      const msg = response.ok ? 'Successfully dispatched FHIR R4 Bundle to hospital HIS.' : `HIS server returned HTTP ${response.status}.`;

      try {
        await run(`
          INSERT INTO his_dispatches (id, patient_id, hospital_id, fhir_bundle_id, status, http_status, transaction_id, message, dispatched_by_user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [dispatchId, patientFull.id, hospitalId, fhirBundle.id, status, response.status, txnId, msg, userId]);
      } catch (dbErr) {
        console.warn('Could not persist HIS dispatch log:', dbErr.message);
      }

      return {
        success: response.ok,
        status,
        httpStatus: response.status,
        fhirBundleId: fhirBundle.id,
        hisTransactionId: txnId,
        dispatchId,
        message: msg
      };
    } catch (dispatchErr) {
      const dispatchId = `disp-${uuidv4()}`;
      const errMsg = `Failed to connect to Hospital HIS server: ${dispatchErr.message}`;

      try {
        await run(`
          INSERT INTO his_dispatches (id, patient_id, hospital_id, fhir_bundle_id, status, message, dispatched_by_user_id)
          VALUES (?, ?, ?, ?, 'HIS_NETWORK_ERROR', ?, ?)
        `, [dispatchId, patientFull.id, hospitalId, fhirBundle.id, errMsg, userId]);
      } catch (dbErr) {
        console.warn('Could not persist HIS dispatch log:', dbErr.message);
      }

      return {
        success: false,
        status: 'HIS_NETWORK_ERROR',
        message: errMsg,
        patientId: patientFull.id,
        hospitalId,
        dispatchId
      };
    }
  }

  async getRecentDispatches(patientId) {
    return await query(
      'SELECT * FROM his_dispatches WHERE patient_id = ? ORDER BY dispatched_at DESC',
      [patientId]
    );
  }
}

export const hisAdapterService = new HospitalHisAdapterService();
