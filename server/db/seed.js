import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { run, get, query, initDb } from './database.js';

export const seedDatabase = async () => {
  await initDb();

  // 1. Seed Users (Doctors & Admin)
  const existingDoctor = await get('SELECT id FROM users WHERE username = ?', ['dr.sharma']);
  if (!existingDoctor) {
    const salt = await bcrypt.genSalt(10);
    const doctorPassword = await bcrypt.hash('Doctor@123', salt);
    const adminPassword = await bcrypt.hash('Admin@123', salt);

    await run(`
      INSERT INTO users (id, username, password_hash, role, full_name, email, phone, department, license_number)
      VALUES 
      (?, 'dr.sharma', ?, 'DOCTOR', 'Dr. Rajesh Sharma, MD', 'dr.sharma@aiims.gov.in', '9811223344', 'Cardiology & General Medicine', 'MCI-DEL-2012-48291'),
      (?, 'dr.priya', ?, 'DOCTOR', 'Dr. Priya Nair, MBBS, DNB', 'dr.priya@aiims.gov.in', '9822334455', 'General Medicine & OPD', 'MCI-DEL-2016-19382'),
      (?, 'admin', ?, 'ADMIN', 'Hospital Systems Administrator', 'admin@aiims.gov.in', '9900112233', 'Hospital Administration', 'ADM-AIIMS-01')
    `, [
      uuidv4(), doctorPassword,
      uuidv4(), doctorPassword,
      uuidv4(), adminPassword
    ]);
  }

  // 2. Seed Initial Patients if empty
  const patientCount = await get('SELECT COUNT(*) as count FROM patients');
  if (patientCount && patientCount.count === 0) {
    const defaultPatients = [
      {
        id: 'patient-101',
        token_number: 'MED-101',
        room_number: 'Room 104',
        department: 'Cardiology & General Medicine',
        assigned_doctor_name: 'Dr. Rajesh Sharma, MD',
        name: 'Ramesh Kumar Verma',
        age: 54,
        gender: 'Male',
        phone: '9876543210',
        address: 'Sector 4, Rohini, New Delhi',
        abha_id: '91-8472-9182-3451',
        abha_address: 'ramesh.verma@abdm',
        language: 'Hindi',
        triage_level: 1,
        triage_category: 'Resuscitation / Immediate Priority',
        triage_color: 'red',
        wait_time: 'Immediate',
        status: 'Waiting',
        verification_status: 'Pending Verification',
        chief_complaints: ['Chest Pain / Angina', 'Shortness of Breath on Exertion', 'Profuse Cold Sweating'],
        duration: '2 hours',
        pain_score: 9,
        onset: 'Sudden onset while walking home; substernal squeezing pressure',
        hpi: {
          character: 'Crushing, heavy substernal squeezing sensation',
          radiation: 'Radiating to left shoulder, jaw, and inner left arm',
          triggers: 'Physical exertion and climbing stairs',
          relieving: 'Partial temporary relief upon resting',
          associatedSymptoms: ['Diaphoresis (cold sweats)', 'Grade 3 Dyspnea', 'Mild nausea without vomiting']
        },
        past_medical_history: ['Type 2 Diabetes Mellitus (diagnosed 2018)', 'Systemic Hypertension (diagnosed 2020)', 'Dyslipidemia'],
        past_surgical_history: ['Laparoscopic Appendectomy (2015 at District Civil Hospital)'],
        current_medications: ['Tab Metformin 500mg BD', 'Tab Telmisartan 40mg OD', 'Tab Atorvastatin 20mg HS'],
        drug_allergies: ['Penicillin (causes severe urticarial rash and facial angioedema)'],
        family_history: 'Father had Premature Myocardial Infarction at age 52; Mother has Type 2 Diabetes.',
        personal_history: 'Former smoker (15 pack-years; quit 2 years ago), Non-alcoholic, sedentary desk job.',
        review_of_systems: {
          cardiovascular: 'Positive for substernal chest pressure and exertional palpitations.',
          respiratory: 'Positive for exertional dyspnea (NYHA Class III). No hemoptysis.',
          gastrointestinal: 'No hematemesis, melena, or acid reflux.',
          neurological: 'No syncope, dizziness, or focal weakness.'
        },
        vitals: {
          bp_systolic: 174,
          bp_diastolic: 106,
          pulse: 108,
          spo2: 91,
          temp: 98.6,
          respiratory_rate: 22,
          blood_sugar: 198
        },
        red_flags: [
          'High Risk: Acute Coronary Syndrome (ACS) presentation with radiating chest pain and diaphoresis.',
          'Stage 2 Hypertensive Emergency: BP 174/106 mmHg with tachycardia (Pulse 108 bpm).',
          'Hypoxemia: SpO2 91% on room air requiring supplemental oxygen evaluation.',
          'Severe Drug Allergy: Documented Penicillin allergy.'
        ],
        ai_summary: {
          subjective_summary: '54-year-old male with known T2D and HTN presenting with sudden-onset severe (9/10) crushing substernal chest pain radiating to left shoulder and jaw with cold sweating.',
          objective_summary: 'BP 174/106 mmHg (Marked Hypertensive Urgency), Pulse 108 bpm, SpO2 91%, RBS 198 mg/dL.',
          preliminary_risk_assessment: 'CRITICAL / Triage Level 1. High clinical suspicion for Acute Coronary Syndrome (STEMI/NSTEMI). Requires STAT 12-lead ECG, Cardiac Troponin I/T, and emergent cardiology evaluation.',
          differential_diagnosis: ['Acute Coronary Syndrome (STEMI vs NSTEMI)', 'Unstable Angina Pectoris', 'Aortic Dissection (rule out given severe pain + HTN)', 'Acute Pulmonary Embolism'],
          suggested_next_steps: ['STAT 12-Lead ECG within 10 minutes', 'Cardiac Troponin I STAT', 'Supplemental O2 via nasal cannula (target SpO2 > 94%)', 'Sublingual Nitroglycerin (if SBP > 100 and no PDE-5 inhibitors)', 'Antiplatelet loading: Aspirin 300mg + Clopidogrel 300mg (per doctor order)']
        }
      },
      {
        id: 'patient-102',
        token_number: 'MED-102',
        room_number: 'Room 102',
        department: 'General Medicine',
        assigned_doctor_name: 'Dr. Priya Nair, MBBS, DNB',
        name: 'Sunita Sharma',
        age: 48,
        gender: 'Female',
        phone: '9412378901',
        address: 'Karol Bagh, New Delhi',
        abha_id: '91-3321-4456-7890',
        abha_address: 'sunita.sharma@abdm',
        language: 'Hindi',
        triage_level: 3,
        triage_category: 'Urgent / Priority 3 (Yellow)',
        triage_color: 'amber',
        wait_time: '25 mins',
        status: 'Waiting',
        verification_status: 'Pending Verification',
        chief_complaints: ['High Grade Fever with Chills', 'Severe Generalized Bodyache', 'Retro-orbital Headache'],
        duration: '4 days',
        pain_score: 6,
        onset: 'Sudden onset 4 days ago with shivering rigors and peak fever 103°F in evenings',
        hpi: {
          character: 'Continuous burning fever with intermittent spiking chills',
          radiation: 'Throbbing frontal and retro-orbital headache',
          triggers: 'Heat exposure and fatigue',
          relieving: 'Temporary reduction with Paracetamol 650mg',
          associatedSymptoms: ['Severe myalgia (breakbone sensation)', 'Loss of appetite', 'Mild dry cough']
        },
        past_medical_history: ['Hypothyroidism (diagnosed 2019)'],
        past_surgical_history: ['Cesarean Section (2006)'],
        current_medications: ['Tab Levothyroxine 50mcg OD (empty stomach)'],
        drug_allergies: ['Sulfa drugs (causes fixed drug eruption)'],
        family_history: 'Non-contributory.',
        personal_history: 'Non-smoker, vegetarian diet, resides in an area with recent seasonal monsoon dengue alerts.',
        review_of_systems: {
          cardiovascular: 'No chest pain or orthopnea.',
          respiratory: 'Mild dry cough; no hemoptysis or wheeze.',
          gastrointestinal: 'Mild epigastric nausea; no diarrhea or hematemesis.',
          neurological: 'Severe retro-orbital headache without photophobia or neck stiffness.'
        },
        vitals: {
          bp_systolic: 118,
          bp_diastolic: 76,
          pulse: 96,
          spo2: 98,
          temp: 102.4,
          respiratory_rate: 18,
          blood_sugar: 112
        },
        red_flags: [
          'High Grade Pyrexia: Body Temperature 102.4°F with chills and retro-orbital ache.',
          'Severe Sulfa Allergy: Documented adverse drug reaction.'
        ],
        ai_summary: {
          subjective_summary: '48-year-old female presenting with 4-day history of acute high-grade fever (102.4°F) accompanied by chills, severe retro-orbital headache, and myalgias.',
          objective_summary: 'Temp 102.4°F, Pulse 96 bpm, BP 118/76 mmHg, SpO2 98%.',
          preliminary_risk_assessment: 'Moderate / Triage Level 3. Acute febrile illness. High suspicion for Vector-Borne Infection (Dengue NS1 / Malaria / Chikungunya vs Typhoid).',
          differential_diagnosis: ['Dengue Fever with Warning Signs', 'Malaria (Plasmodium Vivax / Falciparum)', 'Viral Pyrexia / Influenza', 'Enteric Fever (Typhoid)'],
          suggested_next_steps: ['Complete Blood Count (CBC with Platelet count and Hematocrit)', 'Dengue NS1 Antigen & IgM/IgG Serology', 'Peripheral Blood Smear for Malarial Parasite (MP) / Rapid Diagnostic Test', 'Widal Test / Blood Culture', 'Oral Rehydration Therapy']
        }
      }
    ];

    for (const p of defaultPatients) {
      await run(`
        INSERT INTO patients (
          id, token_number, room_number, department, assigned_doctor_name, name, age, gender, phone, address,
          abha_id, abha_address, language, triage_level, triage_category, triage_color, wait_time, status, verification_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        p.id, p.token_number, p.room_number, p.department, p.assigned_doctor_name, p.name, p.age, p.gender, p.phone, p.address,
        p.abha_id, p.abha_address, p.language, p.triage_level, p.triage_category, p.triage_color, p.wait_time, p.status, p.verification_status
      ]);

      // Consent
      await run(`
        INSERT INTO consents (id, patient_id, status, scope, purpose, consent_type, ip_address)
        VALUES (?, ?, 'GRANTED', 'PATIENT_INTAKE_OPD', 'Clinical assessment, OPD triage and verified medical record storage under DPDP Act 2023', 'ELECTRONIC_TOUCH_SIGNATURE', '127.0.0.1')
      `, [uuidv4(), p.id]);

      // Clinical History
      await run(`
        INSERT INTO clinical_histories (
          id, patient_id, chief_complaints, duration, pain_score, onset, hpi, past_medical_history,
          past_surgical_history, current_medications, drug_allergies, family_history, personal_history, review_of_systems
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(), p.id,
        JSON.stringify(p.chief_complaints), p.duration, p.pain_score, p.onset,
        JSON.stringify(p.hpi), JSON.stringify(p.past_medical_history), JSON.stringify(p.past_surgical_history),
        JSON.stringify(p.current_medications), JSON.stringify(p.drug_allergies), p.family_history, p.personal_history,
        JSON.stringify(p.review_of_systems)
      ]);

      // Vitals
      await run(`
        INSERT INTO vitals (
          id, patient_id, bp_systolic, bp_diastolic, pulse, spo2, temp, respiratory_rate, blood_sugar
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(), p.id,
        p.vitals.bp_systolic, p.vitals.bp_diastolic, p.vitals.pulse, p.vitals.spo2, p.vitals.temp, p.vitals.respiratory_rate, p.vitals.blood_sugar
      ]);

      // Red Flags
      for (const flag of p.red_flags) {
        await run(`
          INSERT INTO red_flags (id, patient_id, flag_text, severity, trigger_source)
          VALUES (?, ?, ?, 'HIGH', 'SERVER_DETERMINISTIC_RULES')
        `, [uuidv4(), p.id, flag]);
      }

      // AI Summary
      await run(`
        INSERT INTO clinical_summaries (
          id, patient_id, subjective_summary, objective_summary, preliminary_risk_assessment,
          differential_diagnosis, suggested_next_steps, is_ai_draft, clinician_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
      `, [
        uuidv4(), p.id,
        p.ai_summary.subjective_summary, p.ai_summary.objective_summary, p.ai_summary.preliminary_risk_assessment,
        JSON.stringify(p.ai_summary.differential_diagnosis), JSON.stringify(p.ai_summary.suggested_next_steps)
      ]);

      // Audit Log
      await run(`
        INSERT INTO audit_logs (id, user_id, user_role, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'SYSTEM', 'KIOSK_CLIENT', 'PATIENT_REGISTERED', 'PATIENT', ?, ?, '127.0.0.1')
      `, [uuidv4(), p.id, JSON.stringify({ name: p.name, abha_id: p.abha_id, triage: p.triage_category })]);
    }
  }
};
