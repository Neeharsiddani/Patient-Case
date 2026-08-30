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
  age = 30,
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
  personalHistory = ''
}) => {
  const complaintsList = Array.isArray(chiefComplaints) ? chiefComplaints.join(', ') : String(chiefComplaints);
  const vitalsSummary = `BP: ${vitals.bp_systolic || '--'}/${vitals.bp_diastolic || '--'} mmHg, Pulse: ${vitals.pulse || '--'} bpm, SpO2: ${vitals.spo2 || '--'}%, Temp: ${vitals.temp || '--'}°F, RBS: ${vitals.blood_sugar || '--'} mg/dL`;
  
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

  const subjectiveSummary = `${age}-year-old ${gender.toLowerCase()} presenting with ${duration} of ${complaintsList}. ${onset ? `Onset: ${onset}. ` : ''}${painScore > 0 ? `Reported pain severity: ${painScore}/10. ` : ''}${Array.isArray(pastMedicalHistory) && pastMedicalHistory.length > 0 ? `Past medical history notable for ${pastMedicalHistory.join(', ')}.` : 'No significant past chronic illness reported.'}`;
  const objectiveSummary = `Vitals: ${vitalsSummary}.${Array.isArray(drugAllergies) && drugAllergies.length > 0 ? ` ⚠️ Known Drug Allergies: ${drugAllergies.join(', ')}.` : ' No known drug allergies documented.'}`;

  return {
    subjective_summary: subjectiveSummary,
    objective_summary: objectiveSummary,
    preliminary_risk_assessment: riskAssessment,
    differential_diagnosis: differential,
    suggested_next_steps: nextSteps,
    disclaimer: 'AI-generated draft — requires clinician verification. Not a final clinical diagnosis.',
    is_ai_draft: 1,
    clinician_verified: 0
  };
};
