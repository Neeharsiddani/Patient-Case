export const bodyRegions = [
  { id: 'chest', name: 'Chest & Heart', icon: 'Heart', desc: 'Chest pain, tightness, palpitation, breathlessness' },
  { id: 'lungs', name: 'Lungs & Breathing', icon: 'Wind', desc: 'Cough, wheezing, sputum, TB symptoms' },
  { id: 'head', name: 'Head, Neck & Brain', icon: 'Brain', desc: 'Headache, dizziness, vision blur, fever' },
  { id: 'abdomen', name: 'Stomach & Digestion', icon: 'Activity', desc: 'Abdominal pain, acidity, vomiting, jaundice' },
  { id: 'joints', name: 'Joints & Bones', icon: 'Bone', desc: 'Joint swelling, back pain, arthritis, fracture' },
  { id: 'urinary', name: 'Kidney & Urinary', icon: 'Droplets', desc: 'Burning urine, swelling in feet, flank pain' },
  { id: 'general', name: 'General & Metabolic', icon: 'Thermometer', desc: 'High fever, weight loss, extreme fatigue, rash' }
];

export const symptomsByRegion = {
  chest: [
    { id: 'chest_pain_radiating', name: 'Crushing chest pain radiating to left arm/jaw', redFlag: true, severity: 'High', triageScore: 4 },
    { id: 'palpitations', name: 'Rapid/Irregular heart beats (Palpitations)', redFlag: false, severity: 'Medium', triageScore: 2 },
    { id: 'orthopnea', name: 'Severe breathlessness lying flat in bed', redFlag: true, severity: 'High', triageScore: 4 },
    { id: 'chest_heaviness', name: 'Mild chest tightness after walking or stairs', redFlag: false, severity: 'Medium', triageScore: 3 },
    { id: 'edema', name: 'Bilateral ankle/feet swelling (Pitting Edema)', redFlag: false, severity: 'Medium', triageScore: 2 }
  ],
  lungs: [
    { id: 'cough_2weeks', name: 'Chronic cough for > 2 weeks (TB Screening indicator)', redFlag: true, severity: 'High', triageScore: 3 },
    { id: 'hemoptysis', name: 'Coughing up blood streaks in sputum', redFlag: true, severity: 'High', triageScore: 5 },
    { id: 'wheezing_asthma', name: 'Acute wheezing and difficulty breathing', redFlag: false, severity: 'Medium', triageScore: 3 },
    { id: 'productive_cough', name: 'Yellowish thick phlegm with mild fever', redFlag: false, severity: 'Low', triageScore: 1 }
  ],
  head: [
    { id: 'thunderclap_headache', name: 'Sudden "Worst headache of life" with neck stiffness', redFlag: true, severity: 'High', triageScore: 5 },
    { id: 'facial_droop', name: 'Sudden weakness in one side of body or speech difficulty', redFlag: true, severity: 'High', triageScore: 5 },
    { id: 'migraine', name: 'Throbbing one-sided headache with light sensitivity', redFlag: false, severity: 'Medium', triageScore: 2 },
    { id: 'vertigo', name: 'Spinning sensation (Vertigo) on changing head posture', redFlag: false, severity: 'Low', triageScore: 1 },
    { id: 'fever_chills', name: 'High grade fever with chills & rigors (>102°F)', redFlag: false, severity: 'Medium', triageScore: 2 }
  ],
  abdomen: [
    { id: 'acute_right_iliac', name: 'Severe sharp pain in right lower abdomen (Appendicitis risk)', redFlag: true, severity: 'High', triageScore: 4 },
    { id: 'hematemesis', name: 'Coffee-ground or red blood in vomiting (GI bleed)', redFlag: true, severity: 'High', triageScore: 5 },
    { id: 'burning_epigastric', name: 'Severe burning sensation in upper stomach & acid reflux', redFlag: false, severity: 'Low', triageScore: 1 },
    { id: 'diarrhea_vomiting', name: 'Watery loose motions > 5 times/day & dehydration', redFlag: false, severity: 'Medium', triageScore: 2 },
    { id: 'jaundice_eyes', name: 'Yellow discoloration of eyes & dark urine', redFlag: false, severity: 'Medium', triageScore: 3 }
  ],
  joints: [
    { id: 'knee_oa', name: 'Severe knee pain while standing/climbing stairs (OA)', redFlag: false, severity: 'Low', triageScore: 1 },
    { id: 'acute_swollen_hot_joint', name: 'Sudden hot, red, extremely swollen single joint (Septic/Gout)', redFlag: true, severity: 'High', triageScore: 4 },
    { id: 'lumbar_sciatica', name: 'Lower back pain radiating down the leg (Sciatica)', redFlag: false, severity: 'Medium', triageScore: 2 },
    { id: 'morning_stiffness', name: 'Small finger joint stiffness lasting > 1 hour', redFlag: false, severity: 'Low', triageScore: 2 }
  ],
  urinary: [
    { id: 'dysuria', name: 'Burning sensation and frequency while passing urine', redFlag: false, severity: 'Low', triageScore: 1 },
    { id: 'gross_hematuria', name: 'Red/Brown blood in urine without pain', redFlag: true, severity: 'High', triageScore: 4 },
    { id: 'anuria_oliguria', name: 'Severe reduction in urine output < 400ml/day + facial puffiness', redFlag: true, severity: 'High', triageScore: 4 },
    { id: 'renal_colic', name: 'Excruciating spasm pain from loin to groin (Kidney stone)', redFlag: false, severity: 'Medium', triageScore: 3 }
  ],
  general: [
    { id: 'syncope', name: 'Sudden blackout or loss of consciousness (Syncope)', redFlag: true, severity: 'High', triageScore: 5 },
    { id: 'unexplained_weightloss', name: 'Significant unexplained weight loss > 5kg in 1 month', redFlag: false, severity: 'Medium', triageScore: 2 },
    { id: 'extreme_fatigue', name: 'Severe generalized weakness, dizziness and pale skin (Anemia)', redFlag: false, severity: 'Low', triageScore: 1 },
    { id: 'fever_rash', name: 'Fever with skin petechial purpuric rash (Dengue warning)', redFlag: true, severity: 'High', triageScore: 4 }
  ]
};

export const commonPastConditions = [
  'Type 2 Diabetes Mellitus (T2DM)',
  'Essential Hypertension (HTN)',
  'Coronary Artery Disease (CAD)',
  'Bronchial Asthma / COPD',
  'Pulmonary Tuberculosis (Completed AKT)',
  'Hypothyroidism',
  'Chronic Kidney Disease (CKD)',
  'Past CABG / Angioplasty (PTCA)',
  'Previous Cholecystectomy',
  'Previous Appendectomy'
];

export const commonAllergies = [
  'Penicillin / Amoxicillin',
  'Sulfa Drugs (Cotrimoxazole)',
  'NSAIDs (Diclofenac / Ibuprofen)',
  'Cephalosporins',
  'Ciprofloxacin / Fluoroquinolones',
  'Contrast Dye',
  'No Known Drug Allergies (NKDA)'
];

export const standardHospitalDocuments = [
  {
    id: 'doc-aiims-cbc-01',
    title: 'AIIMS New Delhi - Pathology Lab CBC & Renal Report',
    date: '2026-06-12',
    hospital: 'All India Institute of Medical Sciences (AIIMS)',
    type: 'Lab Test Report',
    ocrConfidence: 96,
    extractedData: {
      patientName: 'Ramesh Kumar Verma',
      ageGender: '54Y / Male',
      recordDate: '12-Jun-2026',
      hb: '9.8 g/dL (Low - Anemia)',
      wbc: '11,400 /mcL (Elevated)',
      platelets: '1.85 Lakhs /mcL',
      fastingBloodSugar: '198 mg/dL (High)',
      hba1c: '8.9 % (Uncontrolled Diabetes)',
      serumCreatinine: '1.6 mg/dL (Borderline High)',
      urea: '42 mg/dL',
      keyFindings: 'Microcytic hypochromic anemia with uncontrolled diabetes mellitus type 2 and mild renal impairment.'
    }
  },
  {
    id: 'doc-apollo-rx-02',
    title: 'District Civil Hospital - OPD Cardiology Prescription Slip',
    date: '2026-04-18',
    hospital: 'District Civil Hospital, General Medicine OPD',
    type: 'Prescription Slip',
    ocrConfidence: 93,
    extractedData: {
      patientName: 'Sunita Devi',
      ageGender: '61Y / Female',
      recordDate: '18-Apr-2026',
      bloodPressureRecorded: '168/98 mmHg',
      diagnoses: 'Grade II Essential Hypertension, Dyslipidemia',
      medicationsExtracted: [
        'Tab. Telmisartan 40mg (1-0-0) After Breakfast',
        'Tab. Amlodipine 5mg (0-0-1) At Bedtime',
        'Tab. Atorvastatin 20mg (0-0-1) Night',
        'Tab. Ecosprin 75mg (0-1-0) After Lunch'
      ],
      doctorAdvice: 'Low salt diet (< 5g/day), brisk walking 30 mins, repeat ECG & Lipid Profile in 3 months.'
    }
  },
  {
    id: 'doc-discharge-03',
    title: 'Govt Medical College Hospital - Inpatient Discharge Summary',
    date: '2025-11-05',
    hospital: 'Govt Medical College & Hospital',
    type: 'Discharge Summary',
    ocrConfidence: 98,
    extractedData: {
      admissionDiagnosis: 'Acute Exacerbation of Bronchial Asthma / LRTI',
      dischargeCondition: 'Hemodynamically Stable, Chest Cleared on Auscultation',
      proceduresDone: 'Nebulization, IV Hydrocortisone, Oxygen therapy 2L/min',
      dischargeMedications: [
        'Inhaler Budecort 200mcg (2 puffs BID)',
        'Inhaler Asthalin 100mcg (PRN SOS)',
        'Tab. Montelukast 10mg + Levocetirizine 5mg (0-0-1)'
      ]
    }
  }
];


export const icd10Suggestions = [
  { code: 'I10', name: 'Essential (primary) hypertension' },
  { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications' },
  { code: 'I20.9', name: 'Angina pectoris, unspecified' },
  { code: 'J45.909', name: 'Unspecified asthma, uncomplicated' },
  { code: 'J06.9', name: 'Acute upper respiratory infection, unspecified' },
  { code: 'A09', name: 'Infectious gastroenteritis and colitis, unspecified' },
  { code: 'M17.9', name: 'Osteoarthritis of knee, unspecified' },
  { code: 'K21.9', name: 'Gastro-esophageal reflux disease without esophagitis' },
  { code: 'N39.0', name: 'Urinary tract infection, site not specified' },
  { code: 'R07.9', name: 'Chest pain, unspecified' }
];

export const commonHospitalDrugs = [
  { name: 'Tab. Paracetamol', strength: '650 mg', freq: '1-0-1 (SOS/After Food)', duration: '5 days', instructions: 'For fever or mild pain' },
  { name: 'Tab. Pantoprazole', strength: '40 mg', freq: '1-0-0 (Empty Stomach)', duration: '14 days', instructions: 'Take 30 min before morning tea' },
  { name: 'Tab. Metformin SR', strength: '500 mg', freq: '1-0-1 (After Meals)', duration: '30 days', instructions: 'For diabetes control' },
  { name: 'Tab. Telmisartan', strength: '40 mg', freq: '1-0-0 (Morning)', duration: '30 days', instructions: 'Check BP weekly' },
  { name: 'Tab. Amlodipine', strength: '5 mg', freq: '0-0-1 (Bedtime)', duration: '30 days', instructions: 'For hypertension' },
  { name: 'Tab. Amoxicillin + Potassium Clavulanate', strength: '625 mg', freq: '1-0-1 (After Food)', duration: '5 days', instructions: 'Complete full antibiotic course' },
  { name: 'Tab. Azithromycin', strength: '500 mg', freq: '1-0-0 (After Lunch)', duration: '3 days', instructions: 'Take once daily' },
  { name: 'Tab. Atorvastatin', strength: '10 mg', freq: '0-0-1 (Night)', duration: '30 days', instructions: 'Cholesterol management' },
  { name: 'Tab. Cetirizine', strength: '10 mg', freq: '0-0-1 (Bedtime)', duration: '5 days', instructions: 'For allergy/cold' },
  { name: 'Syp. Cough Relief (Ambroxol + Terbutaline)', strength: '100 ml', freq: '5ml TDS', duration: '5 days', instructions: 'Shake well before use' }
];

export const commonDiagnosticTests = [
  'Complete Blood Count (CBC) with ESR',
  '12-Lead Electrocardiogram (ECG)',
  'Fasting & Post-Prandial Blood Sugar (FBS/PPBS)',
  'Glycated Hemoglobin (HbA1c)',
  'Kidney Function Test (Serum Creatinine, Blood Urea, Electrolytes)',
  'Liver Function Test (SGOT, SGPT, Bilirubin, Alk Phos)',
  'Lipid Profile (Total Cholesterol, Triglycerides, LDL, HDL)',
  'Chest X-Ray PA View',
  'Ultrasonography (USG) Whole Abdomen',
  'Urine Routine & Microscopic Examination',
  'Thyroid Profile (Free T3, Free T4, TSH)'
];
