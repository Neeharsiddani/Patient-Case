import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dbDir, 'medimitra.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite Database:', err.message);
  } else {
    // Enable WAL mode & foreign keys for high reliability and concurrency
    db.run('PRAGMA foreign_keys = ON;');
    db.run('PRAGMA journal_mode = WAL;');
  }
});

// Promisified DB helpers
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const initDb = async () => {
  const schemaSql = `
    -- 1. Healthcare Facilities / Hospitals (ABDM Health Facility Registry HFR Architecture Ready)
    CREATE TABLE IF NOT EXISTS hospitals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      location TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      facility_type TEXT NOT NULL,
      hfr_id TEXT,
      phone TEXT,
      email TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Clinical Departments / OPDs per Hospital
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      room_number TEXT DEFAULT 'Room 101',
      description TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
    );

    -- 3. Users (Doctors, Hospital Admins & Systems Admin authentication)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('PATIENT', 'DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN')),
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      hospital_id TEXT,
      department TEXT,
      license_number TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL
    );

    -- 4. Doctor-to-Department Authorization Mappings (Strict Healthcare RBAC)
    CREATE TABLE IF NOT EXISTS doctor_departments (
      id TEXT PRIMARY KEY,
      doctor_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      hospital_id TEXT NOT NULL,
      is_primary INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(doctor_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE CASCADE,
      FOREIGN KEY(hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
    );

    -- 5. Patients & Clinical Consultation Cases Master Record
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      token_number TEXT NOT NULL,
      hospital_id TEXT NOT NULL DEFAULT 'hosp-ggh-hyd',
      hospital_name TEXT DEFAULT 'Government General Hospital, Hyderabad',
      department_id TEXT NOT NULL DEFAULT 'dept-ggh-genmed',
      department TEXT DEFAULT 'General Medicine',
      room_number TEXT DEFAULT 'Room 104',
      assigned_doctor_id TEXT,
      assigned_doctor_name TEXT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      abha_id TEXT,
      abha_address TEXT,
      language TEXT DEFAULT 'English',
      reason_for_visit TEXT,
      triage_level INTEGER DEFAULT 4,
      triage_category TEXT DEFAULT 'Routine / Standard (Green)',
      triage_color TEXT DEFAULT 'green',
      wait_time TEXT DEFAULT '15 mins',
      status TEXT DEFAULT 'Waiting' CHECK(status IN ('Waiting', 'Assigned', 'Under Review', 'History Verified', 'In-Consultation', 'Completed', 'Rejected')),
      case_status TEXT DEFAULT 'Waiting for Review' CHECK(case_status IN ('Draft', 'Submitted', 'Waiting for Review', 'Assigned', 'Under Review', 'History Verified', 'Consultation Completed', 'Rejected')),
      verification_status TEXT DEFAULT 'Pending Verification',
      verification_timestamp TEXT,
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hospital_id) REFERENCES hospitals(id),
      FOREIGN KEY(department_id) REFERENCES departments(id),
      FOREIGN KEY(assigned_doctor_id) REFERENCES users(id)
    );

    -- 6. Consents (DPDP Act 2023 & Hospital-Specific Data Authorization)
    CREATE TABLE IF NOT EXISTS consents (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      hospital_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('GRANTED', 'DECLINED', 'REVOKED')),
      scope TEXT NOT NULL,
      purpose TEXT NOT NULL,
      consent_type TEXT NOT NULL,
      signature_data TEXT,
      ip_address TEXT,
      granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      revoked_at DATETIME,
      revocation_status TEXT DEFAULT 'ACTIVE',
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
    );

    -- 7. Structured Clinical Case History
    CREATE TABLE IF NOT EXISTS clinical_histories (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      chief_complaints TEXT NOT NULL, -- JSON array
      duration TEXT,
      pain_score INTEGER DEFAULT 0,
      onset TEXT,
      hpi TEXT, -- JSON object
      past_medical_history TEXT, -- JSON array
      past_surgical_history TEXT, -- JSON array
      current_medications TEXT, -- JSON array
      drug_allergies TEXT, -- JSON array
      family_history TEXT,
      personal_history TEXT,
      review_of_systems TEXT, -- JSON object
      structured_dialogue TEXT, -- JSON array of question-answer pairs
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    -- 8. Measured Vitals
    CREATE TABLE IF NOT EXISTS vitals (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      bp_systolic INTEGER,
      bp_diastolic INTEGER,
      pulse INTEGER,
      spo2 INTEGER,
      temp REAL,
      respiratory_rate INTEGER,
      blood_sugar INTEGER,
      weight REAL,
      height REAL,
      bmi REAL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    -- 9. Red Flags / Safety Triage Alerts
    CREATE TABLE IF NOT EXISTS red_flags (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      flag_text TEXT NOT NULL,
      severity TEXT DEFAULT 'HIGH' CHECK(severity IN ('CRITICAL', 'HIGH', 'MODERATE')),
      trigger_source TEXT,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    -- 10. Uploaded Medical Documents & Extracted OCR Entities
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      doc_type TEXT NOT NULL,
      doc_type_name TEXT,
      doc_date TEXT,
      doc_year TEXT,
      hospital_name TEXT,
      doctor_name TEXT,
      diagnosis TEXT,
      ocr_confidence INTEGER DEFAULT 95,
      extracted_data TEXT, -- JSON object
      verification_status TEXT DEFAULT 'Unverified',
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    -- 11. AI Generated Drafts & Clinician Verified Summaries
    CREATE TABLE IF NOT EXISTS clinical_summaries (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      subjective_summary TEXT NOT NULL,
      objective_summary TEXT NOT NULL,
      preliminary_risk_assessment TEXT,
      differential_diagnosis TEXT, -- JSON array
      suggested_next_steps TEXT, -- JSON array
      disclaimer TEXT DEFAULT 'AI-generated draft — requires clinician verification. Not a final clinical diagnosis.',
      is_ai_draft INTEGER DEFAULT 1,
      clinician_verified INTEGER DEFAULT 0,
      verified_by_doctor_id TEXT,
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    -- 12. Doctor Consultation Notes & e-Prescriptions
    CREATE TABLE IF NOT EXISTS doctor_notes (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      doctor_id TEXT,
      provisional_diagnosis TEXT,
      icd10_codes TEXT, -- JSON array
      prescriptions TEXT, -- JSON array
      investigations TEXT, -- JSON array
      advice TEXT,
      follow_up TEXT,
      signed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    -- 13. Immutable Audit Trail for Healthcare Data Protection
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT,
      user_role TEXT,
      hospital_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details TEXT, -- JSON object
      ip_address TEXT
    );
  `;

  return new Promise((resolve, reject) => {
    db.exec(schemaSql, async (err) => {
      if (err) {
        console.error('❌ Error initializing database schema:', err);
        return reject(err);
      }

      try {
        // Auto-migration for users table
        const userCols = await query("PRAGMA table_info(users)");
        if (userCols && !userCols.some(c => c.name === 'hospital_id')) {
          try { await run("ALTER TABLE users ADD COLUMN hospital_id TEXT"); } catch {}
          try { await run("ALTER TABLE users ADD COLUMN department TEXT"); } catch {}
          try { await run("ALTER TABLE users ADD COLUMN license_number TEXT"); } catch {}
        }

        // Auto-migration for patients table
        const patCols = await query("PRAGMA table_info(patients)");
        if (patCols && !patCols.some(c => c.name === 'hospital_id')) {
          try { await run("ALTER TABLE patients ADD COLUMN hospital_id TEXT DEFAULT 'hosp-ggh-hyd'"); } catch {}
          try { await run("ALTER TABLE patients ADD COLUMN hospital_name TEXT DEFAULT 'Government General Hospital'"); } catch {}
          try { await run("ALTER TABLE patients ADD COLUMN department_id TEXT DEFAULT 'dept-ggh-hyd-genmed'"); } catch {}
          try { await run("ALTER TABLE patients ADD COLUMN reason_for_visit TEXT"); } catch {}
          try { await run("ALTER TABLE patients ADD COLUMN case_status TEXT DEFAULT 'Waiting for Review'"); } catch {}
          try { await run("ALTER TABLE patients ADD COLUMN assigned_doctor_id TEXT"); } catch {}
          try { await run("ALTER TABLE patients ADD COLUMN assigned_doctor_name TEXT"); } catch {}
        }

        // Auto-migration for consents table
        const conCols = await query("PRAGMA table_info(consents)");
        if (conCols && !conCols.some(c => c.name === 'hospital_id')) {
          try { await run("ALTER TABLE consents ADD COLUMN hospital_id TEXT DEFAULT 'hosp-ggh-hyd'"); } catch {}
          try { await run("ALTER TABLE consents ADD COLUMN revocation_status TEXT DEFAULT 'ACTIVE'"); } catch {}
        }

        resolve();
      } catch (migErr) {
        console.warn('Schema migration notice:', migErr);
        resolve();
      }
    });
  });
};
