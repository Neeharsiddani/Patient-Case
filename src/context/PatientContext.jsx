import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../data/translations';
import { ApiService } from '../services/api';
import { createInitialAyushState } from '../data/ayushClinicalFlows';
import { evaluateClinicalRedFlags } from '../data/clinicalFlows';

const PatientContext = createContext(null);

const STORAGE_KEY = 'medimitra_patients_v2';
const AUTH_USER_KEY = 'medimitra_auth_user';

export const fallbackHospitals = [
  {
    id: 'hosp-ggh-hyd',
    name: 'Government General Hospital',
    code: 'GGH-HYD',
    location: 'Afzal Gunj, Osmania Hospital Road',
    city: 'Hyderabad',
    state: 'Telangana',
    facility_type: 'Government Teaching Tertiary Hospital',
    hfr_id: 'IN-TG-HYD-GGH-001',
    phone: '+91 40 2460 0121'
  },
  {
    id: 'hosp-apollo-hyd',
    name: 'Apollo Hospitals',
    code: 'APOLLO-HYD',
    location: 'Road No. 72, Opposite Bharatiya Vidya Bhavan, Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    facility_type: 'Multi-Specialty Super Specialty Hospital',
    hfr_id: 'IN-TG-HYD-APL-002',
    phone: '+91 40 2360 7777'
  },
  {
    id: 'hosp-yashoda-hyd',
    name: 'Yashoda Hospitals',
    code: 'YASHODA-HYD',
    location: 'Alexander Road, Raj Bhavan Rd, Somajiguda',
    city: 'Hyderabad',
    state: 'Telangana',
    facility_type: 'Tertiary Care Super Specialty Hospital',
    hfr_id: 'IN-TG-HYD-YSH-003',
    phone: '+91 40 4567 4567'
  },
  {
    id: 'hosp-aiims-delhi',
    name: 'All India Institute of Medical Sciences (AIIMS)',
    code: 'AIIMS-DEL',
    location: 'Sri Aurobindo Marg, Ansari Nagar East',
    city: 'New Delhi',
    state: 'Delhi',
    facility_type: 'Apex National Institute of Medical Sciences',
    hfr_id: 'IN-DL-DEL-AIIMS-001',
    phone: '+91 11 2658 8500'
  }
];

export const standardHospitalDepartments = {
  'hosp-ggh-hyd': [
    { id: 'dept-ggh-hyd-genmed', name: 'General Medicine', code: 'GENMED', room_number: 'Room 101', description: 'Internal Medicine, Fevers, Diabetes & Chronic Care' },
    { id: 'dept-ggh-hyd-cardio', name: 'Cardiology', code: 'CARDIO', room_number: 'Room 104', description: 'Chest Pain, Angina, HTN & ECG Evaluation' },
    { id: 'dept-ggh-hyd-ortho', name: 'Orthopedics', code: 'ORTHO', room_number: 'Room 108', description: 'Bone, Joint & Spine Disorders' },
    { id: 'dept-ggh-hyd-ped', name: 'Pediatrics', code: 'PED', room_number: 'Room 112', description: 'Child Health, Neonatology & Immunization' },
    { id: 'dept-ggh-hyd-derm', name: 'Dermatology', code: 'DERM', room_number: 'Room 115', description: 'Skin, Hair & Allergy Clinic' },
    { id: 'dept-ggh-hyd-surg', name: 'General Surgery', code: 'SURG', room_number: 'Room 120', description: 'Surgical Consultations & Wound Care' },
    { id: 'dept-ggh-hyd-ent', name: 'ENT', code: 'ENT', room_number: 'Room 124', description: 'Ear, Nose & Throat Disorders' },
    { id: 'dept-ggh-hyd-gyn', name: 'Gynecology & Obstetrics', code: 'GYN', room_number: 'Room 128', description: 'Maternal Health & Women Wellness' },
    { id: 'dept-ggh-hyd-ayush', name: 'AYUSH / Ayurveda', code: 'AYUSH', room_number: 'Room 135', description: 'Traditional Medicine & Lifestyle Health' }
  ],
  'hosp-apollo-hyd': [
    { id: 'dept-apollo-hyd-cardio', name: 'Cardiology', code: 'CARDIO', room_number: 'Room 104', description: 'Comprehensive Cardiac Care & Intervention' },
    { id: 'dept-apollo-hyd-genmed', name: 'General Medicine', code: 'GENMED', room_number: 'Room 101', description: 'Internal Medicine & Multisystem Health' },
    { id: 'dept-apollo-hyd-ortho', name: 'Orthopedics', code: 'ORTHO', room_number: 'Room 108', description: 'Joint Replacement & Arthroscopy' },
    { id: 'dept-apollo-hyd-derm', name: 'Dermatology', code: 'DERM', room_number: 'Room 112', description: 'Cosmetic & Medical Dermatology' },
    { id: 'dept-apollo-hyd-ped', name: 'Pediatrics', code: 'PED', room_number: 'Room 115', description: 'Pediatric Care & Intensive Medicine' },
    { id: 'dept-apollo-hyd-surg', name: 'General Surgery', code: 'SURG', room_number: 'Room 120', description: 'Minimal Access & Laparoscopic Surgery' },
    { id: 'dept-apollo-hyd-gyn', name: 'Gynecology & Obstetrics', code: 'GYN', room_number: 'Room 128', description: 'Advanced Obstetrics & High-Risk Pregnancy' }
  ],
  'hosp-yashoda-hyd': [
    { id: 'dept-yashoda-hyd-genmed', name: 'General Medicine', code: 'GENMED', room_number: 'Room 101', description: 'Comprehensive Adult Healthcare' },
    { id: 'dept-yashoda-hyd-cardio', name: 'Cardiology', code: 'CARDIO', room_number: 'Room 104', description: 'Interventional Cardiology & Electrophysiology' },
    { id: 'dept-yashoda-hyd-ortho', name: 'Orthopedics', code: 'ORTHO', room_number: 'Room 108', description: 'Orthopedics & Spine Center' },
    { id: 'dept-yashoda-hyd-surg', name: 'General Surgery', code: 'SURG', room_number: 'Room 120', description: 'Surgical Gastroenterology & General Surgery' },
    { id: 'dept-yashoda-hyd-ent', name: 'ENT', code: 'ENT', room_number: 'Room 124', description: 'Otolaryngology & Head-Neck Clinic' }
  ],
  'hosp-aiims-delhi': [
    { id: 'dept-aiims-del-genmed', name: 'General Medicine', code: 'GENMED', room_number: 'Room 101', description: 'Department of Medicine & OPD' },
    { id: 'dept-aiims-del-cardio', name: 'Cardiology', code: 'CARDIO', room_number: 'Room 104', description: 'Cardio-Thoracic Centre (CTC)' },
    { id: 'dept-aiims-del-ortho', name: 'Orthopedics', code: 'ORTHO', room_number: 'Room 108', description: 'Orthopedics & Trauma Center' },
    { id: 'dept-aiims-del-derm', name: 'Dermatology', code: 'DERM', room_number: 'Room 112', description: 'Dermatology & Venereology' },
    { id: 'dept-aiims-del-ped', name: 'Pediatrics', code: 'PED', room_number: 'Room 115', description: 'Department of Pediatrics' },
    { id: 'dept-aiims-del-surg', name: 'General Surgery', code: 'SURG', room_number: 'Room 120', description: 'Department of Surgical Disciplines' },
    { id: 'dept-aiims-del-ent', name: 'ENT', code: 'ENT', room_number: 'Room 124', description: 'Otorhinolaryngology' },
    { id: 'dept-aiims-del-gyn', name: 'Gynecology & Obstetrics', code: 'GYN', room_number: 'Room 128', description: 'Obstetrics & Gynaecology' },
    { id: 'dept-aiims-del-ayush', name: 'AYUSH / Ayurveda', code: 'AYUSH', room_number: 'Room 135', description: 'Center for Integrative Medicine (AYUSH)' }
  ]
};

export const PatientProvider = ({ children }) => {
  const [role, setRole] = useState('kiosk'); // 'kiosk' | 'doctor' | 'hospital_admin'
  const [language, setLanguage] = useState('en'); // 'en', 'hi', 'te', 'ta', 'mr', 'bn'
  const [serverOnline, setServerOnline] = useState(false);
  
  // Authenticated Staff User Profile (Doctor or Hospital Admin)
  const [authenticatedUser, setAuthenticatedUser] = useState(() => {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Hospital Facility Management - authoritative identity from authenticated user
  const [hospitals, setHospitals] = useState(fallbackHospitals);
  const [activeHospitalId, setActiveHospitalId] = useState(() => {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    if (saved) {
      try {
        const u = JSON.parse(saved);
        return u.hospitalId || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Keep activeHospitalId synchronized with authenticatedUser
  useEffect(() => {
    if (authenticatedUser?.hospitalId) {
      setActiveHospitalId(authenticatedUser.hospitalId);
    }
  }, [authenticatedUser?.hospitalId]);

  // Synchronize authenticated identity from backend on startup
  useEffect(() => {
    const syncAuth = async () => {
      const token = ApiService.getAuthToken();
      if (!token) {
        setAuthenticatedUser(null);
        setActiveHospitalId(null);
        return;
      }
      try {
        const meRes = await ApiService.getMe();
        if (meRes?.success && meRes.user) {
          setAuthenticatedUser(meRes.user);
          if (meRes.user.hospitalId) {
            setActiveHospitalId(meRes.user.hospitalId);
          }
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(meRes.user));
        } else {
          ApiService.logout();
          setAuthenticatedUser(null);
          setActiveHospitalId(null);
        }
      } catch {
        const saved = localStorage.getItem(AUTH_USER_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed?.hospitalId) {
              setActiveHospitalId(parsed.hospitalId);
            }
          } catch {}
        }
      }
    };
    syncAuth();
  }, []);

  // In-Memory Patients Queue (Live synced with authorized hospital API)
  const [patients, setPatients] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState(null);

  // Clean up any historical patient data from localStorage for clinical data security
  useEffect(() => {
    try {
      localStorage.removeItem('medimitra_patients_v2');
      localStorage.removeItem('medikiosk_patients_v2');
      localStorage.removeItem('medikiosk_patients_v3');
    } catch {}
  }, []);

  // Active Patient for Doctor Consultation
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  // Kiosk In-Progress Patient State (10 Steps)
  const KIOSK_DOCS_KEY = 'medimitra_kiosk_uploaded_docs';
  const getInitialUploadedDocs = () => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const saved = window.sessionStorage.getItem(KIOSK_DOCS_KEY);
        return saved ? JSON.parse(saved) : [];
      }
    } catch {
      // ignore
    }
    return [];
  };

  const [kioskStep, setKioskStep] = useState(1);
  const [kioskForm, setKioskForm] = useState({
    abhaId: '',
    abhaAddress: '',
    name: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    
    // Hospital & Department Selection (Explicit choice by patient required)
    selectedHospitalId: null,
    selectedHospitalName: '',
    selectedDepartmentId: '',
    selectedDepartmentName: '',
    
    // Primary Reason for Visit
    reasonForVisit: '',
    
    // Consent
    consentAgreed: false,
    signature: '',
    
    // Clinical Complaints & Symptoms
    selectedRegion: '',
    selectedComplaintId: '',
    chiefComplaints: [],
    customComplaint: '',
    duration: '',
    painScore: 0,
    onset: '',
    
    // History & Vitals
    pastConditions: [],
    customCondition: '',
    allergies: [],
    customAllergy: '',
    currentMedications: [],
    customMedication: '',
    historyAnswers: {},
    structuredHistory: [],
    vitals: {
      bpSystolic: '',
      bpDiastolic: '',
      pulse: '',
      spo2: '',
      temp: '',
      respiratoryRate: '',
      bloodSugar: '',
      weight: '',
      height: '',
      bmi: ''
    },
    uploadedDocs: getInitialUploadedDocs(),
    activeOcrDoc: null,
    triageLevel: 4,
    triageCategory: 'Routine / Standard (Green)',
    triageColor: 'green',
    redFlags: [],
    assignedDepartment: '',
    assignedDoctor: '',
    roomNumber: '',
    generatedToken: null,
    isAyushCase: false,
    ayushHistory: createInitialAyushState()
  });

  // Persist uploaded docs to sessionStorage so they survive page refresh
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        if (kioskForm.uploadedDocs && kioskForm.uploadedDocs.length > 0) {
          window.sessionStorage.setItem(KIOSK_DOCS_KEY, JSON.stringify(kioskForm.uploadedDocs));
        } else {
          window.sessionStorage.removeItem(KIOSK_DOCS_KEY);
        }
      }
    } catch {
      // ignore
    }
  }, [kioskForm.uploadedDocs]);

  // Load Hospitals and Patient Queue from Backend Server
  const fetchQueueAndHospitals = useCallback(async () => {
    setQueueLoading(true);
    setQueueError(null);
    try {
      const health = await ApiService.checkHealth();
      if (health && health.status === 'HEALTHY') {
        setServerOnline(true);
        
        // Fetch active hospitals from centralized directory
        const hospRes = await ApiService.getHospitals({ limit: 100 });
        let loadedHospitals = [];
        if (hospRes?.success && Array.isArray(hospRes.hospitals) && hospRes.hospitals.length > 0) {
          loadedHospitals = [...hospRes.hospitals];
        } else {
          loadedHospitals = [...fallbackHospitals];
        }

        // Always ensure fallbackHospitals (core facilities like GGH, Apollo, Yashoda, AIIMS) are present
        for (const fb of fallbackHospitals) {
          if (!loadedHospitals.some(h => h.id === fb.id)) {
            loadedHospitals.push(fb);
          }
        }

        // If authenticated user belongs to a hospital not in the loaded list, fetch it directly by ID
        const userHospId = authenticatedUser?.hospitalId;
        if (userHospId && !loadedHospitals.some(h => h.id === userHospId)) {
          try {
            const singleHospRes = await ApiService.getHospitalById(userHospId);
            if (singleHospRes?.success && singleHospRes.hospital) {
              loadedHospitals.unshift(singleHospRes.hospital);
            }
          } catch (e) {
            console.warn('[MediMitra] Could not pre-fetch authenticated facility by ID:', e.message);
          }
        }

        setHospitals(loadedHospitals);

        // Fetch patients based on role & auth (only when authenticated)
        if (ApiService.getAuthToken()) {
          try {
            const queueRes = await ApiService.getPatients();
            if (queueRes?.success && Array.isArray(queueRes.patients)) {
              setPatients(queueRes.patients);
              if (queueRes.patients.length > 0) {
                if (!queueRes.patients.some(p => p.id === selectedPatientId)) {
                  setSelectedPatientId(queueRes.patients[0].id);
                }
              } else {
                setSelectedPatientId(null);
              }
            } else {
              setPatients([]);
              setSelectedPatientId(null);
            }
          } catch (err) {
            console.error('Failed to load patient queue:', err);
            setQueueError(err.message || 'Unable to load clinical queue.');
            setPatients([]);
            setSelectedPatientId(null);
          }
        } else {
          setPatients([]);
          setSelectedPatientId(null);
        }
      } else {
        setServerOnline(false);
      }
    } catch (err) {
      setServerOnline(false);
      setQueueError(err.message || 'Server connection error');
    } finally {
      setQueueLoading(false);
    }
  }, [selectedPatientId, authenticatedUser?.hospitalId]);

  useEffect(() => {
    fetchQueueAndHospitals();
  }, [fetchQueueAndHospitals]);

  // Safe background queue polling for authenticated clinician / hospital admin (every 5 seconds)
  useEffect(() => {
    if (!authenticatedUser || (role !== 'doctor' && role !== 'hospital_admin')) {
      return;
    }

    const intervalId = setInterval(() => {
      if (ApiService.getAuthToken()) {
        ApiService.getPatients()
          .then((queueRes) => {
            if (queueRes?.success && Array.isArray(queueRes.patients)) {
              setPatients(queueRes.patients);
              if (queueRes.patients.length > 0) {
                setSelectedPatientId((prev) => {
                  if (prev && queueRes.patients.some((p) => p.id === prev)) {
                    return prev;
                  }
                  return queueRes.patients[0].id;
                });
              }
            }
          })
          .catch((err) => {
            console.warn('[MediMitra] Background queue polling notice:', err.message);
          });
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [authenticatedUser, role]);

  const t = translations[language] || translations.en;

  // Web Speech API Voice Prompt synthesis
  const speakText = (textToSpeak, customLang = null) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const targetLang = customLang || (language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : language === 'ta' ? 'ta-IN' : 'en-IN');
      utterance.lang = targetLang;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis not available or blocked:', err);
    }
  };

  // Login handler
  const handleUserLogin = (user, token) => {
    setAuthenticatedUser(user);
    if (user.hospitalId) {
      setActiveHospitalId(user.hospitalId);
    }
    // Clear previously selected patient from old session before loading new queue
    setSelectedPatientId(null);
    setPatients([]);
    if (user.role === 'DOCTOR') {
      setRole('doctor');
    } else if (user.role === 'HOSPITAL_ADMIN' || user.role === 'ADMIN') {
      setRole('hospital_admin');
    }
    fetchQueueAndHospitals();
  };

  // Logout handler
  const handleUserLogout = () => {
    ApiService.logout();
    setAuthenticatedUser(null);
    setActiveHospitalId(null);
    setPatients([]);
    setSelectedPatientId(null);
    setRole('kiosk');
    fetchQueueAndHospitals();
  };

  // Automated Triage & Red-Flag Severity Calculator
  const calculateTriage = (form) => {
    const redFlags = [];
    let severityScore = 0;

    // 1. Incorporate already identified clinical red flags from medical history
    if (Array.isArray(form?.redFlags) && form.redFlags.length > 0) {
      form.redFlags.forEach((rf) => {
        const text = typeof rf === 'string' ? rf : (rf.titleEn || rf.title || String(rf));
        if (text && !redFlags.includes(text)) {
          redFlags.push(text);
          severityScore += 4;
        }
      });
    }

    // 2. Also evaluate any medical history question answers directly
    if (form?.historyAnswers && Object.keys(form.historyAnswers).length > 0) {
      try {
        const evaluated = evaluateClinicalRedFlags(form.selectedComplaintId || 'chest_pain', form.historyAnswers);
        if (evaluated?.redFlags && evaluated.redFlags.length > 0) {
          evaluated.redFlags.forEach((rf) => {
            const text = typeof rf === 'string' ? rf : (rf.titleEn || rf.title || rf.details);
            if (text && !redFlags.includes(text)) {
              redFlags.push(text);
              severityScore += (rf.level === 'CRITICAL' ? 5 : 3);
            }
          });
        }
        if (evaluated?.maxScore) severityScore += evaluated.maxScore;
      } catch (err) {
        console.warn('Error evaluating clinical red flags in calculateTriage:', err);
      }
    }

    const sys = Number(form?.vitals?.bpSystolic);
    const dia = Number(form?.vitals?.bpDiastolic);
    const spo2 = Number(form?.vitals?.spo2);
    const pulse = Number(form?.vitals?.pulse);
    const temp = Number(form?.vitals?.temp);
    const bs = Number(form?.vitals?.bloodSugar);

    if (sys >= 170 || dia >= 105) {
      redFlags.push(`Critical BP Alert: Hypertensive crisis level (${sys}/${dia} mmHg)`);
      severityScore += 4;
    } else if (sys >= 145 || dia >= 95) {
      severityScore += 2;
    }

    if (spo2 && spo2 <= 92) {
      redFlags.push(`Hypoxia Alert: Oxygen saturation low (${spo2}%)`);
      severityScore += 5;
    } else if (spo2 && spo2 <= 95) {
      severityScore += 2;
    }

    if (pulse && (pulse >= 120 || pulse <= 45)) {
      redFlags.push(`Arrhythmia Alert: Extreme pulse rate (${pulse} bpm)`);
      severityScore += 3;
    }

    if (bs && bs >= 250) {
      redFlags.push(`Hyperglycemia Alert: Random blood sugar very high (${bs} mg/dL)`);
      severityScore += 3;
    } else if (bs && bs <= 60) {
      redFlags.push(`Hypoglycemia Alert: Blood glucose critically low (${bs} mg/dL)`);
      severityScore += 4;
    }

    // Check Symptoms & Reason for Visit
    const complaintsToCheck = [...(form?.chiefComplaints || []), form?.reasonForVisit || ''];
    complaintsToCheck.forEach((comp) => {
      const lower = String(comp).toLowerCase();
      if (lower.includes('crushing chest') || lower.includes('radiating') || lower.includes('worst headache') || lower.includes('blood in') || lower.includes('syncope') || lower.includes('blackout') || lower.includes('heart attack')) {
        redFlags.push(`High Risk Symptom: ${comp}`);
        severityScore += 4;
      } else if (lower.includes('cough for > 2 weeks') || lower.includes('tb screening') || lower.includes('> 2 weeks')) {
        redFlags.push(`Infectious Disease Surveillance: Suspected TB`);
        severityScore += 2;
      } else if (lower.trim().length > 0) {
        severityScore += 1;
      }
    });

    if (form?.painScore >= 8) {
      severityScore += 3;
    }

    // Check Allergies
    if (form?.allergies && form.allergies.length > 0 && !form.allergies.includes('No Known Drug Allergies (NKDA)')) {
      redFlags.push(`Drug Allergy Alert: Patient allergic to ${form.allergies.join(', ')}`);
    }

    let triageLevel = 4;
    let triageCategory = 'Routine / Standard (Green)';
    let triageColor = 'green';

    if (severityScore >= 7 || redFlags.some(r => typeof r === 'string' && (r.toLowerCase().includes('critical') || r.toLowerCase().includes('hypoxia') || r.toLowerCase().includes('high risk') || r.toLowerCase().includes('emergency') || r.toLowerCase().includes('resuscitation') || r.toLowerCase().includes('immediate') || r.toLowerCase().includes('cardiac') || r.toLowerCase().includes('dengue') || r.toLowerCase().includes('stroke') || r.toLowerCase().includes('cauda equina') || r.toLowerCase().includes('anaphylaxis') || r.toLowerCase().includes('bleeding')))) {
      triageLevel = 1;
      triageCategory = 'Resuscitation / Immediate Priority';
      triageColor = 'red';
    } else if (severityScore >= 3 || redFlags.length > 0) {
      triageLevel = 2;
      triageCategory = 'High Clinical Priority (Red Flag)';
      triageColor = 'red';
    }

    return { triageLevel, triageCategory, triageColor, redFlags: Array.from(new Set(redFlags)) };
  };

  // Submit Kiosk Case to Selected Hospital & Department Queue (100% Authoritative Backend Response)
  const submitKioskCase = async () => {
    const { triageLevel, triageCategory, triageColor, redFlags } = calculateTriage(kioskForm);

    if (!kioskForm.selectedHospitalId) {
      throw new Error('Please select a healthcare facility before submitting.');
    }

    const primaryComplaintTitle = kioskForm.reasonForVisit || kioskForm.chiefComplaints?.[0] || kioskForm.customComplaint || 'General OPD intake';

    const intakePayload = {
      name: kioskForm.name || 'Walk-in Patient',
      age: Number(kioskForm.age) || null,
      gender: kioskForm.gender || 'Unspecified',
      phone: kioskForm.phone || '',
      address: kioskForm.address || '',
      abhaId: kioskForm.abhaId || null,
      abhaAddress: kioskForm.abhaAddress || null,
      language: languagesMap[language] || 'English',
      hospitalId: kioskForm.selectedHospitalId,
      hospitalName: kioskForm.selectedHospitalName,
      departmentId: kioskForm.selectedDepartmentId || kioskForm.department_id || 'dept-genmed',
      department: kioskForm.selectedDepartmentName || kioskForm.assignedDepartment || 'General Medicine',
      reasonForVisit: kioskForm.reasonForVisit || primaryComplaintTitle,
      consentAgreed: Boolean(kioskForm.consentAgreed),
      signatureData: kioskForm.signature,
      chiefComplaints: kioskForm.chiefComplaints.length > 0 ? kioskForm.chiefComplaints : [primaryComplaintTitle],
      duration: kioskForm.duration,
      painScore: kioskForm.painScore,
      onset: kioskForm.onset,
      hpi: {
        onset: kioskForm.duration ? `Problem started ${kioskForm.duration}.` : 'Onset not specified.',
        location: kioskForm.selectedRegion ? `${kioskForm.selectedRegion} region.` : 'General/Systemic.',
        character: `Patient described symptom as ${primaryComplaintTitle}.`,
        severity: `${kioskForm.painScore || 0} / 10 on numeric pain rating scale.`,
        radiation: 'Recorded during conversational intake.',
        aggravatingFactors: kioskForm.historyAnswers?.aggravating || 'Not reported by patient.',
        relievingFactors: kioskForm.historyAnswers?.relieving || 'Not reported by patient.',
        associatedSymptoms: kioskForm.historyAnswers?.associated || 'Not reported by patient.'
      },
      pastMedicalHistory: kioskForm.pastConditions.length > 0 ? kioskForm.pastConditions : ['No chronic medical conditions reported by patient.'],
      pastSurgicalHistory: ['No prior surgeries recorded during kiosk intake.'],
      currentMedications: kioskForm.currentMedications.length > 0 ? kioskForm.currentMedications : ['No regular medications reported by patient.'],
      drugAllergies: kioskForm.allergies.length > 0 ? kioskForm.allergies : ['No Known Drug Allergies (NKDA)'],
      familyHistory: 'Not recorded during kiosk intake.',
      personalHistory: 'Not recorded during kiosk intake.',
      reviewOfSystems: {
        cardiovascular: 'Heart rate and BP recorded at kiosk.',
        respiratory: 'SpO2 saturation monitored at kiosk.',
        intakeNote: 'Clinical review of systems to be conducted by attending physician.'
      },
      vitals: {
        bp_systolic: kioskForm.vitals.bpSystolic,
        bp_diastolic: kioskForm.vitals.bpDiastolic,
        pulse: kioskForm.vitals.pulse,
        spo2: kioskForm.vitals.spo2,
        temp: kioskForm.vitals.temp,
        blood_sugar: kioskForm.vitals.bloodSugar
      },
      uploadedDocuments: kioskForm.uploadedDocs || [],
      ayushHistory: kioskForm.ayushHistory || createInitialAyushState()
    };

    // 1. Submit to Authoritative Backend API
    const response = await ApiService.submitPatientIntake(intakePayload);
    if (!response || !response.success || !response.data) {
      throw new Error(response?.message || response?.error || 'Registration failed on server. Please try again.');
    }

    const backendData = response.data;

    // 2. Build authoritative patient record strictly from backend persisted data
    const authoritativePatient = {
      id: backendData.id,
      tokenNumber: backendData.tokenNumber,
      hospitalId: backendData.hospitalId,
      hospitalName: backendData.hospitalName,
      departmentId: backendData.departmentId,
      department: backendData.department,
      roomNumber: backendData.roomNumber,
      assignedDoctor: backendData.assignedDoctorName || 'Assigned OPD Clinician',
      assignedDoctorName: backendData.assignedDoctorName || 'Assigned OPD Clinician',
      reasonForVisit: intakePayload.reasonForVisit,
      registrationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      waitTime: backendData.waitTime || (triageLevel <= 2 ? 'Immediate (0-5 min)' : triageLevel === 3 ? '15-20 mins' : '30-40 mins'),
      status: 'Waiting',
      caseStatus: 'Waiting for Review',
      verificationStatus: 'Pending Verification',
      verificationTimestamp: null,
      rejectionReason: null,
      triageLevel: backendData.triageLevel ?? triageLevel,
      triageCategory: backendData.triageCategory || triageCategory,
      triageColor: backendData.triageColor || triageColor,
      redFlags: backendData.redFlags || redFlags,
      
      abhaId: intakePayload.abhaId,
      abhaAddress: intakePayload.abhaAddress,
      name: intakePayload.name,
      age: intakePayload.age,
      gender: intakePayload.gender,
      phone: intakePayload.phone,
      address: intakePayload.address,
      language: intakePayload.language,
      
      chiefComplaints: intakePayload.chiefComplaints,
      hpi: intakePayload.hpi,
      pastMedicalHistory: intakePayload.pastMedicalHistory,
      pastSurgicalHistory: intakePayload.pastSurgicalHistory,
      currentMedications: intakePayload.currentMedications,
      drugAllergies: intakePayload.drugAllergies,
      familyHistory: intakePayload.familyHistory,
      personalHistory: intakePayload.personalHistory,
      reviewOfSystems: intakePayload.reviewOfSystems,
      vitals: intakePayload.vitals,
      documents: intakePayload.uploadedDocuments,
      structuredHistory: kioskForm.structuredHistory || [],

      // AI Generated Draft for Doctor
      aiGeneratedDraft: {
        disclaimer: 'AI-generated draft — Doctor verification required. Not a final clinical diagnosis.',
        subjectiveSummary: `${intakePayload.age ? `${intakePayload.age}-year-old` : 'Adult'} ${intakePayload.gender || 'patient'} presenting at ${backendData.hospitalName} (${backendData.department || 'General OPD'}) with ${primaryComplaintTitle}${kioskForm.duration ? ` of ${kioskForm.duration} duration` : ''}.`,
        objectiveSummary: `Vitals: BP ${kioskForm.vitals.bpSystolic}/${kioskForm.vitals.bpDiastolic} mmHg, HR ${kioskForm.vitals.pulse} bpm, SpO2 ${kioskForm.vitals.spo2}%, RBS ${kioskForm.vitals.bloodSugar} mg/dL.`,
        preliminaryRiskAssessment: `Triage Priority: ${backendData.triageCategory || triageCategory} (ESI Level ${backendData.triageLevel ?? triageLevel}).`,
        differentialDiagnosisDraft: [
          `${primaryComplaintTitle} Evaluation`,
          'Secondary Systemic Investigation'
        ],
        suggestedNextSteps: [
          'Detailed physical examination and vitals re-check',
          'Review previous records and order baseline laboratory investigations'
        ]
      },
      
      doctorNotes: {
        provisionalDiagnosis: '',
        icd10: [],
        prescriptions: [],
        investigations: [],
        advice: '',
        followUp: ''
      },
      
      ayushHistory: intakePayload.ayushHistory
    };

    // 3. Synchronize authoritative patient into state queue and kioskForm
    setPatients((prev) => [authoritativePatient, ...prev.filter(p => p.id !== authoritativePatient.id)]);
    setSelectedPatientId(authoritativePatient.id);
    
    setKioskForm((prev) => ({
      ...prev,
      generatedToken: authoritativePatient,
      triageLevel: authoritativePatient.triageLevel,
      triageCategory: authoritativePatient.triageCategory,
      triageColor: authoritativePatient.triageColor,
      redFlags: authoritativePatient.redFlags
    }));

    return authoritativePatient;
  };

  // Reset Kiosk Form for new patient
  const resetKiosk = () => {
    setActiveHospitalId(null);
    setKioskStep(1);
    setKioskForm({
      abhaId: '',
      abhaAddress: '',
      name: '',
      age: '',
      gender: '',
      phone: '',
      address: '',
      selectedHospitalId: null,
      selectedHospitalName: '',
      selectedDepartmentId: '',
      selectedDepartmentName: '',
      reasonForVisit: '',
      consentAgreed: false,
      signature: '',
      selectedRegion: '',
      selectedComplaintId: '',
      chiefComplaints: [],
      customComplaint: '',
      duration: '',
      painScore: 0,
      onset: '',
      pastConditions: [],
      customCondition: '',
      allergies: [],
      customAllergy: '',
      currentMedications: [],
      customMedication: '',
      historyAnswers: {},
      structuredHistory: [],
      vitals: {
        bpSystolic: '',
        bpDiastolic: '',
        pulse: '',
        spo2: '',
        temp: '',
        respiratoryRate: '',
        bloodSugar: '',
        weight: '',
        height: '',
        bmi: ''
      },
      uploadedDocs: [],
      activeOcrDoc: null,
      triageLevel: 4,
      triageCategory: 'Routine / Standard (Green)',
      triageColor: 'green',
      redFlags: [],
      assignedDepartment: '',
      assignedDoctor: '',
      roomNumber: '',
      generatedToken: null,
      isAyushCase: false,
      ayushHistory: createInitialAyushState()
    });
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(KIOSK_DOCS_KEY);
      }
    } catch {
      // ignore
    }
  };

  // Doctor Action: Save edits to any clinical section
  const updatePatientClinicalRecord = (patientId, updatedFields) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            ...updatedFields
          };
        }
        return p;
      })
    );
  };

  // Doctor Action: Confirm Clinical Summary
  const confirmPatientSummary = async (patientId, doctorNotes = null) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            status: 'History Verified',
            caseStatus: 'History Verified',
            verificationStatus: 'History Verified',
            verificationTimestamp: timestamp,
            rejectionReason: null,
            doctorNotes: doctorNotes ? { ...p.doctorNotes, ...doctorNotes } : p.doctorNotes
          };
        }
        return p;
      })
    );

    try {
      await ApiService.confirmSummary(patientId, doctorNotes, null);
    } catch (err) {
      console.warn('Backend confirmation sync notice (saved locally in browser session):', err.message);
    }
  };

  // Doctor Action: Reject Summary / Request Re-Intake
  const rejectPatientSummary = async (patientId, reason) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            status: 'Rejected',
            caseStatus: 'Rejected',
            verificationStatus: 'Rejected',
            verificationTimestamp: timestamp,
            rejectionReason: reason || 'Incomplete or inconsistent clinical history; re-intake required.'
          };
        }
        return p;
      })
    );

    try {
      await ApiService.rejectSummary(patientId, reason);
    } catch (err) {
      console.warn('Backend rejection sync notice (saved locally in browser session):', err.message);
    }
  };

  // Doctor Consultation Updates & e-Prescriptions
  const updateDoctorNotes = async (patientId, updatedNotes, shouldComplete = false) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            status: shouldComplete ? 'Completed' : p.status,
            caseStatus: shouldComplete ? 'Consultation Completed' : p.caseStatus,
            doctorNotes: {
              ...p.doctorNotes,
              ...updatedNotes
            }
          };
        }
        return p;
      })
    );

    if (shouldComplete) {
      try {
        await ApiService.ePrescribe({
          patientId,
          provisionalDiagnosis: updatedNotes.provisionalDiagnosis,
          icd10Codes: updatedNotes.icd10,
          prescriptions: updatedNotes.prescriptions,
          investigations: updatedNotes.investigations,
          advice: updatedNotes.advice,
          followUp: updatedNotes.followUp
        });
      } catch (err) {
        console.warn('Backend e-prescribe sync notice:', err.message);
      }
    }
  };

  // Delete/dismiss patient from queue (Authoritative Backend Deletion & State Cleanup)
  const deletePatient = async (patientId) => {
    if (!patientId) {
      throw new Error('Patient ID is required for deletion.');
    }

    const response = await ApiService.deletePatient(patientId);

    // Remove from local patients state
    setPatients((prev) => prev.filter((p) => p.id !== patientId));

    // Deselect if active
    setSelectedPatientId((prev) => (prev === patientId ? null : prev));

    // Trigger queue refresh to re-sync with backend
    try {
      await fetchQueueAndHospitals();
    } catch (err) {
      console.warn('Queue sync after patient deletion:', err.message);
    }

    return response;
  };

  const currentHospitalId = authenticatedUser?.hospitalId || activeHospitalId || null;

  // Strict Fail-Closed Hospital Scoping for Doctor / Staff Context
  const hospitalScopedPatients = patients.filter((p) => {
    if (!currentHospitalId) return false;
    const pId = p.hospitalId || p.hospital_id || p.hospital?.id;
    return typeof pId === 'string' && pId.trim() === currentHospitalId.trim();
  });

  const selectedPatient = hospitalScopedPatients.find((p) => p.id === selectedPatientId) || null;

  // Automatically clear or update selected patient when hospital switches or queue updates
  useEffect(() => {
    if (!currentHospitalId) {
      if (selectedPatientId !== null) setSelectedPatientId(null);
    } else if (selectedPatientId) {
      const existsInActiveHospital = hospitalScopedPatients.some(p => p.id === selectedPatientId);
      if (!existsInActiveHospital) {
        setSelectedPatientId(hospitalScopedPatients.length > 0 ? hospitalScopedPatients[0].id : null);
      }
    }
  }, [currentHospitalId, hospitalScopedPatients, selectedPatientId]);

  return (
    <PatientContext.Provider
      value={{
        role,
        setRole,
        language,
        setLanguage,
        t,
        serverOnline,
        hospitals,
        activeHospitalId,
        setActiveHospitalId,
        authenticatedUser,
        handleUserLogin,
        handleUserLogout,
        patients,
        setPatients,
        hospitalScopedPatients,
        queueLoading,
        queueError,
        selectedPatientId,
        setSelectedPatientId,
        selectedPatient,
        kioskStep,
        setKioskStep,
        kioskForm,
        setKioskForm,
        calculateTriage,
        submitKioskCase,
        resetKiosk,
        updatePatientClinicalRecord,
        confirmPatientSummary,
        rejectPatientSummary,
        updateDoctorNotes,
        deletePatient,
        speakText,
        refreshQueue: fetchQueueAndHospitals
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
};

const languagesMap = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu',
  ta: 'Tamil',
  mr: 'Marathi',
  bn: 'Bengali'
};
