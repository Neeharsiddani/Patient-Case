# MediKiosk - Smart Patient Case-Taking System
### SIH 2026 Problem Statement: "Patient Case-Taking Software"

> **An AI-Assisted, ABDM-Compliant Smart Patient Intake Kiosk & Doctor Workstation for Indian Government Hospitals, AIIMS OPDs, and District Health Centers.**

---

## 🌟 Overview & Key Innovations

**MediKiosk** solves the critical OPD congestion and case-history taking bottleneck in Indian government hospitals by providing a bilingual, accessible touchscreen intake kiosk for patients and an integrated clinical decision-support workstation for doctors.

1. **Ayushman Bharat Digital Mission (ABDM) Compliant**:
   - Seamless 14-digit ABHA ID integration, ABHA QR scanning simulation, and Walk-in UHID generation.
   - FHIR R4 structured health data observation records.
2. **Accessible Multilingual Touchscreen Kiosk**:
   - Supports 6 Indian regional languages: English, हिन्दी (Hindi), తెలుగు (Telugu), தமிழ் (Tamil), বাংলা (Bengali), मराठी (Marathi).
   - High-contrast visual elements, large touch targets, and Web Speech API audio guidance for low-literacy patients.
3. **Interactive Clinical History Taking**:
   - Anatomical body region picker (Chest & Heart, Lungs, Head & Neck, Stomach, Joints, Urinary, General).
   - Categorized chief complaints, duration slider, visual 1-10 pain scale, past medical history, and drug allergy contraindication alerts.
   - IoT Kiosk Vitals Auto-Capture simulation (Blood Pressure cuff, SpO2 pulse oximeter, infrared thermometer, glucometer).
4. **AI Document Extraction & OCR Interface**:
   - Scan and attach past prescriptions, discharge summaries, or blood test reports.
   - AI OCR extracts diagnostic parameters (Hb, Fasting Blood Sugar, HbA1c, Creatinine) with confidence scoring and patient validation.
5. **Automated Triage & Red-Flag Clinical Decision Support (CDS)**:
   - Automated Emergency Severity Index (ESI Levels 1-5) calculation.
   - Priority red-flag alert flags (Hypertensive Crisis, Acute Coronary Syndrome risk, Penicillin allergy contraindications).
6. **Doctor Workstation & e-Prescription (Rx) Builder**:
   - Live real-time OPD triage queue synchronized with patient kiosk intake.
   - Structured SOAP clinical view with longitudinal lab biomarker trends.
   - Differential diagnosis with ICD-10 suggestions, drug formulary dosage/frequency builder, and lab order requisitions.
   - Official printable Indian Government Hospital OPD prescription slip with QR verification and doctor stamp.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation & Launch

```bash
# 1. Clone the repository
git clone https://github.com/Neeharsiddani/Patient-Case.git
cd Patient-Case

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit **`http://localhost:3000`** in your web browser.

---

## 📱 User Workflows

### Role 1: 🏥 Patient Kiosk Workflow (9 Steps)
1. **Identification**: Enter 14-digit ABHA ID, simulate ABHA card QR scan, or register as a walk-in patient. Quick demo profiles are available for rapid testing.
2. **Language**: Choose your preferred regional language (English, Hindi, Telugu, Tamil, Marathi, Bengali) with voice guidance.
3. **Consent**: Review ABDM and DPDP Act 2023 health data consent terms and provide a digital touch signature or one-tap biometric verification.
4. **Clinical History Taking**:
   - Select affected body region.
   - Pick chief complaints or speak symptoms via voice input.
   - Set duration and pain severity (1-10 visual scale).
   - Tag past chronic conditions and drug allergies.
   - Auto-measure vital signs via the simulated IoT sensor panel.
5. **Document Upload**: Attach previous prescriptions or lab reports (includes preset AIIMS and District Hospital test documents).
6. **AI Document OCR**: View the automated optical character recognition scanner and review extracted lab biomarkers and medications.
7. **Review**: Check all recorded case details with audio readback simulation.
8. **Summary & Triage**: View automated ESI priority triage score and red-flag risk alerts.
9. **OPD Token Slip**: Generate your OPD consultation token pass (`MED-xxx`) with room allocation, estimated wait time, and printable pass.

### Role 2: 👨‍⚕️ Doctor Clinical Workstation
1. **Live OPD Queue**: View real-time patient queue categorized by triage urgency (🔴 Red Flag Emergent, 🟡 Urgent, 🟢 Routine).
2. **Audio Call Patient**: Trigger voice announcement to call the next patient to the consultation room.
3. **Clinical Intake & Vitals**: Review structured SOAP note, vital sign warnings (e.g. BP 174/106 mmHg), and allergy warnings.
4. **Records & OCR Timeline**: Inspect longitudinal biomarker trends (HbA1c, Creatinine, BP) and uploaded past hospital records.
5. **e-Prescription & Diagnosis**: Select ICD-10 diagnostic codes, prescribe generic medications with standard dosage frequency (1-0-1, etc.), order lab tests, and add lifestyle advice.
6. **Print Official OPD Slip**: Generate and print the official Government of India / ABDM outpatient slip.

---

## 🛠️ Technology Stack
- **Frontend Framework**: React 18
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4 & Custom Medical Design System Tokens
- **Icons**: Lucide React
- **Audio Synthesis**: Web Speech API
- **Persistence**: Reactive Context with localStorage synchronization

---

## 📄 License
Developed for the **Smart India Hackathon (SIH 2026)**. Open source under the MIT License.
