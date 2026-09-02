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

## 🚀 Deployment & API Architecture

MediMitra separates static frontend presentation from authenticated backend services.

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend Hosting                      │
│                                                             │
│  Option A: Netlify (Root Domain / SPA)                      │
│  - Assets served from root domain                           │
│  - Routes /api/* requests via netlify.toml redirects        │
│                                                             │
│  Option B: GitHub Pages (Static Hosting)                    │
│  - Pure client-side static bundle (/Patient-Case/ subpath)  │
│  - Requires external backend via VITE_API_BASE_URL          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                      HTTPS / JSON API
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend Hosting Options                  │
│                                                             │
│  Dedicated Node.js / Express Server (Recommended)           │
│  - Hosted on Render, Railway, AWS ECS, Fly.io, or VPS       │
│  - Persistent SQLite database or PostgreSQL adapter         │
│  - Real bcrypt authentication, JWT sessions & OCR engine    │
│                                                             │
│  Netlify Functions (Serverless API)                         │
│  - Suitable for stateless API workflows                     │
│  - Note: Local SQLite is ephemeral in serverless lambda     │
└─────────────────────────────────────────────────────────────┘
```

### Environment Variables

#### Backend (`server/.env`):
| Variable | Description | Example / Required |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `5000` |
| `NODE_ENV` | Environment mode (`production` / `development`) | `production` |
| `JWT_SECRET` | Secret key for signing clinician auth tokens | **Required in production** |
| `ALLOWED_ORIGINS` | Comma-separated allowed frontend origins for CORS | `https://medimitra.netlify.app,https://neeharsiddani.github.io` |

#### Frontend Build (`.env` or Deployment Settings):
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Full URL of the deployed Express backend | `'/api'` (relative) |
| `VITE_BASE_PATH` | Base URL path for static asset loading | `'/'` (or `'/Patient-Case/'` on GitHub Pages) |

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
