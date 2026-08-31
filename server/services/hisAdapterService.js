/**
 * MediMitra Hospital Information System (HIS) & EMR Interoperability Adapter
 * 
 * Provides an integration interface to dispatch FHIR R4 Case Bundles directly to hospital HIS/EMR servers.
 */

import { get, query, run } from '../db/database.js';
import { generateFhirBundle } from './fhirService.js';
import { validateFhirBundle } from './fhirValidator.js';

class HospitalHisAdapterService {
  async getHospitalHisConfig(hospitalId) {
    const hospital = await get('SELECT * FROM hospitals WHERE id = ?', [hospitalId]);
    if (!hospital) return null;

    return {
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      hfrId: hospital.hfr_id,
      hisConfigured: Boolean(hospital.external_facility_id && process.env[`HIS_ENDPOINT_${hospital.code.replace(/[^a-zA-Z0-9]/g, '_')}`]),
      hisEndpoint: process.env[`HIS_ENDPOINT_${hospital.code.replace(/[^a-zA-Z0-9]/g, '_')}`] || null,
      supportedFormats: ['FHIR_R4_JSON', 'HL7_V2_XML', 'ABDM_DOCUMENT_BUNDLE']
    };
  }

  async dispatchPatientRecordToHis(patientFull) {
    const hospitalId = patientFull.hospital_id || 'hosp-ggh-hyd';
    const config = await this.getHospitalHisConfig(hospitalId);

    const fhirBundle = generateFhirBundle(patientFull);
    const validation = validateFhirBundle(fhirBundle);

    if (!config || !config.hisConfigured) {
      return {
        success: false,
        status: 'CONFIGURATION_REQUIRED',
        message: `Hospital HIS endpoint for '${patientFull.hospital_name || hospitalId}' is not configured in the environment. FHIR R4 record remains stored securely in MediMitra hospital database.`,
        patientId: patientFull.id,
        hospitalId,
        fhirBundleId: fhirBundle.id,
        validationStatus: validation.isValid ? 'VALID_FHIR_R4' : 'INVALID_FHIR_R4'
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

      const responseData = await response.json();
      return {
        success: response.ok,
        status: response.ok ? 'HIS_DISPATCHED_SUCCESS' : 'HIS_DISPATCH_FAILED',
        httpStatus: response.status,
        fhirBundleId: fhirBundle.id,
        hisTransactionId: responseData?.id || `HIS-${Date.now()}`
      };
    } catch (dispatchErr) {
      return {
        success: false,
        status: 'HIS_NETWORK_ERROR',
        message: `Failed to connect to Hospital HIS server: ${dispatchErr.message}`,
        patientId: patientFull.id,
        hospitalId
      };
    }
  }
}

export const hisAdapterService = new HospitalHisAdapterService();
