// MediMitra Route & URL Management Utility (Optimized for 6–7 Step Clinical Flow)

export const getRouteUrl = (screen, step = 1) => {
  if (screen === 'welcome') return '#/';
  if (screen === 'doctor_login') return '#/doctor/login';
  if (screen === 'doctor_dashboard') return '#/doctor/workstation';
  if (screen === 'hospital_admin') return '#/hospital/admin';
  if (screen === 'patient') {
    const stepSlugs = {
      1: 'facility-select',
      2: 'registration',
      3: 'clinical-history',
      4: 'documents',
      5: 'review-summary',
      6: 'token-receipt',
      7: 'token-receipt'
    };
    const slug = stepSlugs[step] || `step-${step}`;
    return `#/patient/${slug}`;
  }
  return '#/';
};

export const parseRouteFromHash = (hash) => {
  const cleanHash = (hash || '').replace(/^#\/?/, '').toLowerCase();
  
  if (!cleanHash || cleanHash === 'welcome' || cleanHash === '/') {
    return { screen: 'welcome', step: 1 };
  }
  
  if (cleanHash.startsWith('doctor/login')) {
    return { screen: 'doctor_login', step: 1 };
  }
  
  if (cleanHash.startsWith('doctor/workstation') || cleanHash === 'doctor' || cleanHash === 'doctor/dashboard') {
    return { screen: 'doctor_dashboard', step: 1 };
  }
  
  if (cleanHash.startsWith('hospital/admin') || cleanHash === 'hospital' || cleanHash === 'hospital/dashboard') {
    return { screen: 'hospital_admin', step: 1 };
  }
  
  if (cleanHash.startsWith('patient')) {
    const parts = cleanHash.split('/');
    const stepPart = parts[1] || '';
    const slugMap = {
      // Step 1: Hospital Select
      'facility-select': 1,
      'hospital': 1,
      'step-1': 1,

      // Step 2: Consolidated Registration (ID + ABHA + Language + Consent)
      'registration': 2,
      'patient-identity': 2,
      'identification': 2,
      'language-select': 2,
      'language': 2,
      'informed-consent': 2,
      'consent': 2,
      'step-2': 2,

      // Step 3: Consolidated Clinical Intake (Reason for Visit + Clinical History + Inline Red Flags)
      'clinical-history': 3,
      'reason-for-visit': 3,
      'reason': 3,
      'symptoms': 3,
      'history': 3,
      'red-flag-triage': 3,
      'triage': 3,
      'step-3': 3,

      // Step 4: AYUSH Assessment (conditional) or Documents
      'ayush-history': 4,
      'ayush-assessment': 4,
      'ayush': 4,
      'document-upload': 4,
      'documents': 4,
      'ocr-extraction': 4,
      'ocr': 4,
      'medical-timeline': 4,
      'timeline': 4,
      'step-4': 4,

      // Step 5: Review & Submit (standard) or Documents (AYUSH)
      'review-summary': 5,
      'review': 5,
      'step-5': 5,

      // Step 6: Token Receipt (standard) or Review (AYUSH)
      'token-receipt': 6,
      'token': 6,
      'receipt': 6,
      'step-6': 6,
      'step-7': 7
    };
    const step = slugMap[stepPart] || 1;
    return { screen: 'patient', step };
  }
  
  return { screen: 'welcome', step: 1 };
};
