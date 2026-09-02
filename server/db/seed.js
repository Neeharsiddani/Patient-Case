import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { run, get, query, initDb } from './database.js';
import { HospitalImportService } from '../services/hospitalImportService.js';

export const seedDatabase = async () => {
  await initDb();
  await run('PRAGMA foreign_keys = OFF;');

  try {
    // 1. Seed & Sync Centralized India-Wide Healthcare Facilities / Hospitals
    await HospitalImportService.loadBundledNationalDirectory();

  // 3. Seed Users (Doctors & Hospital Administrators with Multi-Hospital Scope)
  const salt = await bcrypt.genSalt(10);
  const doctorPassword = await bcrypt.hash('Doctor@123', salt);
  const adminPassword = await bcrypt.hash('Admin@123', salt);

  const usersToSeed = [
    // GGH Hyderabad Staff
    {
      id: 'usr-dr-sharma',
      username: 'dr.sharma',
      password_hash: doctorPassword,
      role: 'DOCTOR',
      full_name: 'Dr. Rajesh Sharma, MD',
      email: 'dr.sharma@ggh-hyderabad.gov.in',
      phone: '9845012345',
      hospital_id: 'hosp-ggh-hyd',
      department: 'Cardiology & General Medicine',
      license_number: 'TS-MCI-2012-48291',
      departmentsAuth: ['dept-ggh-hyd-cardio', 'dept-ggh-hyd-genmed']
    },
    {
      id: 'usr-dr-priya',
      username: 'dr.priya',
      password_hash: doctorPassword,
      role: 'DOCTOR',
      full_name: 'Dr. Priya Nair, MBBS, DNB',
      email: 'dr.priya@ggh-hyderabad.gov.in',
      phone: '9845023456',
      hospital_id: 'hosp-ggh-hyd',
      department: 'General Medicine',
      license_number: 'TS-MCI-2016-19382',
      departmentsAuth: ['dept-ggh-hyd-genmed']
    },
    {
      id: 'usr-dr-anand',
      username: 'dr.anand',
      password_hash: doctorPassword,
      role: 'DOCTOR',
      full_name: 'Dr. Anand Verma, MS (Ortho)',
      email: 'dr.anand@ggh-hyderabad.gov.in',
      phone: '9845034567',
      hospital_id: 'hosp-ggh-hyd',
      department: 'Orthopedics',
      license_number: 'TS-MCI-2014-77219',
      departmentsAuth: ['dept-ggh-hyd-ortho']
    },
    {
      id: 'usr-admin-ggh',
      username: 'admin.ggh',
      password_hash: adminPassword,
      role: 'HOSPITAL_ADMIN',
      full_name: 'GGH Hospital Administrator',
      email: 'admin@ggh-hyderabad.gov.in',
      phone: '9900112233',
      hospital_id: 'hosp-ggh-hyd',
      department: 'Hospital Administration',
      license_number: 'ADM-GGH-01',
      departmentsAuth: []
    },

    // Apollo Hyderabad Staff
    {
      id: 'usr-dr-kiran',
      username: 'dr.kiran',
      password_hash: doctorPassword,
      role: 'DOCTOR',
      full_name: 'Dr. Kiran Reddy, MD, DM (Cardiology)',
      email: 'dr.kiran.r@apollohospitals.com',
      phone: '9845045678',
      hospital_id: 'hosp-apollo-hyd',
      department: 'Cardiology',
      license_number: 'TS-MCI-2010-88123',
      departmentsAuth: ['dept-apollo-hyd-cardio']
    },
    {
      id: 'usr-dr-meera',
      username: 'dr.meera',
      password_hash: doctorPassword,
      role: 'DOCTOR',
      full_name: 'Dr. Meera Deshmukh, MS (Ortho)',
      email: 'dr.meera.d@apollohospitals.com',
      phone: '9845056789',
      hospital_id: 'hosp-apollo-hyd',
      department: 'Orthopedics',
      license_number: 'TS-MCI-2015-33910',
      departmentsAuth: ['dept-apollo-hyd-ortho']
    },
    {
      id: 'usr-admin-apollo',
      username: 'admin.apollo',
      password_hash: adminPassword,
      role: 'HOSPITAL_ADMIN',
      full_name: 'Apollo Hospital Administrator',
      email: 'admin.hyd@apollohospitals.com',
      phone: '9900223344',
      hospital_id: 'hosp-apollo-hyd',
      department: 'Hospital Administration',
      license_number: 'ADM-APL-02',
      departmentsAuth: []
    },

    // Yashoda Hyderabad Staff
    {
      id: 'usr-dr-suresh',
      username: 'dr.suresh',
      password_hash: doctorPassword,
      role: 'DOCTOR',
      full_name: 'Dr. Suresh Babu, MD (Gen Med)',
      email: 'dr.suresh.b@yashodamail.com',
      phone: '9845067890',
      hospital_id: 'hosp-yashoda-hyd',
      department: 'General Medicine',
      license_number: 'TS-MCI-2013-11204',
      departmentsAuth: ['dept-yashoda-hyd-genmed']
    },
    {
      id: 'usr-admin-yashoda',
      username: 'admin.yashoda',
      password_hash: adminPassword,
      role: 'HOSPITAL_ADMIN',
      full_name: 'Yashoda Hospital Administrator',
      email: 'admin.somajiguda@yashodamail.com',
      phone: '9900334455',
      hospital_id: 'hosp-yashoda-hyd',
      department: 'Hospital Administration',
      license_number: 'ADM-YSH-03',
      departmentsAuth: []
    }
  ];

  for (const u of usersToSeed) {
    const existing = await get('SELECT id FROM users WHERE username = ?', [u.username]);
    if (existing) {
      await run(`
        UPDATE users 
        SET hospital_id = ?, department = ?, full_name = ?, role = ?, license_number = ?, email = ?, phone = ?
        WHERE username = ?
      `, [u.hospital_id, u.department, u.full_name, u.role, u.license_number, u.email, u.phone, u.username]);
    } else {
      await run(`
        INSERT INTO users (id, username, password_hash, role, full_name, email, phone, hospital_id, department, license_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [u.id, u.username, u.password_hash, u.role, u.full_name, u.email, u.phone, u.hospital_id, u.department, u.license_number]);
    }

    // Seed Doctor-Department Authorizations
    for (const deptId of u.departmentsAuth) {
      const existingMapping = await get('SELECT id FROM doctor_departments WHERE doctor_id = ? AND department_id = ?', [u.id, deptId]);
      if (!existingMapping) {
        await run(`
          INSERT INTO doctor_departments (id, doctor_id, department_id, hospital_id, is_primary)
          VALUES (?, ?, ?, ?, 1)
        `, [uuidv4(), u.id, deptId, u.hospital_id]);
      }
    }
  }

  // 4. Seed Initial Patients & Routed Consultation Cases (Development & Test Environments ONLY)
  // Strict Security Rule: Never seed demo patients into a production database.
  const isProduction = process.env.NODE_ENV === 'production';
  const patientCount = await get('SELECT COUNT(*) as count FROM patients');
  if (!isProduction && patientCount && patientCount.count === 0) {
    const defaultPatients = [
      {
        id: 'patient-101',
        token_number: 'MED-101',
        hospital_id: 'hosp-ggh-hyd',
        hospital_name: 'Government General Hospital',
        department_id: 'dept-ggh-hyd-cardio',
        department: 'Cardiology',
        room_number: 'Room 104',
        assigned_doctor_id: 'usr-dr-sharma',
        assigned_doctor_name: 'Dr. Rajesh Sharma, MD',
        name: 'Ramesh Kumar Verma',
        age: 54,
        gender: 'Male',
        phone: '9876543210',
        address: 'Banjara Hills, Hyderabad',
        abha_id: '91-8472-9182-3451',
        abha_address: 'ramesh.verma@abdm',
        language: 'Hindi',
        reason_for_visit: 'Severe crushing chest pain radiating to left arm and jaw with profuse cold sweating',
        triage_level: 1,
        triage_category: 'Resuscitation / Immediate Priority',
        triage_color: 'red',
        wait_time: 'Immediate',
        status: 'Waiting',
        case_status: 'Waiting for Review',
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
          'Severe Drug Allergy: Documented Penicillin allergy (Cross-reactive with Penicillin beta-lactams).'
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
        hospital_id: 'hosp-ggh-hyd',
        hospital_name: 'Government General Hospital',
        department_id: 'dept-ggh-hyd-genmed',
        department: 'General Medicine',
        room_number: 'Room 101',
        assigned_doctor_id: 'usr-dr-priya',
        assigned_doctor_name: 'Dr. Priya Nair, MBBS, DNB',
        name: 'Sunita Sharma',
        age: 48,
        gender: 'Female',
        phone: '9412378901',
        address: 'Secunderabad, Telangana',
        abha_id: '91-3321-4456-7890',
        abha_address: 'sunita.sharma@abdm',
        language: 'Hindi',
        reason_for_visit: 'High grade continuous fever with bodyache and retro-orbital headache',
        triage_level: 3,
        triage_category: 'Urgent / Priority 3 (Yellow)',
        triage_color: 'amber',
        wait_time: '25 mins',
        status: 'Waiting',
        case_status: 'Waiting for Review',
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
          'Severe Sulfa Allergy: Documented adverse drug reaction (Cross-reactive with Sulfonamides).'
        ],
        ai_summary: {
          subjective_summary: '48-year-old female presenting with 4-day history of acute high-grade fever (102.4°F) accompanied by chills, severe retro-orbital headache, and myalgias.',
          objective_summary: 'Temp 102.4°F, Pulse 96 bpm, BP 118/76 mmHg, SpO2 98%.',
          preliminary_risk_assessment: 'Moderate / Triage Level 3. Acute febrile illness. High suspicion for Vector-Borne Infection (Dengue NS1 / Malaria / Chikungunya vs Typhoid).',
          differential_diagnosis: ['Dengue Fever with Warning Signs', 'Malaria (Plasmodium Vivax / Falciparum)', 'Viral Pyrexia / Influenza', 'Enteric Fever (Typhoid)'],
          suggested_next_steps: ['Complete Blood Count (CBC with Platelet count and Hematocrit)', 'Dengue NS1 Antigen & IgM/IgG Serology', 'Peripheral Blood Smear for Malarial Parasite (MP) / Rapid Diagnostic Test', 'Widal Test / Blood Culture', 'Oral Rehydration Therapy']
        }
      },
      {
        id: 'patient-103',
        token_number: 'MED-103',
        hospital_id: 'hosp-apollo-hyd',
        hospital_name: 'Apollo Hospitals',
        department_id: 'dept-apollo-hyd-cardio',
        department: 'Cardiology',
        room_number: 'Room 104',
        assigned_doctor_id: 'usr-dr-kiran',
        assigned_doctor_name: 'Dr. Kiran Reddy, MD, DM (Cardiology)',
        name: 'Venkat Rao',
        age: 62,
        gender: 'Male',
        phone: '9845099887',
        address: 'Jubilee Hills, Hyderabad',
        abha_id: '91-9988-7766-1122',
        abha_address: 'venkat.rao@abdm',
        language: 'Telugu',
        reason_for_visit: 'Exertional breathlessness and palpitation episodes for 1 week',
        triage_level: 2,
        triage_category: 'Emergent / Priority 2 (Red)',
        triage_color: 'red',
        wait_time: '10 mins',
        status: 'Waiting',
        case_status: 'Waiting for Review',
        verification_status: 'Pending Verification',
        chief_complaints: ['Palpitations', 'Exertional Dyspnea'],
        duration: '1 week',
        pain_score: 4,
        onset: 'Gradual onset with sudden rapid heart rhythm flutter',
        hpi: {
          character: 'Fluttering rapid irregular heart beats',
          radiation: 'None',
          triggers: 'Walking briskly',
          relieving: 'Sitting and resting',
          associatedSymptoms: ['Mild lightheadedness', 'Fatigue']
        },
        past_medical_history: ['Hypertension (10 years)'],
        past_surgical_history: ['None'],
        current_medications: ['Tab Amlodipine 5mg OD'],
        drug_allergies: ['No Known Drug Allergies (NKDA)'],
        family_history: 'Hypertension in mother.',
        personal_history: 'Non-smoker, vegetarian.',
        review_of_systems: {
          cardiovascular: 'Irregular tachycardia reported.',
          respiratory: 'Mild breathlessness.',
          gastrointestinal: 'Normal.',
          neurological: 'No syncope.'
        },
        vitals: {
          bp_systolic: 156,
          bp_diastolic: 94,
          pulse: 124,
          spo2: 96,
          temp: 98.4,
          respiratory_rate: 20,
          blood_sugar: 135
        },
        red_flags: [
          'Critical Arrhythmia Alert: Tachycardia (Pulse 124 bpm) with irregular flutter.'
        ],
        ai_summary: {
          subjective_summary: '62-year-old male presenting with exertional palpitations and flutter.',
          objective_summary: 'BP 156/94 mmHg, Pulse 124 bpm irregular, SpO2 96%.',
          preliminary_risk_assessment: 'Emergent / Triage Level 2. Suspected Atrial Fibrillation with Rapid Ventricular Rate vs SVT.',
          differential_diagnosis: ['Atrial Fibrillation with RVR', 'Supraventricular Tachycardia (SVT)', 'Hypertensive Cardiomyopathy'],
          suggested_next_steps: ['STAT 12-Lead ECG', 'Serum Electrolytes (K+, Mg++)', 'Echocardiography 2D']
        }
      }
    ];

    for (const p of defaultPatients) {
      await run(`
        INSERT INTO patients (
          id, token_number, hospital_id, hospital_name, department_id, department, room_number,
          assigned_doctor_id, assigned_doctor_name, name, age, gender, phone, address,
          abha_id, abha_address, language, reason_for_visit, triage_level, triage_category, triage_color, wait_time, status, case_status, verification_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        p.id, p.token_number, p.hospital_id, p.hospital_name, p.department_id, p.department, p.room_number,
        p.assigned_doctor_id, p.assigned_doctor_name, p.name, p.age, p.gender, p.phone, p.address,
        p.abha_id, p.abha_address, p.language, p.reason_for_visit, p.triage_level, p.triage_category, p.triage_color, p.wait_time, p.status, p.case_status, p.verification_status
      ]);

      // Consent
      await run(`
        INSERT INTO consents (id, patient_id, hospital_id, status, scope, purpose, consent_type, ip_address)
        VALUES (?, ?, ?, 'GRANTED', 'PATIENT_INTAKE_OPD', 'Clinical assessment, OPD triage and verified medical record storage under DPDP Act 2023', 'ELECTRONIC_TOUCH_SIGNATURE', '127.0.0.1')
      `, [uuidv4(), p.id, p.hospital_id]);

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
        INSERT INTO audit_logs (id, user_id, user_role, hospital_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'SYSTEM', 'KIOSK_CLIENT', ?, 'PATIENT_REGISTERED', 'PATIENT', ?, ?, '127.0.0.1')
      `, [uuidv4(), p.hospital_id, p.id, JSON.stringify({ name: p.name, abha_id: p.abha_id, triage: p.triage_category })]);
    }
  }
} finally {
  await run('PRAGMA foreign_keys = ON;');
}
};


