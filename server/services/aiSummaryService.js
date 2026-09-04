/**
 * MediMitra Assistive Clinical Summary Generator
 * 
 * Safety Directives:
 * 1. AI output is strictly an assistive draft and MUST NOT be presented as a final diagnosis.
 * 2. Every output carries a clear disclaimer requiring doctor verification.
 * 3. Integrates with modular LLM provider or local deterministic medical NLP parser.
 */
export const generateAssistiveSummary = ({
  patientName = 'Patient',
  age = null,
  gender = 'Unknown',
  chiefComplaints = [],
  duration = 'Not specified',
  painScore = 0,
  onset = '',
  hpi = {},
  vitals = {},
  pastMedicalHistory = [],
  pastSurgicalHistory = [],
  currentMedications = [],
  drugAllergies = [],
  familyHistory = '',
  personalHistory = '',
  ayushHistory = null
}) => {
  const complaintsList = Array.isArray(chiefComplaints) ? chiefComplaints.join(', ') : String(chiefComplaints);
  const hasVitalsData = Boolean(
    (vitals.bp_systolic || vitals.bpSystolic) ||
    (vitals.bp_diastolic || vitals.bpDiastolic) ||
    vitals.pulse ||
    vitals.spo2 ||
    vitals.temp ||
    (vitals.blood_sugar || vitals.bloodSugar)
  );

  let vitalsSummary = 'Not recorded during intake';
  if (hasVitalsData) {
    const vParts = [];
    if (vitals.bp_systolic || vitals.bpSystolic) {
      vParts.push(`BP: ${vitals.bp_systolic || vitals.bpSystolic}/${vitals.bp_diastolic || vitals.bpDiastolic || '--'} mmHg`);
    } else {
      vParts.push('BP: Not recorded');
    }
    if (vitals.pulse) {
      vParts.push(`Pulse: ${vitals.pulse} bpm`);
    } else {
      vParts.push('Pulse: Not recorded');
    }
    if (vitals.spo2) {
      vParts.push(`SpO2: ${vitals.spo2}%`);
    } else {
      vParts.push('SpO2: Not recorded');
    }
    if (vitals.temp) {
      vParts.push(`Temp: ${vitals.temp}°F`);
    }
    if (vitals.blood_sugar || vitals.bloodSugar) {
      vParts.push(`RBS: ${vitals.blood_sugar || vitals.bloodSugar} mg/dL`);
    }
    vitalsSummary = vParts.join(', ');
  }
  
  const complaintsStr = complaintsList.toLowerCase();
  
  let riskAssessment = 'Routine / Standard OPD presentation.';
  let differential = ['Clinical evaluation recommended by attending physician'];
  let nextSteps = ['Doctor clinical examination', 'Routine vitals confirmation'];

  if (complaintsStr.includes('chest pain') || complaintsStr.includes('angina')) {
    riskAssessment = 'HIGH RISK: Acute presentation concerning for ischemic coronary pathology or hypertensive urgency.';
    differential = [
      'Acute Coronary Syndrome (STEMI / NSTEMI)',
      'Unstable Angina Pectoris',
      'Hypertensive Urgency / Emergency',
      'Gastroesophageal Reflux Disease (GERD) with esophageal spasm',
      'Costochondritis / Musculoskeletal Chest Wall Pain'
    ];
    nextSteps = [
      'STAT 12-Lead Electrocardiogram (ECG) within 10 minutes',
      'Cardiac Troponin I / T and CK-MB levels',
      'Continuous Pulse Oximetry and Blood Pressure monitoring',
      'Consultation with On-duty Cardiologist / Emergency Medical Officer'
    ];
  } else if (complaintsStr.includes('fever') || complaintsStr.includes('chills')) {
    riskAssessment = 'MODERATE RISK: Acute febrile syndrome requiring vector-borne and systemic infectious screening.';
    differential = [
      'Acute Vector-Borne Infection (Dengue / Chikungunya / Malaria)',
      'Acute Viral Pyrexia / Influenza',
      'Enteric Fever (Salmonella Typhi)',
      'Urinary Tract Infection (UTI) with systemic response'
    ];
    nextSteps = [
      'Complete Blood Count (CBC) with Platelet count and Hematocrit',
      'Dengue NS1 Antigen & IgM/IgG Serology',
      'Peripheral Smear for Malarial Parasites (MP)',
      'Urine Routine & Microscopic Examination'
    ];
  } else if (complaintsStr.includes('headache')) {
    riskAssessment = 'MODERATE RISK: Cranial discomfort requiring neurological and blood pressure assessment.';
    differential = [
      'Tension-Type Headache',
      'Migraine without Aura',
      'Hypertension-Associated Cephalea',
      'Secondary headache (rule out intracranial red flags)'
    ];
    nextSteps = [
      'Fundoscopic and Cranial Nerve examination',
      'Serial BP measurement',
      'Non-contrast CT Brain if thunderclap onset or focal neurological signs present'
    ];
  } else if (complaintsStr.includes('abdominal')) {
    riskAssessment = 'MODERATE RISK: Acute abdominal discomfort requiring surgical abdomen rule-out.';
    differential = [
      'Acute Gastritis / Peptic Ulcer Disease',
      'Acute Appendicitis',
      'Acute Cholecystitis / Biliary Colic',
      'Acute Gastroenteritis'
    ];
    nextSteps = [
      'Abdominal Palpation for rebound tenderness / Guarding',
      'Ultrasound Abdomen & Pelvis',
      'Serum Amylase & Lipase, Liver Function Tests (LFT)'
    ];
  } else if (complaintsStr.includes('cough') || complaintsStr.includes('breathless')) {
    riskAssessment = 'MODERATE RISK: Respiratory tract symptoms requiring pulmonary assessment.';
    differential = [
      'Acute Bronchitis / Viral Upper Respiratory Tract Infection',
      'Bronchial Asthma / COPD Exacerbation',
      'Community-Acquired Pneumonia',
      'Pulmonary Tuberculosis (if chronic > 2 weeks in endemic setting)'
    ];
    nextSteps = [
      'Chest Auscultation for wheezing, crepitations or bronchial breath sounds',
      'Chest X-Ray (PA View)',
      'Sputum examination for Acid-Fast Bacilli (AFB) if indicated'
    ];
  }

  let hpiDetails = '';
  if (hpi && typeof hpi === 'object' && Object.keys(hpi).length > 0) {
    hpiDetails = `HPI: ${Object.entries(hpi).map(([k, v]) => `${k}: ${v}`).join(', ')}. `;
  }

  let pmhSummary = '';
  if (Array.isArray(pastMedicalHistory) && pastMedicalHistory.length > 0) {
    const isExplicitNone = pastMedicalHistory.some(m => typeof m === 'string' && m.toLowerCase().includes('none'));
    if (isExplicitNone && pastMedicalHistory.length === 1) {
      pmhSummary = 'Past medical history: No chronic conditions reported by patient.';
    } else {
      pmhSummary = `Past medical history notable for ${pastMedicalHistory.join(', ')}.`;
    }
  } else {
    pmhSummary = 'Past medical history: Not recorded during intake.';
  }

  let allergySummary = '';
  if (Array.isArray(drugAllergies) && drugAllergies.length > 0) {
    const isExplicitNkda = drugAllergies.some(a => typeof a === 'string' && (a.includes('NKDA') || a.toLowerCase().includes('no known')));
    if (isExplicitNkda && drugAllergies.length === 1) {
      allergySummary = ' Drug allergies: No known drug allergies (NKDA) reported by patient.';
    } else {
      allergySummary = ` ⚠️ Known Drug Allergies: ${drugAllergies.join(', ')}.`;
    }
  } else {
    allergySummary = ' Drug allergies: Not recorded during intake (verification required).';
  }

  let medSummary = '';
  if (Array.isArray(currentMedications) && currentMedications.length > 0) {
    const isExplicitNone = currentMedications.some(m => typeof m === 'string' && m.toLowerCase().includes('none'));
    if (isExplicitNone && currentMedications.length === 1) {
      medSummary = ' Current medications: No regular medications reported by patient.';
    } else {
      medSummary = ` Current medications: ${currentMedications.join(', ')}.`;
    }
  } else {
    medSummary = ' Current medications: Not recorded during intake.';
  }

  let subjectiveSummary = `${age ? `${age}-year-old` : 'Adult'} ${(gender || 'patient').toLowerCase()} presenting with ${duration} of ${complaintsList}. ${onset ? `Onset: ${onset}. ` : ''}${painScore > 0 ? `Reported pain severity: ${painScore}/10. ` : ''}${hpiDetails}${pmhSummary}${medSummary}`;
  let objectiveSummary = `Vitals: ${vitalsSummary}.${allergySummary}`;

  let ayushSummary = null;
  if (ayushHistory) {
    const isAyushCase = Boolean(
      ayushHistory.metadata?.isAyushCase ||
      ayushHistory.isAyushCase ||
      ayushHistory.dashavidhaPariksha ||
      ayushHistory.additionalHistory ||
      ayushHistory.isSkipped ||
      ayushHistory.skipAyushAssessment
    );

    if (ayushHistory.isSkipped || ayushHistory.skipAyushAssessment) {
      ayushSummary = {
        status: 'Skipped by Patient',
        disclaimer: 'AYUSH self-reported intake was skipped by the patient at the kiosk. Complete Dashavidha Pariksha and clinical assessment will be conducted by the attending AYUSH clinician in the OPD.'
      };
      subjectiveSummary += ` [AYUSH Intake: Skipped by patient at kiosk; pending clinician examination.]`;
    } else if (isAyushCase) {
      const dp = ayushHistory.dashavidhaPariksha || {};
      const ah = ayushHistory.additionalHistory || {};

      const hasReportedPrakriti = Boolean(dp.prakriti?.bodyFrame || dp.prakriti?.thermalPreference || dp.prakriti?.skinNature);
      const hasReportedAgni = Boolean(ah.agni);
      const hasReportedKoshtha = Boolean(ah.koshtha);
      const hasReportedVikriti = Boolean(Array.isArray(dp.vikriti?.primaryImbalanceSymptoms) && dp.vikriti.primaryImbalanceSymptoms.length > 0);
      const hasReportedAhara = Boolean(ah.ahara?.dietType);
      const hasReportedVihara = Boolean(ah.vihara?.wakeTime || ah.vihara?.sleepTime || ah.vihara?.stressLevel);
      const hasReportedNidana = Boolean(ah.nidana?.patientReportedTriggers);
      const hasReportedSamprapti = Boolean(ah.samprapti?.patientReportedProgression);

      const hasAnyPatientAyushData = hasReportedPrakriti || hasReportedAgni || hasReportedKoshtha || hasReportedVikriti || hasReportedAhara || hasReportedVihara || hasReportedNidana || hasReportedSamprapti;

      if (!hasAnyPatientAyushData) {
        ayushSummary = {
          status: 'Not recorded during patient intake',
          disclaimer: 'AYUSH self-reported intake was not recorded during patient intake. Complete Dashavidha Pariksha and clinical assessment will be conducted by the attending AYUSH clinician in the OPD.'
        };
        subjectiveSummary += ` [AYUSH Intake: Not recorded during patient intake; pending clinician examination.]`;
      } else {
        const prakritiParts = [];
        if (dp.prakriti?.bodyFrame) prakritiParts.push(`Body frame: ${dp.prakriti.bodyFrame}`);
        if (dp.prakriti?.thermalPreference) prakritiParts.push(`Thermal preference: ${dp.prakriti.thermalPreference}`);
        if (dp.prakriti?.skinNature) prakritiParts.push(`Skin: ${dp.prakriti.skinNature}`);
        const prakritiTraits = prakritiParts.length > 0 ? prakritiParts.join(', ') : 'Not recorded during patient intake';

        const agniStatus = ah.agni || 'Not recorded during patient intake';
        const koshthaStatus = ah.koshtha || 'Not recorded during patient intake';
        const reportedImbalance = (Array.isArray(dp.vikriti?.primaryImbalanceSymptoms) && dp.vikriti.primaryImbalanceSymptoms.length > 0)
          ? dp.vikriti.primaryImbalanceSymptoms.join('; ')
          : 'Pending clinician examination';

        const dietType = ah.ahara?.dietType || 'Not recorded during patient intake';
        const viharaParts = [];
        if (ah.vihara?.wakeTime) viharaParts.push(`Wake: ${ah.vihara.wakeTime}`);
        if (ah.vihara?.sleepTime) viharaParts.push(`Sleep: ${ah.vihara.sleepTime}`);
        if (ah.vihara?.stressLevel) viharaParts.push(`Stress: ${ah.vihara.stressLevel}`);
        const viharaStatus = viharaParts.length > 0 ? viharaParts.join(', ') : 'Not recorded during patient intake';

        ayushSummary = {
          patient_reported_prakriti_traits: prakritiTraits,
          digestive_fire_agni: agniStatus,
          bowel_tendency_koshtha: koshthaStatus,
          reported_imbalance_vikriti: reportedImbalance,
          diet_regimen_ahara: dietType,
          lifestyle_regimen_vihara: viharaStatus,
          causative_triggers_nidana: ah.nidana?.patientReportedTriggers || 'Not recorded during patient intake',
          disease_progression_samprapti: ah.samprapti?.patientReportedProgression || 'Not recorded during patient intake',
          disclaimer: 'Patient-reported AYUSH observations — Dosha Prakriti, Dhatu Sara, and Ayurvedic therapeutic plan must be verified by a registered AYUSH/Ayurvedic clinician.'
        };

        const ayushReportedPhrases = [];
        if (prakritiParts.length > 0) ayushReportedPhrases.push(`Prakriti traits: ${prakritiTraits}`);
        if (ah.agni) ayushReportedPhrases.push(`Agni: ${ah.agni}`);
        if (ah.koshtha) ayushReportedPhrases.push(`Koshtha: ${ah.koshtha}`);
        if (Array.isArray(dp.vikriti?.primaryImbalanceSymptoms) && dp.vikriti.primaryImbalanceSymptoms.length > 0) {
          ayushReportedPhrases.push(`Reported Vikriti: ${reportedImbalance}`);
        }
        if (ah.nidana?.patientReportedTriggers) ayushReportedPhrases.push(`Causative Triggers: ${ah.nidana.patientReportedTriggers}`);

        subjectiveSummary += ` [Patient-Reported AYUSH Intake: ${ayushReportedPhrases.join('. ')}.]`;
      }
    }
  }

  return {
    subjective_summary: subjectiveSummary,
    objective_summary: objectiveSummary,
    preliminary_risk_assessment: riskAssessment,
    differential_diagnosis: differential,
    suggested_next_steps: nextSteps,
    ayush_summary: ayushSummary,
    disclaimer: 'AI-generated draft — requires clinician verification. Not a final clinical diagnosis.',
    is_ai_draft: 1,
    clinician_verified: 0
  };
};
