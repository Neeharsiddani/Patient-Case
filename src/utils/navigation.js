// MediMitra Route & URL Management Utility

export const getRouteUrl = (screen, step = 1) => {
  if (screen === 'welcome') return '#/';
  if (screen === 'doctor_login') return '#/doctor/login';
  if (screen === 'doctor_dashboard') return '#/doctor/workstation';
  if (screen === 'hospital_admin') return '#/hospital/admin';
  if (screen === 'patient') {
    const stepSlugs = {
      1: 'facility-select',
      2: 'patient-identity',
      3: 'language-select',
      4: 'informed-consent',
      5: 'reason-for-visit',
      6: 'clinical-history',
      7: 'red-flag-triage',
      8: 'document-upload',
      9: 'ocr-extraction',
      10: 'medical-timeline',
      11: 'review-summary',
      12: 'token-receipt',
      13: 'token-receipt'
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
      'facility-select': 1,
      'step-1': 1,
      'hospital': 1,
      'patient-identity': 2,
      'identification': 2,
      'step-2': 2,
      'language-select': 3,
      'language': 3,
      'step-3': 3,
      'informed-consent': 4,
      'consent': 4,
      'step-4': 4,
      'reason-for-visit': 5,
      'reason': 5,
      'step-5': 5,
      'clinical-history': 6,
      'history': 6,
      'step-6': 6,
      'ayush-history': 7,
      'ayush': 7,
      'red-flag-triage': 7,
      'triage': 7,
      'step-7': 7,
      'document-upload': 8,
      'documents': 8,
      'step-8': 8,
      'ocr-extraction': 9,
      'ocr': 9,
      'step-9': 9,
      'medical-timeline': 10,
      'timeline': 10,
      'step-10': 10,
      'review-summary': 11,
      'review': 11,
      'step-11': 11,
      'token-receipt': 12,
      'token': 12,
      'receipt': 12,
      'step-12': 12,
      'step-13': 13
    };
    const step = slugMap[stepPart] || 1;
    return { screen: 'patient', step };
  }
  
  return { screen: 'welcome', step: 1 };
};
