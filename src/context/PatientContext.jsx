import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initialPatients } from '../data/initialPatients';
import { translations } from '../data/translations';
import { ApiService } from '../services/api';
import { createInitialAyushState } from '../data/ayushClinicalFlows';

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
  
  // Hospital Facility Management
  const [hospitals, setHospitals] = useState(fallbackHospitals);
  const [activeHospitalId, setActiveHospitalId] = useState(null);
  
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

  // In-Memory Patients Queue (Live synced with authorized hospital API)
  const [patients, setPatients] = useState(initialPatients);

  // Clean up any historical patient data from localStorage for clinical data security
  useEffect(() => {
    try {
      localStorage.removeItem('medimitra_patients_v2');
      localStorage.removeItem('medikiosk_patients_v2');
      localStorage.removeItem('medikiosk_patients_v3');
    } catch {}
  }, []);

  // Active Patient for Doctor Consultation
  const [selectedPatientId, setSelectedPatientId] = useState('patient-101');

  // Kiosk In-Progress Patient State (10 Steps)
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
      bpSystolic: 120,
      bpDiastolic: 80,
      pulse: 72,
      spo2: 98,
      temp: 98.4,
      respiratoryRate: 18,
      bloodSugar: 110,
      weight: 65,
      height: 165,
      bmi: 23.9
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

  // Load Hospitals and Patient Queue from Backend Server
  const fetchQueueAndHospitals = useCallback(async () => {
    try {
      const health = await ApiService.checkHealth();
      if (health && health.status === 'HEALTHY') {
        setServerOnline(true);
        
        // Fetch active hospitals from centralized directory
        const hospRes = await ApiService.getHospitals({ limit: 100 });
        if (hospRes?.success && Array.isArray(hospRes.hospitals) && hospRes.hospitals.length > 0) {
          setHospitals(hospRes.hospitals);
        }

        // Fetch patients based on role & auth
        const queueRes = await ApiService.getPatients();
        if (queueRes?.success && Array.isArray(queueRes.patients) && queueRes.patients.length > 0) {
          setPatients(queueRes.patients);
          if (!queueRes.patients.some(p => p.id === selectedPatientId)) {
            setSelectedPatientId(queueRes.patients[0].id);
          }
        }
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    fetchQueueAndHospitals();
  }, [fetchQueueAndHospitals]);

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
    setRole('kiosk');
    fetchQueueAndHospitals();
  };

  // Automated Triage & Red-Flag Severity Calculator
  const calculateTriage = (form) => {
    const redFlags = [];
    let severityScore = 0;

    const sys = Number(form.vitals.bpSystolic);
    const dia = Number(form.vitals.bpDiastolic);
    const spo2 = Number(form.vitals.spo2);
    const pulse = Number(form.vitals.pulse);
    const temp = Number(form.vitals.temp);
    const bs = Number(form.vitals.bloodSugar);

    if (sys >= 170 || dia >= 105) {
      redFlags.push(`Critical BP Alert: Hypertensive crisis level (${sys}/${dia} mmHg)`);
      severityScore += 4;
    } else if (sys >= 145 || dia >= 95) {
      severityScore += 2;
    }

    if (spo2 <= 92) {
      redFlags.push(`Hypoxia Alert: Oxygen saturation low (${spo2}%)`);
      severityScore += 5;
    } else if (spo2 <= 95) {
      severityScore += 2;
    }

    if (pulse >= 120 || pulse <= 45) {
      redFlags.push(`Arrhythmia Alert: Extreme pulse rate (${pulse} bpm)`);
      severityScore += 3;
    }

    if (bs >= 250) {
      redFlags.push(`Hyperglycemia Alert: Random blood sugar very high (${bs} mg/dL)`);
      severityScore += 3;
    } else if (bs <= 60) {
      redFlags.push(`Hypoglycemia Alert: Blood glucose critically low (${bs} mg/dL)`);
      severityScore += 4;
    }

    // Check Symptoms & Reason for Visit
    const complaintsToCheck = [...(form.chiefComplaints || []), form.reasonForVisit || ''];
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

    if (form.painScore >= 8) {
      severityScore += 3;
    }

    // Check Allergies
    if (form.allergies.length > 0 && !form.allergies.includes('No Known Drug Allergies (NKDA)')) {
      redFlags.push(`Drug Allergy Alert: Patient allergic to ${form.allergies.join(', ')}`);
    }

    let triageLevel = 4;
    let triageCategory = 'Routine / Standard (Green)';
    let triageColor = 'green';

    if (severityScore >= 7 || redFlags.some(r => r.includes('Critical') || r.includes('Hypoxia') || r.includes('High Risk'))) {
      triageLevel = 1;
      triageCategory = 'Resuscitation / Immediate Priority';
      triageColor = 'red';
    } else if (severityScore >= 3 || redFlags.length > 0) {
      triageLevel = 3;
      triageCategory = 'Urgent (Yellow)';
      triageColor = 'amber';
    }

    return { triageLevel, triageCategory, triageColor, redFlags };
  };

  // Submit Kiosk Case to Selected Hospital & Department Queue
  const submitKioskCase = async () => {
    const { triageLevel, triageCategory, triageColor, redFlags } = calculateTriage(kioskForm);

    const tokenPrefix = kioskForm.selectedDepartmentName?.includes('Cardiology') ? 'CARD' 
      : kioskForm.selectedDepartmentName?.includes('Ortho') ? 'ORTH' 
      : kioskForm.selectedDepartmentName?.includes('Pediatric') ? 'PED' 
      : 'MED';
    const randomNum = Math.floor(100 + Math.random() * 900);
    const tokenNumber = `${tokenPrefix}-${randomNum}`;
    const newId = `patient-${Date.now().toString().slice(-6)}`;

    const primaryComplaintTitle = kioskForm.reasonForVisit || kioskForm.chiefComplaints?.[0] || kioskForm.customComplaint || 'General OPD intake';

    const newPatient = {
      id: newId,
      tokenNumber,
      hospitalId: kioskForm.selectedHospitalId || 'hosp-ggh-hyd',
      hospitalName: kioskForm.selectedHospitalName || 'Government General Hospital',
      departmentId: kioskForm.selectedDepartmentId || 'dept-ggh-hyd-genmed',
      department: kioskForm.selectedDepartmentName || 'General Medicine',
      roomNumber: kioskForm.roomNumber || 'Room 104',
      assignedDoctor: kioskForm.assignedDoctor || 'Assigned OPD Clinician',
      reasonForVisit: kioskForm.reasonForVisit || primaryComplaintTitle,
      registrationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      waitTime: triageLevel <= 2 ? 'Immediate (0-5 min)' : triageLevel === 3 ? '15-20 mins' : '30-40 mins',
      status: 'Waiting',
      caseStatus: 'Waiting for Review',
      verificationStatus: 'Pending Verification',
      verificationTimestamp: null,
      rejectionReason: null,
      triageLevel,
      triageCategory,
      triageColor,
      
      abhaId: kioskForm.abhaId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      abhaAddress: kioskForm.abhaAddress || `${(kioskForm.name || 'patient').toLowerCase().replace(/\s+/g, '')}@abdm`,
      name: kioskForm.name || 'Walk-in Patient',
      age: Number(kioskForm.age) || 42,
      gender: kioskForm.gender || 'Male',
      phone: kioskForm.phone || '+91 98765 00000',
      address: kioskForm.address || 'District Health Jurisdiction',
      language: languagesMap[language] || 'English',
      
      // 10 Comprehensive Clinical Sections
      chiefComplaints: kioskForm.chiefComplaints.length > 0 ? kioskForm.chiefComplaints : [primaryComplaintTitle],
      hpi: {
        onset: `Problem started ${kioskForm.duration || 'recently'}.`,
        location: `${kioskForm.selectedRegion || 'General'} region.`,
        character: `Patient described symptom as ${primaryComplaintTitle}.`,
        severity: `${kioskForm.painScore || 5} / 10 on numeric pain rating scale.`,
        radiation: 'Recorded during conversational intake.',
        aggravatingFactors: 'Daily activities and exertion.',
        relievingFactors: 'Rest.',
        associatedSymptoms: 'Recorded in conversation dialogue log.'
      },
      pastMedicalHistory: kioskForm.pastConditions.length > 0 ? kioskForm.pastConditions : ['No major chronic medical illness reported.'],
      pastSurgicalHistory: ['No prior major surgeries recorded during kiosk intake.'],
      currentMedications: kioskForm.currentMedications.length > 0 ? kioskForm.currentMedications : ['No regular prescription medications recorded.'],
      drugAllergies: kioskForm.allergies.length > 0 ? kioskForm.allergies : ['No Known Drug Allergies (NKDA)'],
      familyHistory: 'Non-contributory during initial intake.',
      personalHistory: 'Mixed diet, non-smoker, recorded during kiosk case-taking.',
      reviewOfSystems: {
        cardiovascular: 'Heart rate and BP recorded at kiosk.',
        respiratory: 'SpO2 saturation monitored.',
        gastrointestinal: 'No acute complaints noted.',
        neurological: 'Alert and oriented x 3.',
        musculoskeletal: 'Normal mobility.',
        genitourinary: 'Normal.'
      },
      previousInvestigations: {
        labs: [],
        ecg: 'Recorded at consultation.',
        imaging: 'None attached.'
      },

      vitals: {
        bp_systolic: kioskForm.vitals.bpSystolic,
        bp_diastolic: kioskForm.vitals.bpDiastolic,
        pulse: kioskForm.vitals.pulse,
        spo2: kioskForm.vitals.spo2,
        temp: kioskForm.vitals.temp,
        blood_sugar: kioskForm.vitals.bloodSugar
      },
      redFlags,
      documents: kioskForm.uploadedDocs,
      structuredHistory: kioskForm.structuredHistory || [],

      // AI Generated Draft for Doctor
      aiGeneratedDraft: {
        disclaimer: 'AI-generated draft — Doctor verification required. Not a final clinical diagnosis.',
        subjectiveSummary: `${kioskForm.age || 42}-year-old ${kioskForm.gender || 'patient'} presenting at ${kioskForm.selectedHospitalName} (${kioskForm.selectedDepartmentName}) with ${primaryComplaintTitle} of ${kioskForm.duration || '2-3 days'} duration.`,
        objectiveSummary: `Vitals: BP ${kioskForm.vitals.bpSystolic}/${kioskForm.vitals.bpDiastolic} mmHg, HR ${kioskForm.vitals.pulse} bpm, SpO2 ${kioskForm.vitals.spo2}%, RBS ${kioskForm.vitals.bloodSugar} mg/dL.`,
        preliminaryRiskAssessment: `Triage Priority: ${triageCategory} (ESI Level ${triageLevel}).`,
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
      
      // Structured AYUSH / Dashavidha Pariksha History
      ayushHistory: kioskForm.ayushHistory || createInitialAyushState()
    };

    // Prepend to state queue immediately
    setPatients((prev) => [newPatient, ...prev]);
    setSelectedPatientId(newId);
    
    setKioskForm((prev) => ({
      ...prev,
      generatedToken: newPatient,
      triageLevel,
      triageCategory,
      triageColor,
      redFlags
    }));

    // Post to real backend asynchronously with graceful offline fallback
    try {
      await ApiService.submitPatientIntake({
        name: newPatient.name,
        age: newPatient.age,
        gender: newPatient.gender,
        phone: newPatient.phone,
        address: newPatient.address,
        abhaId: newPatient.abhaId,
        abhaAddress: newPatient.abhaAddress,
        language: newPatient.language,
        hospitalId: newPatient.hospitalId,
        hospitalName: newPatient.hospitalName,
        departmentId: newPatient.departmentId,
        department: newPatient.department,
        reasonForVisit: newPatient.reasonForVisit,
        consentAgreed: kioskForm.consentAgreed || true,
        signatureData: kioskForm.signature,
        chiefComplaints: newPatient.chiefComplaints,
        duration: kioskForm.duration,
        painScore: kioskForm.painScore,
        onset: kioskForm.onset,
        hpi: newPatient.hpi,
        pastMedicalHistory: newPatient.pastMedicalHistory,
        pastSurgicalHistory: newPatient.pastSurgicalHistory,
        currentMedications: newPatient.currentMedications,
        drugAllergies: newPatient.drugAllergies,
        familyHistory: newPatient.familyHistory,
        personalHistory: newPatient.personalHistory,
        reviewOfSystems: newPatient.reviewOfSystems,
        vitals: newPatient.vitals,
        uploadedDocuments: newPatient.documents,
        ayushHistory: newPatient.ayushHistory
      });
    } catch (apiErr) {
      console.warn('Backend intake sync notice (saved locally in browser session):', apiErr.message);
    }

    return newPatient;
  };

  // Reset Kiosk Form for new patient
  const resetKiosk = () => {
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
        bpSystolic: 120,
        bpDiastolic: 80,
        pulse: 72,
        spo2: 98,
        temp: 98.4,
        respiratoryRate: 18,
        bloodSugar: 110,
        weight: 65,
        height: 165,
        bmi: 23.9
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

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

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
