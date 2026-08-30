// MediMitra Route & URL Management Utility

export const getRouteUrl = (screen, step = 1) => {
  if (screen === 'welcome') return '#/';
  if (screen === 'doctor_login') return '#/doctor/login';
  if (screen === 'doctor_dashboard') return '#/doctor/workstation';
  if (screen === 'hospital_admin') return '#/hospital/admin';
  if (screen === 'patient') {
    const stepSlugs = {
      1: 'facility-select',
      2: 'reason-for-visit',
      3: 'medical-history',
      4: 'red-flag-triage',
      5: 'document-upload',
      6: 'medical-timeline',
      7: 'review-summary',
      8: 'token-receipt'
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
      'reason-for-visit': 2,
      'step-2': 2,
      'symptoms': 2,
      'medical-history': 3,
      'step-3': 3,
      'history': 3,
      'red-flag-triage': 4,
      'step-4': 4,
      'triage': 4,
      'document-upload': 5,
      'step-5': 5,
      'documents': 5,
      'medical-timeline': 6,
      'step-6': 6,
      'timeline': 6,
      'review-summary': 7,
      'step-7': 7,
      'review': 7,
      'token-receipt': 8,
      'step-8': 8,
      'receipt': 8
    };
    const step = slugMap[stepPart] || 1;
    return { screen: 'patient', step };
  }
  
  return { screen: 'welcome', step: 1 };
};
