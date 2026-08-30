import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialPatients } from '../data/initialPatients';
import { translations } from '../data/translations';
import { ApiService } from '../services/api';

const PatientContext = createContext(null);

const STORAGE_KEY = 'medimitra_patients_v2';

export const PatientProvider = ({ children }) => {
  const [role, setRole] = useState('kiosk'); // 'kiosk' | 'doctor'
  const [language, setLanguage] = useState('en'); // 'en', 'hi', 'te', 'ta', 'mr', 'bn'
  const [serverOnline, setServerOnline] = useState(false);
  
  // Persistent Patients Queue
  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('medikiosk_patients_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored patients:', e);
      }
    }
    return initialPatients;
  });

  // Active Patient for Doctor Consultation
  const [selectedPatientId, setSelectedPatientId] = useState('patient-101');

  // Kiosk In-Progress Patient State
  const [kioskStep, setKioskStep] = useState(1);
  const [kioskForm, setKioskForm] = useState({
    abhaId: '',
    abhaAddress: '',
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    address: '',
    consentAgreed: false,
    signature: '',
    selectedRegion: 'chest',
    selectedComplaintId: 'chest_pain',
    chiefComplaints: [],
    customComplaint: '',
    duration: '2 Days',
    painScore: 5,
    onset: 'Gradual',
    pastConditions: [],
    customCondition: '',
    allergies: [],
    customAllergy: '',
    currentMedications: [],
    customMedication: '',
    historyAnswers: {},
    structuredHistory: [],
    vitals: {
      bpSystolic: 128,
      bpDiastolic: 84,
      pulse: 78,
      spo2: 98,
      temp: 98.4,
      respiratoryRate: 18,
      bloodSugar: 132,
      weight: 68,
      height: 168,
      bmi: 24.1
    },
    uploadedDocs: [],
    activeOcrDoc: null,
    triageLevel: 3,
    triageCategory: 'Urgent (Yellow)',
    triageColor: 'yellow',
    redFlags: [],
    assignedDepartment: 'General Medicine',
    assignedDoctor: 'Dr. Rajesh Sharma, MD (Med)',
    roomNumber: 'Room 104',
    generatedToken: null
  });

  // Fetch initial patient data from Backend Server on mount
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        const health = await ApiService.checkHealth();
        if (health && health.status === 'HEALTHY') {
          setServerOnline(true);
          const queueRes = await ApiService.getPatients();
          if (queueRes && queueRes.success && Array.isArray(queueRes.patients) && queueRes.patients.length > 0) {
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
    };

    syncWithBackend();
  }, []);

  // Persist patients to localStorage for offline resilience
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }, [patients]);

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

    // Check Symptoms
    form.chiefComplaints.forEach((comp) => {
      const lower = comp.toLowerCase();
      if (lower.includes('crushing chest') || lower.includes('radiating') || lower.includes('worst headache') || lower.includes('blood in') || lower.includes('syncope') || lower.includes('blackout')) {
        redFlags.push(`High Risk Symptom: ${comp}`);
        severityScore += 4;
      } else if (lower.includes('cough for > 2 weeks') || lower.includes('tb screening') || lower.includes('> 2 weeks')) {
        redFlags.push(`Infectious Disease Surveillance: Suspected TB`);
        severityScore += 2;
      } else {
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

  // Submit Kiosk Case to Doctor Queue (Syncs with real backend)
  const submitKioskCase = async () => {
    const { triageLevel, triageCategory, triageColor, redFlags } = calculateTriage(kioskForm);

    const tokenPrefix = kioskForm.selectedRegion === 'chest' ? 'MED' : kioskForm.selectedRegion === 'lungs' ? 'PUL' : kioskForm.selectedRegion === 'joints' ? 'ORT' : 'OPD';
    const randomNum = Math.floor(100 + Math.random() * 900);
    const tokenNumber = `${tokenPrefix}-${randomNum}`;
    const newId = `patient-${Date.now().toString().slice(-6)}`;

    const primaryComplaintTitle = kioskForm.chiefComplaints?.[0] || kioskForm.customComplaint || 'General OPD intake';

    const newPatient = {
      id: newId,
      tokenNumber,
      roomNumber: kioskForm.roomNumber || 'Room 104',
      department: kioskForm.assignedDepartment || 'General Medicine',
      assignedDoctor: kioskForm.assignedDoctor || 'Dr. Rajesh Sharma, MD (Med)',
      registrationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      waitTime: triageLevel <= 2 ? 'Immediate (0-5 min)' : triageLevel === 3 ? '15-20 mins' : '30-40 mins',
      status: 'Waiting',
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
        subjectiveSummary: `${kioskForm.age || 42}-year-old ${kioskForm.gender || 'patient'} presenting with ${primaryComplaintTitle} of ${kioskForm.duration || '2-3 days'} duration.`,
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
      }
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
        uploadedDocuments: newPatient.documents
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
      gender: 'Male',
      phone: '',
      address: '',
      consentAgreed: false,
      signature: '',
      selectedRegion: 'chest',
      selectedComplaintId: 'chest_pain',
      chiefComplaints: [],
      customComplaint: '',
      duration: '2 Days',
      painScore: 5,
      onset: 'Gradual',
      pastConditions: [],
      customCondition: '',
      allergies: [],
      customAllergy: '',
      currentMedications: [],
      customMedication: '',
      historyAnswers: {},
      structuredHistory: [],
      vitals: {
        bpSystolic: 128,
        bpDiastolic: 84,
        pulse: 78,
        spo2: 98,
        temp: 98.4,
        respiratoryRate: 18,
        bloodSugar: 132,
        weight: 68,
        height: 168,
        bmi: 24.1
      },
      uploadedDocs: [],
      activeOcrDoc: null,
      triageLevel: 3,
      triageCategory: 'Urgent (Yellow)',
      triageColor: 'yellow',
      redFlags: [],
      assignedDepartment: 'General Medicine',
      assignedDoctor: 'Dr. Rajesh Sharma, MD (Med)',
      roomNumber: 'Room 104',
      generatedToken: null
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
        speakText
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
