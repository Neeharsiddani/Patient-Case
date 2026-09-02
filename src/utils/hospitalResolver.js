/**
 * Hospital Identity Resolution Utility
 * 
 * Safely resolves the authentic healthcare facility / hospital name for a patient or consultation.
 * Guarantees zero fabricated fallbacks and zero undefined translation leaks.
 */

export const resolveHospitalName = (patient) => {
  if (!patient) return 'Hospital not recorded';

  // 1. Direct hospital name string on patient record
  if (typeof patient.hospitalName === 'string' && patient.hospitalName.trim()) {
    return patient.hospitalName.trim();
  }
  if (typeof patient.hospital_name === 'string' && patient.hospital_name.trim()) {
    return patient.hospital_name.trim();
  }

  // 2. Nested hospital object on patient record
  if (patient.hospital && typeof patient.hospital === 'object' && typeof patient.hospital.name === 'string' && patient.hospital.name.trim()) {
    return patient.hospital.name.trim();
  }
  if (typeof patient.hospital === 'string' && patient.hospital.trim()) {
    return patient.hospital.trim();
  }

  // 3. Consultation / Case specific hospital fields
  if (typeof patient.consultationHospitalName === 'string' && patient.consultationHospitalName.trim()) {
    return patient.consultationHospitalName.trim();
  }
  if (typeof patient.selectedHospitalName === 'string' && patient.selectedHospitalName.trim()) {
    return patient.selectedHospitalName.trim();
  }

  // 4. Honest fallback when no genuine hospital record exists
  return 'Hospital not recorded';
};

/**
 * Fail-Closed Hospital Scoping Check
 * Returns true ONLY if the patient has a valid, non-empty hospital ID that strictly matches targetHospitalId.
 */
export const isPatientInHospital = (patient, targetHospitalId) => {
  if (!patient || !targetHospitalId) return false;
  const rawId = patient.hospitalId || patient.hospital_id || patient.hospital?.id;
  if (typeof rawId !== 'string' || !rawId.trim()) return false;
  return rawId.trim() === String(targetHospitalId).trim();
};
