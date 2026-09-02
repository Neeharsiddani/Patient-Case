# MediMitra — Clinical Intake & Medical History Platform
> **"Your Health, Ready for Care"**  
> *AI-powered clinical intake and medical history platform that helps patients provide their health information before consultation and helps clinicians review structured patient information efficiently.*

---

## 🏥 About MediMitra
**MediMitra** (*Medical Companion*) streamlines outpatient department (OPD) clinical intake and case-history taking in hospitals by providing an accessible, multi-lingual touchscreen intake kiosk for patients and an integrated clinical review workstation for doctors.

### Key Capabilities:
1. **Patient Kiosk (Structured Intake Workflow)**:
   - 14-digit ABHA ID & ABDM QR Scanner or new walk-in registration.
   - 11 Indian languages (English, हिन्दी, తెలుగు, தமிழ், मराठी, বাংলা, ગુજરાતી, ಕನ್ನಡ, മലയാളം, ਪੰਜਾਬੀ, اردو) with regional speech recognition.
   - Granular, plain-language informed consent aligned with Digital Personal Data Protection (DPDP) Act 2023 principles.
   - Adaptive clinical branch questioning and AYUSH / Dashavidha Pariksha assessment.
   - Real-time deterministic clinical triage (ESI Levels 1 to 5) and red-flag evaluation.
   - Medical document upload with real client/server OCR (Tesseract.js & pdf-parse).
   - Verifiable OPD token slip with ABDM consultation QR code pass.

2. **Doctor Clinical Workstation**:
   - Hospital-isolated real-time patient queue with triage urgency categorization (🔴 Red Flag, 🟡 Urgent, 🟢 Routine).
   - 10-section structured clinical summary with mandatory clinician verification workflow.
   - Complete doctor e-Prescription builder with ICD-10 diagnostic coding (starts blank; zero unapproved auto-prescribing).
   - Standardized HL7 FHIR R4 Bundle export for ABDM ecosystem integration.
   - Printable official OPD consultation slip preserving authentic hospital identity.

---

## 🚀 Production Deployment Architecture

MediMitra strictly separates static frontend presentation from authenticated backend clinical services.

```
┌─────────────────────────────────────────────────────────────┐
│                 Frontend: GitHub Pages                      │
│                                                             │
│  - Static Single-Page Application (React + Vite)            │
│  - Hosted on GitHub Pages (/Patient-Case/ subpath)          │
│  - Pure client-side static bundle (no server execution)     │
│  - Communicates with backend via VITE_API_BASE_URL          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                      HTTPS / JSON API (CORS)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│             Backend: Standalone Express Server              │
│                                                             │
│  - Independent Node.js / Express backend                    │
│  - Hosted on dedicated VM or container (e.g., AWS EC2,      │
│    DigitalOcean, Railway, Render, Fly.io, or on-premise)    │
│  - Persistent SQLite database (WAL mode) or PostgreSQL      │
│  - Encrypted bcrypt authentication, JWT sessions, OCR engine│
│  - Enforces fail-closed multi-hospital tenant isolation     │
└─────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **GitHub Pages Frontend-Only Invariant**:  
> GitHub Pages is a static file host and **cannot execute Node.js or Express**. The backend must be run as a separate, reachable service. If `VITE_API_BASE_URL` is omitted on GitHub Pages, the frontend informs the user that backend configuration is required instead of falling back to synthetic data.

### Storage & Persistence Requirements

- **Database Persistence**: The backend uses SQLite (`server/data/medimitra.db`). A **persistent filesystem volume** or dedicated VM disk is required to retain clinical records across restarts.
- **Document Storage**: Uploaded medical records (`server/uploads/`) reside on disk and require persistent block storage or an S3-compatible object storage volume.

### Environment Variables

#### Backend (`server/.env` or Host Environment):
| Variable | Description | Example / Requirement |
| :--- | :--- | :--- |
| `PORT` | HTTP port for Express server | `5000` (default) |
| `HOST` | Bind address for network interface | `0.0.0.0` |
| `NODE_ENV` | Runtime environment | `production` / `development` |
| `JWT_SECRET` | Cryptographic secret for clinician tokens | **Mandatory in production** (fails closed if missing) |
| `ALLOWED_ORIGINS` | Comma-separated allowed frontend origins for CORS | `https://neeharsiddani.github.io,http://localhost:3000` |
| `DATABASE_PATH` | Path to SQLite database file | `server/data/medimitra.db` (optional override) |
| `UPLOAD_DIR` | Directory for uploaded medical records | `server/uploads` (optional override) |

#### Frontend Build (`.env` or GitHub Actions Secrets/Variables):
| Variable | Description | Example / Requirement |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Absolute URL of the standalone Express backend | `https://api.medimitra.yourdomain.org` |
| `VITE_BASE_PATH` | Base path for GitHub Pages asset routing | `/Patient-Case/` (default on GitHub Pages) |

---

## 🔒 Security & Data Integrity Guarantees

1. **Zero Mock Fallbacks in Production**:
   - When the backend is unreachable or not configured, the application explicitly informs the user rather than faking successful submissions or loading demo patients.
2. **Strict Multi-Hospital RBAC**:
   - Clinicians can only access patient records, queues, documents, and FHIR bundles belonging to their authenticated healthcare facility. Cross-hospital access returns HTTP 403 Forbidden.
3. **Fail-Closed Hospital Scoping**:
   - Missing, null, empty, or mismatched hospital identifiers are rejected immediately.
4. **Authentic Provenance**:
   - Clinical summaries, AYUSH fields, and prescriptions initialize blank and clearly distinguish unrecorded intake data from verified clinician entries.

---

## 🧪 Automated Test Suite

```bash
# Run backend multi-hospital RBAC & API test suite
npm test

# Run deployment architecture & API configuration audit
node scratch/test_production_deployment_config.js

# Run security hardening & cross-hospital isolation audit
node scratch/test_security_hardening.js

# Run complete end-to-end production audit
node scratch/test_e2e_production_audit.js

# Run patient-facing 10-step intake audit
node scratch/test_patient_journey_audit.js

# Run ABDM / FHIR R4 document bundle validation
node scratch/test_abdm_fhir_workflow.js

# Build production bundle
npm run build
```
