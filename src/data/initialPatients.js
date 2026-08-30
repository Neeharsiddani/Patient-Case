export const initialPatients = [
  {
    id: 'PAT-101',
    tokenNumber: 'MED-101',
    roomNumber: 'Room 104',
    department: 'General Medicine & Cardiology',
    assignedDoctor: 'Dr. Rajesh Sharma, MD (Med)',
    registrationTime: '08:45 AM',
    waitTime: '5 mins',
    status: 'Waiting', // 'Waiting' | 'History Verified' | 'In-Consultation' | 'Completed' | 'Rejected'
    verificationStatus: 'Pending Verification', // 'Pending Verification' | 'History Verified' | 'Rejected'
    verificationTimestamp: null,
    rejectionReason: null,
    triageLevel: 2,
    triageCategory: 'Emergent (Red Flag)',
    triageColor: 'red',
    
    // Demographics
    abhaId: '91-8472-9182-3451',
    abhaAddress: 'ramesh.verma@abdm',
    name: 'Ramesh Kumar Verma',
    age: 54,
    gender: 'Male',
    phone: '+91 98765 43210',
    address: 'Sector 4, Rohini, New Delhi',
    language: 'Hindi',
    
    // 1. Chief Complaint
    chiefComplaints: [
      'Crushing chest pain radiating to left arm and jaw (Onset: 6 hours ago)',
      'Shortness of breath on mild exertion',
      'Profuse cold sweating & nausea'
    ],

    // 2. History of Present Illness (HPI)
    hpi: {
      onset: 'Sudden onset 6 hours ago following a morning brisk walk.',
      location: 'Substernal / retrosternal central chest.',
      character: 'Severe crushing, heavy tightness as if a heavy weight is placed on the chest.',
      severity: '8 / 10 on visual numeric pain rating scale.',
      radiation: 'Radiating to left shoulder, medial aspect of left arm, and lower jaw.',
      aggravatingFactors: 'Walking, stair climbing, deep inspiration.',
      relievingFactors: 'Partial temporary relief with complete rest; no relief with antacid.',
      associatedSymptoms: 'Diaphoresis (cold clammy sweats), nausea, mild lightheadedness without syncope.'
    },

    // 3. Past Medical History
    pastMedicalHistory: [
      'Essential Hypertension (Grade II) — Diagnosed 2018 (8 years, on irregular Telmisartan)',
      'Type 2 Diabetes Mellitus — Diagnosed 2021 (5 years, on Metformin 500mg)',
      'Dyslipidemia — Elevated LDL and Triglycerides (2025)'
    ],

    // 4. Past Surgical History
    pastSurgicalHistory: [
      'Laparoscopic Cholecystectomy in 2024 at Govt Medical College Hospital (Uneventful recovery)',
      'No prior cardiac catheterization or stent placement'
    ],

    // 5. Current Medications
    currentMedications: [
      'Tab. Telmisartan 40mg (1-0-0) — Taken inconsistently',
      'Tab. Metformin 500mg (1-0-1) — After lunch and dinner',
      'Tab. Atorvastatin 20mg (0-0-1) — Night',
      'Tab. Ecosprin 75mg (0-1-0) — Post lunch'
    ],

    // 6. Drug Allergies
    drugAllergies: [
      'Penicillin / Amoxicillin (Causes widespread urticarial rash & facial angioedema — Severe)'
    ],

    // 7. Family History
    familyHistory: 'Father suffered fatal Acute Myocardial Infarction at age 56. Mother is 78 with Type 2 Diabetes and Hypertension.',

    // 8. Personal / Social History
    personalHistory: 'Smoker (10 pack-years, quit 2 years ago). Non-alcoholic. Mixed diet with high refined carbohydrates and salt intake. Sedentary office worker.',

    // 9. Review of Systems (ROS)
    reviewOfSystems: {
      cardiovascular: 'Chest pain radiating to left arm, palpitation, orthopnea on 2 pillows.',
      respiratory: 'Shortness of breath on walking; no hemoptysis, no chronic cough.',
      gastrointestinal: 'Mild nausea without vomiting; no hematemesis or melena.',
      neurological: 'Dizziness and lightheadedness; no syncope, no limb weakness or facial droop.',
      musculoskeletal: 'No focal joint swelling; bilateral mild pitting ankle edema.',
      genitourinary: 'Normal urine output, no dysuria or hematuria.'
    },

    // 10. Previous Investigations
    previousInvestigations: {
      labs: [
        { test: 'Fasting Blood Sugar (FBS)', value: '198 mg/dL', refRange: '70 - 100', isAbnormal: true },
        { test: 'HbA1c Glycated Hemoglobin', value: '8.9 %', refRange: '< 5.7', isAbnormal: true },
        { test: 'Serum Creatinine', value: '1.6 mg/dL', refRange: '0.7 - 1.3', isAbnormal: true },
        { test: 'Total Cholesterol', value: '248 mg/dL', refRange: '< 200', isAbnormal: true },
        { test: 'Hemoglobin (Hb)', value: '10.2 g/dL', refRange: '13.0 - 17.0', isAbnormal: true }
      ],
      ecg: 'Sinus Tachycardia (HR 104 bpm), ST depression 1.5mm and T-wave inversion in leads V4-V6.',
      imaging: 'Chest X-Ray (2025): Mild cardiomegaly, clear lung parenchyma.'
    },

    // Measured Vitals
    vitals: {
      bpSystolic: 174,
      bpDiastolic: 106,
      pulse: 104,
      spo2: 94,
      temp: 98.6,
      respiratoryRate: 22,
      bloodSugar: 210,
      weight: 78,
      height: 172,
      bmi: 26.4
    },

    // Red Flags
    redFlags: [
      'Critical: Crushing chest pain radiating to left arm/jaw (Suspected Acute Coronary Syndrome)',
      'Hypertensive Urgency: Blood pressure 174/106 mmHg',
      'Drug Safety Alert: Recorded severe anaphylaxis to Penicillin group'
    ],

    // AI-Generated Summary Draft
    aiGeneratedDraft: {
      disclaimer: 'AI-generated draft — Doctor verification required. Not a final clinical diagnosis.',
      subjectiveSummary: '54-year-old male with 8-year history of HTN and T2DM presenting with acute onset crushing substernal chest pain radiating to left arm with profuse diaphoresis and breathlessness.',
      objectiveSummary: 'Marked hypertension (174/106 mmHg), tachycardia (104 bpm), SpO2 94% on room air. Previous ECG shows anterolateral ischemic ST-T changes. Uncontrolled glycemic profile (HbA1c 8.9%).',
      preliminaryRiskAssessment: 'High Risk for Acute Coronary Syndrome (NSTEMI vs Unstable Angina) with Hypertensive Crisis (ESI Level 2).',
      differentialDiagnosisDraft: [
        'Acute Coronary Syndrome (NSTEMI / Unstable Angina) — ICD-10: I20.9',
        'Hypertensive Emergency / Urgency — ICD-10: I10',
        'Gastro-esophageal Reflux Disease (GERD) with esophageal spasm'
      ],
      suggestedNextSteps: [
        'Stat 12-lead ECG and serial cardiac Troponin-I / CK-MB enzymes',
        'Sublingual Nitroglycerin (ensure SBP > 100), chewable Aspirin 300mg stat (if not contraindicated)',
        'Cardiology emergency referral and continuous cardiac telemetry monitoring'
      ]
    },

    // Multi-year Digitized Documents
    documents: [
      {
        id: 'doc-101-1',
        title: 'AIIMS New Delhi - Pathology & Renal Function Panel',
        date: '2026-06-12',
        year: '2026',
        hospital: 'AIIMS New Delhi',
        type: 'lab_report',
        typeName: 'Lab Test Report',
        ocrConfidence: 96,
        diagnosis: 'Type 2 Diabetes with Diabetic Nephropathy (Creatinine 1.6 mg/dL)',
        investigations: [
          { name: 'Fasting Blood Sugar', value: '198', unit: 'mg/dL', refRange: '70 - 100', status: 'HIGH', isAbnormal: true },
          { name: 'HbA1c', value: '8.9', unit: '%', refRange: '< 5.7', status: 'HIGH', isAbnormal: true },
          { name: 'Serum Creatinine', value: '1.6', unit: 'mg/dL', refRange: '0.7 - 1.3', status: 'HIGH', isAbnormal: true }
        ],
        medicines: [
          { name: 'Tab. Metformin SR', dosage: '500 mg', freq: '1-0-1', duration: '30 days', instructions: 'With meals' }
        ],
        procedures: [],
        timelineEvent: {
          year: '2026',
          date: '12-Jun-2026',
          title: 'Pathology & Renal Lab Investigation',
          category: 'Investigation',
          summary: 'Elevated HbA1c (8.9%) and Serum Creatinine (1.6 mg/dL).'
        }
      },
      {
        id: 'doc-101-2',
        title: 'District Civil Hospital - Cardiology OPD Prescription Slip',
        date: '2025-09-18',
        year: '2025',
        hospital: 'District Civil Hospital',
        type: 'prescription',
        typeName: 'Prescription Slip',
        ocrConfidence: 94,
        diagnosis: 'Grade II Essential Hypertension, Dyslipidemia',
        investigations: [
          { name: 'BP Recorded', value: '168/98', unit: 'mmHg', refRange: '< 120/80', status: 'HIGH', isAbnormal: true },
          { name: 'Total Cholesterol', value: '248', unit: 'mg/dL', refRange: '< 200', status: 'HIGH', isAbnormal: true }
        ],
        medicines: [
          { name: 'Tab. Telmisartan', dosage: '40 mg', freq: '1-0-0', duration: '90 days', instructions: 'Morning' },
          { name: 'Tab. Amlodipine', dosage: '5 mg', freq: '0-0-1', duration: '90 days', instructions: 'Bedtime' }
        ],
        procedures: [],
        timelineEvent: {
          year: '2025',
          date: '18-Sep-2025',
          title: 'Cardiology Follow-up & Anti-Hypertensive Rx',
          category: 'Prescription',
          summary: 'Diagnosed with Grade II HTN; Telmisartan + Amlodipine prescribed.'
        }
      },
      {
        id: 'doc-101-3',
        title: 'Govt Medical College Hospital - Cholecystectomy Discharge Summary',
        date: '2024-03-22',
        year: '2024',
        hospital: 'Govt Medical College & Hospital',
        type: 'discharge_summary',
        typeName: 'Discharge Summary',
        ocrConfidence: 98,
        diagnosis: 'Symptomatic Cholelithiasis (Gallstones)',
        investigations: [],
        medicines: [
          { name: 'Tab. Cefuroxime', dosage: '500 mg', freq: '1-0-1', duration: '5 days', instructions: 'Post-op antibiotic' }
        ],
        procedures: [
          { name: 'Laparoscopic Cholecystectomy under GA', date: '20-Mar-2024', outcome: 'Successful, uneventful' }
        ],
        timelineEvent: {
          year: '2024',
          date: '22-Mar-2024',
          title: 'Laparoscopic Cholecystectomy Surgery',
          category: 'Surgery',
          summary: 'Elective Laparoscopic Cholecystectomy for gallstones. Uneventful recovery.'
        }
      }
    ],

    doctorNotes: {
      provisionalDiagnosis: '',
      icd10: [],
      prescriptions: [],
      investigations: [],
      advice: '',
      followUp: ''
    }
  },
  {
    id: 'PAT-102',
    tokenNumber: 'MED-102',
    roomNumber: 'Room 104',
    department: 'General Medicine & Diabetology',
    assignedDoctor: 'Dr. Rajesh Sharma, MD (Med)',
    registrationTime: '09:05 AM',
    waitTime: '15 mins',
    status: 'Waiting',
    verificationStatus: 'Pending Verification',
    verificationTimestamp: null,
    rejectionReason: null,
    triageLevel: 3,
    triageCategory: 'Urgent (Yellow)',
    triageColor: 'yellow',
    
    abhaId: '91-3321-4456-7890',
    abhaAddress: 'sunita.sharma@abdm',
    name: 'Sunita Sharma',
    age: 48,
    gender: 'Female',
    phone: '+91 94123 78901',
    address: 'B-12, Karol Bagh, New Delhi',
    language: 'Hindi',
    
    chiefComplaints: [
      'Severe burning and tingling sensation in bilateral feet (Diabetic Neuropathy) for 3 weeks',
      'Increased thirst (Polydipsia) and nocturnal frequent urination (Nocturia > 4 times)',
      'Blurring of vision on distance reading'
    ],

    hpi: {
      onset: 'Progressive over last 3 weeks with worsening burning pain in toes and soles.',
      location: 'Bilateral feet and ankles in a glove-and-stocking distribution.',
      character: 'Pins and needles sensation, burning numbness, heightened sensitivity to bedsheets.',
      severity: '6 / 10 pain score.',
      radiation: 'Ascending from toes up to mid-shin level.',
      aggravatingFactors: 'Night time, resting in bed, cold exposure.',
      relievingFactors: 'Mild relief with warm oil massage; no relief with paracetamol.',
      associatedSymptoms: 'Severe fatigue, dry mouth, polydipsia, nocturia 4-5 times per night.'
    },

    pastMedicalHistory: [
      'Type 2 Diabetes Mellitus — 10 years (Poorly controlled, last HbA1c 10.2%)',
      'Hypothyroidism — 6 years on Thyronorm 50mcg',
      'Dyslipidemia'
    ],

    pastSurgicalHistory: [
      'Tubal Ligation in 2012 (Uneventful)',
      'No major surgeries'
    ],

    currentMedications: [
      'Tab. Glimepiride 2mg (1-0-0) — Before breakfast',
      'Tab. Metformin 500mg (1-0-1) — After food',
      'Tab. Thyronorm 50mcg (1-0-0) — Early morning empty stomach'
    ],

    drugAllergies: [
      'Sulfa Drugs (Causes severe erythema multiforme skin reaction)'
    ],

    familyHistory: 'Both parents had Type 2 Diabetes with microvascular complications. Younger brother on Insulin.',

    personalHistory: 'Vegetarian diet with high glycemic index snacks. Non-smoker, non-drinker. Homemaker with sedentary lifestyle.',

    reviewOfSystems: {
      cardiovascular: 'No chest pain, no palpitations, no pedal edema.',
      respiratory: 'Clear breath sounds, no cough or wheezing.',
      gastrointestinal: 'Occasional bloating and constipation (diabetic gastroparesis tendency).',
      neurological: 'Bilateral peripheral sensory neuropathy with reduced pinprick and vibration sense in feet.',
      musculoskeletal: 'Mild knee osteoarthritis pain on stair climbing.',
      genitourinary: 'Polyuria, nocturia 4-5 times/night; no dysuria or hematuria.'
    },

    previousInvestigations: {
      labs: [
        { test: 'HbA1c Glycated Hemoglobin', value: '10.2 %', refRange: '< 5.7', isAbnormal: true },
        { test: 'Fasting Blood Sugar (FBS)', value: '240 mg/dL', refRange: '70 - 100', isAbnormal: true },
        { test: 'Serum Triglycerides', value: '280 mg/dL', refRange: '< 150', isAbnormal: true },
        { test: 'Serum TSH', value: '2.8 uIU/mL', refRange: '0.4 - 4.5', isAbnormal: false }
      ],
      ecg: 'Normal sinus rhythm, HR 82 bpm.',
      imaging: 'Funduscopy (2025): Early non-proliferative diabetic retinopathy (NPDR).'
    },

    vitals: {
      bpSystolic: 138,
      bpDiastolic: 88,
      pulse: 82,
      spo2: 98,
      temp: 98.4,
      respiratoryRate: 18,
      bloodSugar: 284,
      weight: 66,
      height: 156,
      bmi: 27.1
    },
    
    redFlags: [
      'Marked Hyperglycemia: Random Blood Sugar 284 mg/dL',
      'Symptomatic Peripheral Neuropathy with glycemic decompensation'
    ],

    aiGeneratedDraft: {
      disclaimer: 'AI-generated draft — Doctor verification required. Not a final clinical diagnosis.',
      subjectiveSummary: '48-year-old female with uncontrolled T2DM (10 yrs) presenting with classic bilateral symmetric diabetic peripheral neuropathy and symptomatic osmotic symptoms.',
      objectiveSummary: 'RBS 284 mg/dL, HbA1c 10.2%, impaired monofilament sensation on bilateral feet.',
      preliminaryRiskAssessment: 'Moderate-High Urgency (ESI Level 3) — Poor glycemic control requiring therapy intensification.',
      differentialDiagnosisDraft: [
        'Type 2 Diabetes with Diabetic Peripheral Neuropathy — ICD-10: E11.40',
        'Uncontrolled Hyperglycemia — ICD-10: E11.65',
        'Vitamin B12 Deficiency Neuropathy secondary to chronic Metformin use'
      ],
      suggestedNextSteps: [
        'Consider switching/intensifying oral hypoglycemic agents or adding basal insulin',
        'Add Pregabalin 75mg or Gabapentin for neuropathic pain control',
        'Serum Vitamin B12 and Urine Albumin-to-Creatinine Ratio (UACR) testing'
      ]
    },

    documents: [
      {
        id: 'doc-102-1',
        title: 'Dr. Lal PathLabs - HbA1c & Lipid Panel',
        date: '2026-07-20',
        year: '2026',
        hospital: 'Dr. Lal PathLabs Central',
        type: 'lab_report',
        typeName: 'Lab Report',
        ocrConfidence: 94,
        diagnosis: 'Uncontrolled Diabetes Mellitus with Severe Hypertriglyceridemia',
        investigations: [
          { name: 'HbA1c', value: '10.2', unit: '%', refRange: '< 5.7', status: 'HIGH', isAbnormal: true },
          { name: 'Fasting Blood Sugar', value: '240', unit: 'mg/dL', refRange: '70 - 100', status: 'HIGH', isAbnormal: true },
          { name: 'Serum Triglycerides', value: '280', unit: 'mg/dL', refRange: '< 150', status: 'HIGH', isAbnormal: true }
        ],
        medicines: [],
        procedures: [],
        timelineEvent: {
          year: '2026',
          date: '20-Jul-2026',
          title: 'Comprehensive Diabetic Biochemistry Panel',
          category: 'Investigation',
          summary: 'Marked elevation in HbA1c (10.2%) and Fasting Sugar (240 mg/dL).'
        }
      }
    ],

    doctorNotes: {
      provisionalDiagnosis: '',
      icd10: [],
      prescriptions: [],
      investigations: [],
      advice: '',
      followUp: ''
    }
  },
  {
    id: 'PAT-103',
    tokenNumber: 'PUL-103',
    roomNumber: 'Room 108',
    department: 'Pulmonology / Chest Clinic',
    assignedDoctor: 'Dr. Priya Nambiar, MD (Pulm)',
    registrationTime: '09:20 AM',
    waitTime: '25 mins',
    status: 'Waiting',
    verificationStatus: 'Pending Verification',
    verificationTimestamp: null,
    rejectionReason: null,
    triageLevel: 3,
    triageCategory: 'Urgent (Yellow)',
    triageColor: 'yellow',
    
    abhaId: '91-5544-7788-9900',
    abhaAddress: 'm.irfan@abdm',
    name: 'Mohammad Irfan',
    age: 32,
    gender: 'Male',
    phone: '+91 97112 34567',
    address: 'Old Delhi, Chawri Bazar',
    language: 'English',
    
    chiefComplaints: [
      'Chronic persistent cough with thick sputum for > 3 weeks',
      'Low grade evening fever with night sweats',
      'Unintentional weight loss of 4 kg in last 1 month'
    ],

    hpi: {
      onset: 'Gradual insidious onset over past 25 days, progressively worsening.',
      location: 'Tracheobronchial and retrosternal congestion.',
      character: 'Persistent productive cough with mucoid to purulent yellowish sputum, occasional blood flecks.',
      severity: '4 / 10 discomfort, sleep disrupted by night coughing spells.',
      radiation: 'No radiation.',
      aggravatingFactors: 'Cold air, night time, supine position.',
      relievingFactors: 'Warm water, no relief with OTC herbal syrups.',
      associatedSymptoms: 'Low-grade evening pyrexia (100.2°F), night sweats requiring shirt change, loss of appetite (anorexia).'
    },

    pastMedicalHistory: [
      'No history of Diabetes, Hypertension, or Asthma'
    ],

    pastSurgicalHistory: [
      'None'
    ],

    currentMedications: [
      'Over the counter dextromethorphan cough syrup (No relief)'
    ],

    drugAllergies: [
      'No Known Drug Allergies (NKDA)'
    ],

    familyHistory: 'First cousin living in same joint household was treated for Sputum Positive Pulmonary TB in 2024.',

    personalHistory: 'Cigarette smoker (5 cigarettes/day for 6 years). Lives in densely populated area. Works as a tailor in a textile workshop with fabric dust exposure.',

    reviewOfSystems: {
      cardiovascular: 'Heart rate 90 bpm, no chest pain, no palpitations.',
      respiratory: 'Bilateral scattered crepitations in right upper lung zone on auscultation.',
      gastrointestinal: 'Loss of appetite, no vomiting or diarrhea.',
      neurological: 'Generalized weakness and malaise; no neurological deficits.',
      musculoskeletal: 'Muscle wasting; BMI 18.7 (underweight).',
      genitourinary: 'Normal.'
    },

    previousInvestigations: {
      labs: [
        { test: 'ESR (Erythrocyte Sedimentation Rate)', value: '68 mm/1st hr', refRange: '0 - 15', isAbnormal: true },
        { test: 'Hemoglobin (Hb)', value: '11.2 g/dL', refRange: '13.0 - 17.0', isAbnormal: true },
        { test: 'Total WBC Count', value: '10,800 /mcL', refRange: '4,000 - 11,000', isAbnormal: false }
      ],
      ecg: 'Sinus rhythm, normal axis.',
      imaging: 'Chest X-Ray PA View pending at present encounter.'
    },

    vitals: {
      bpSystolic: 118,
      bpDiastolic: 76,
      pulse: 90,
      spo2: 96,
      temp: 100.2,
      respiratoryRate: 20,
      bloodSugar: 98,
      weight: 54,
      height: 170,
      bmi: 18.7
    },
    
    redFlags: [
      'NTEP TB Surveillance Alert: Cough > 2 weeks + evening fever + night sweats + household contact',
      'Low BMI: 18.7 (Underweight / Nutritional vulnerability)'
    ],

    aiGeneratedDraft: {
      disclaimer: 'AI-generated draft — Doctor verification required. Not a final clinical diagnosis.',
      subjectiveSummary: '32-year-old male with positive household contact presenting with triad of chronic cough > 3 weeks, evening pyrexia, and weight loss.',
      objectiveSummary: 'Low-grade fever (100.2°F), elevated ESR (68 mm/hr), mild normocytic anemia, right upper zone auscultatory crepitations.',
      preliminaryRiskAssessment: 'Presumptive Pulmonary Tuberculosis (NTEP Priority Triage ESI Level 3).',
      differentialDiagnosisDraft: [
        'Pulmonary Tuberculosis (Presumptive) — ICD-10: A15.0',
        'Subacute Bronchiectasis with secondary bacterial infection',
        'Chronic Bronchitis in a young smoker'
      ],
      suggestedNextSteps: [
        'Stat Sputum for CBNAAT (GeneXpert) for Mycobacterium tuberculosis and Rifampicin resistance',
        'Immediate Chest X-Ray PA View in Room 109',
        'HIV screening and Fasting Blood Sugar per NTEP protocol'
      ]
    },

    documents: [
      {
        id: 'doc-103-1',
        title: 'District Chest Clinic - Sputum AFB Slide',
        date: '2026-08-10',
        year: '2026',
        hospital: 'District TB Centre',
        type: 'lab_report',
        typeName: 'Microbiology Report',
        ocrConfidence: 91,
        diagnosis: 'Presumptive Acid Fast Bacilli seen (+1 AFB)',
        investigations: [
          { name: 'Sputum AFB Smear', value: 'Positive (+1)', unit: '', refRange: 'Negative', status: 'HIGH', isAbnormal: true }
        ],
        medicines: [],
        procedures: [],
        timelineEvent: {
          year: '2026',
          date: '10-Aug-2026',
          title: 'Sputum Smear Examination',
          category: 'Investigation',
          summary: 'Presumptive AFB positive slide identified. Sent for CBNAAT confirmation.'
        }
      }
    ],

    doctorNotes: {
      provisionalDiagnosis: '',
      icd10: [],
      prescriptions: [],
      investigations: [],
      advice: '',
      followUp: ''
    }
  },
  {
    id: 'PAT-104',
    tokenNumber: 'ORT-104',
    roomNumber: 'Room 201',
    department: 'Orthopedics OPD',
    assignedDoctor: 'Dr. Anand Saxena, MS (Ortho)',
    registrationTime: '09:40 AM',
    waitTime: '35 mins',
    status: 'Waiting',
    verificationStatus: 'Pending Verification',
    verificationTimestamp: null,
    rejectionReason: null,
    triageLevel: 4,
    triageCategory: 'Routine / Less Urgent (Green)',
    triageColor: 'green',
    
    abhaId: '91-1122-3344-5566',
    abhaAddress: 'ananya.ghosh@abdm',
    name: 'Ananya Ghosh',
    age: 24,
    gender: 'Female',
    phone: '+91 98101 23456',
    address: 'Salt Lake City, Kolkata / New Delhi Guest',
    language: 'English',
    
    chiefComplaints: [
      'Right lateral ankle pain & swelling after inversion twisting while playing badminton (2 days ago)',
      'Difficulty bearing full weight on right foot'
    ],

    hpi: {
      onset: 'Acute injury 2 days ago after landing awkwardly on inverted right foot.',
      location: 'Anterolateral aspect of right lateral malleolus (ATFL region).',
      character: 'Sharp throbbing pain on weight-bearing, localized edema and ecchymosis.',
      severity: '6 / 10 pain on walking; 2 / 10 at rest.',
      radiation: 'No radiation.',
      aggravatingFactors: 'Weight bearing, ankle inversion, walking.',
      relievingFactors: 'Elevation and ice pack application.',
      associatedSymptoms: 'Localized swelling and blue discoloration (bruising); no numbness or tingling in toes.'
    },

    pastMedicalHistory: [
      'No chronic medical conditions'
    ],

    pastSurgicalHistory: [
      'None'
    ],

    currentMedications: [
      'Ice pack local application twice daily'
    ],

    drugAllergies: [
      'NSAIDs / Diclofenac (Causes severe epigastric burning / gastritis)'
    ],

    familyHistory: 'Non-contributory.',

    personalHistory: 'University student and recreational athlete. Non-smoker, non-drinker. Balanced diet.',

    reviewOfSystems: {
      cardiovascular: 'Normal.',
      respiratory: 'Normal.',
      gastrointestinal: 'History of gastritis with NSAIDs.',
      neurological: 'Intact distal sensation in toes, normal motor toe movements.',
      musculoskeletal: 'Right lateral ankle swelling, tenderness over anterior talofibular ligament (ATFL). Ottawa Ankle Rules: Bone tenderness absent over posterior malleoli.',
      genitourinary: 'Normal.'
    },

    previousInvestigations: {
      labs: [],
      ecg: 'Not indicated.',
      imaging: 'X-Ray Right Ankle AP & Lateral (Ordered today): No cortical fracture seen.'
    },

    vitals: {
      bpSystolic: 120,
      bpDiastolic: 80,
      pulse: 76,
      spo2: 99,
      temp: 98.2,
      respiratoryRate: 16,
      bloodSugar: 92,
      weight: 58,
      height: 165,
      bmi: 21.3
    },
    
    redFlags: [],

    aiGeneratedDraft: {
      disclaimer: 'AI-generated draft — Doctor verification required. Not a final clinical diagnosis.',
      subjectiveSummary: '24-year-old female presenting with acute mechanical inversion injury of right ankle with localized swelling and partial weight-bearing difficulty.',
      objectiveSummary: 'Hemodynamically stable (BP 120/80), localized lateral malleolar soft tissue edema, negative posterior bone tenderness.',
      preliminaryRiskAssessment: 'Routine OPD (ESI Level 4) — Suspected Grade I-II Right Ankle Inversion Sprain (ATFL injury).',
      differentialDiagnosisDraft: [
        'Right Ankle Sprain (Anterior Talofibular Ligament) — ICD-10: S93.401A',
        'Base of 5th Metatarsal Avulsion Fracture (Rule out)',
        'Peroneal Tendon Strain'
      ],
      suggestedNextSteps: [
        'RICE therapy (Rest, Ice, Compression bandage, Elevation)',
        'Paracetamol 650mg SOS for analgesia (Avoid NSAIDs due to recorded allergy)',
        'Ankle brace support and progressive weight bearing as tolerated'
      ]
    },

    documents: [],

    doctorNotes: {
      provisionalDiagnosis: '',
      icd10: [],
      prescriptions: [],
      investigations: [],
      advice: '',
      followUp: ''
    }
  }
];
