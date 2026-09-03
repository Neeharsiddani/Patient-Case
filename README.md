# MediMitra — Clinical Intake & Medical History Platform
> **"Your Health, Ready for Care"**  
> *Assistive clinical intake and medical history platform that helps patients provide their health information before consultation and helps clinicians review structured patient information efficiently.*

---

## 🏥 About MediMitra
**MediMitra** (*Medical Companion*) streamlines outpatient department (OPD) clinical intake and case-history taking in hospitals by providing an accessible touchscreen intake kiosk for patients and an integrated clinical review workstation for doctors.

### Clinical & Technical Implementation Status Matrix

| Capability / Integration | Status | Notes |
| :--- | :--- | :--- |
| **Patient Kiosk 13-Step Intake Journey** | **IMPLEMENTED** | Complete guided intake (Hospital, ID, Language, Consent, Reason, History, AYUSH, Red Flags, Documents, OCR, Timeline, Review, Token). |
| **Assistive Clinical Draft (SOAP / HPI)** | **IMPLEMENTED** | Algorithmic synthesis from patient questionnaire & OCR records; strictly non-diagnostic; clinician verification mandatory. |
| **Deterministic Clinical Triage (ESI 1-5)** | **IMPLEMENTED** | Rule-based triage scoring and red-flag evaluation based on Emergency Severity Index principles. |
| **Document OCR Digitization** | **IMPLEMENTED** | Client-side (Tesseract.js) and backend OCR (pdf-parse / tesseract); extracts clinical entities with review requirement. |
| **HL7 FHIR R4 Bundle Generation & Export** | **IMPLEMENTED** | Generates standard ABDM FHIR R4 document bundles with full provenance tagging ([PATIENT-REPORTED], [MACHINE-EXTRACTED], [CLINICIAN-VERIFIED]). |
| **Multi-Hospital RBAC & Tenant Isolation** | **IMPLEMENTED** | Strict hospital/department scoping on SQLite backend with JWT authentication and audit trails. |
| **Multilingual Kiosk Navigation** | **IMPLEMENTED (6 Languages)** | Full UI translations for English, Hindi, Telugu, Tamil, Marathi, and Bengali. Standard English fallback for Gujarati, Kannada, Malayalam, Punjabi, and Urdu. Specialized medical questionnaires in English terminology. |
| **Browser Speech Recognition** | **IMPLEMENTED** | Web Speech API integration with automatic keyboard/touch card manual fallbacks. |
| **ABDM M1/M2/M3 Gateway Live Sync** | **CONFIGURATION REQUIRED** | Gateway client architecture implemented; requires official NHA Sandbox/Production credentials (`ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`). |
| **Hospital HIS / EMR Direct Dispatch** | **CONFIGURATION REQUIRED** | HIS adapter architecture implemented; requires per-hospital endpoint (`HIS_ENDPOINT_<HOSPITAL>`) and API keys. |
| **Government Bhashini AI Speech Engine** | **CONFIGURATION REQUIRED** | Bhashini integration layer implemented; requires active Bhashini API keys. |
| **Autonomous AI Medical Diagnosis** | **NOT IMPLEMENTED** | Intentionally not implemented; MediMitra does not diagnose patients or replace clinician judgment. |
| **Automatic Prescription Generation** | **NOT IMPLEMENTED** | Intentionally not implemented; prescription editor starts blank and requires licensed doctor decision. |
| **Persistent Cloud Database & File Storage** | **INFRASTRUCTURE REQUIRED** | SQLite (`server/data/medimitra.db`) and uploaded files (`server/uploads/`) require a persistent disk or volume mount. |

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
| `ALLOWED_ORIGINS` | Comma-separated allowed frontend origins for CORS | `https://eshwarajaysai.github.io,https://neeharsiddani.github.io,http://localhost:3000` |
| `DATABASE_PATH` | Path to SQLite database file | `server/data/medimitra.db` (requires persistent volume) |
| `UPLOAD_DIR` | Directory for uploaded medical records | `server/uploads` (requires persistent volume) |

#### Frontend Build (`.env` or GitHub Actions Secrets/Variables):
| Variable | Description | Example / Requirement |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Absolute URL of the standalone Express backend | `https://api.medimitra.yourdomain.org` |
| `VITE_BASE_PATH` | Base path for GitHub Pages asset routing | `/Patient-Case/` (default on GitHub Pages) |

### Step-by-Step Production Deployment

#### 1. Backend Deployment (Standalone Express Server)
1. Provision a Node.js 20+ runtime on your host (e.g. AWS EC2, DigitalOcean, Railway, Render, Fly.io).
2. Attach a **persistent volume** to `./server/data` (for SQLite database) and `./server/uploads` (for patient documents).
3. Configure required environment variables: `PORT=5000`, `NODE_ENV=production`, `JWT_SECRET=<32+ char secret>`, and `ALLOWED_ORIGINS=https://<user>.github.io`.
4. Install dependencies and start server:
   ```bash
   npm ci --production
   npm start
   ```
   *(The server initializes database tables idempotently and binds to `0.0.0.0:${PORT}`).*

#### 2. Frontend Deployment (GitHub Pages Static Site)
1. In your GitHub repository settings, go to **Settings > Secrets and variables > Actions**.
2. Add a variable or secret `VITE_API_BASE_URL` with your reachable backend URL (e.g., `https://api.yourdomain.org`).
3. Enable GitHub Pages under **Settings > Pages > Source: GitHub Actions**.
4. Push to `main` branch or trigger `.github/workflows/deploy.yml` manually.
5. The automated workflow builds the static SPA bundle with `/Patient-Case/` base path and publishes to GitHub Pages.

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
