/**
 * MediMitra Server-Side Deterministic Red-Flag & Triage Engine
 * Evaluates clinical vital sign thresholds and acute presentation criteria.
 * (Does NOT rely solely on LLMs for critical emergency detection).
 */
export const evaluateClinicalTriage = ({
  chiefComplaints = [],
  hpi = {},
  vitals = {},
  painScore = 0,
  drugAllergies = [],
  age = 30
}) => {
  const redFlags = [];
  let triageLevel = 4; // 1 = Resuscitation, 2 = Emergent, 3 = Urgent, 4 = Less Urgent, 5 = Non-urgent
  let triageCategory = 'Routine / Standard (Green)';
  let triageColor = 'green';
  let waitTime = '20-30 mins';

  const complaintsStr = Array.isArray(chiefComplaints) ? chiefComplaints.join(' ').toLowerCase() : String(chiefComplaints).toLowerCase();
  const symptomsStr = typeof hpi === 'object' ? JSON.stringify(hpi).toLowerCase() : String(hpi).toLowerCase();
  const combined = `${complaintsStr} ${symptomsStr}`;

  // 1. Critical Cardiac / Vascular Criteria (Triage 1 / Resuscitation)
  if (
    (combined.includes('chest pain') || combined.includes('angina') || combined.includes('heart attack')) &&
    (combined.includes('sweat') || combined.includes('radiation') || combined.includes('breathless') || painScore >= 8 || vitals.bp_systolic >= 170)
  ) {
    redFlags.push('High Risk: Acute Coronary Syndrome (ACS) presentation with radiating chest discomfort and autonomic symptoms.');
    triageLevel = 1;
    triageCategory = 'Resuscitation / Immediate Priority';
    triageColor = 'red';
    waitTime = 'Immediate';
  }

  // 2. Severe Respiratory Distress / Hypoxemia
  if (vitals.spo2 && vitals.spo2 <= 92) {
    redFlags.push(`Critical Hypoxemia: Measured SpO2 ${vitals.spo2}% on room air. Requires immediate oxygen therapy evaluation.`);
    if (triageLevel > 2) {
      triageLevel = 2;
      triageCategory = 'Emergent / Priority 2 (Red)';
      triageColor = 'red';
      waitTime = 'Under 5 mins';
    }
  }

  // 3. Severe Hypertensive Crisis / Urgency
  if (vitals.bp_systolic >= 180 || vitals.bp_diastolic >= 110) {
    redFlags.push(`Hypertensive Urgency / Crisis: BP ${vitals.bp_systolic}/${vitals.bp_diastolic} mmHg.`);
    if (triageLevel > 2) {
      triageLevel = 2;
      triageCategory = 'Emergent / Priority 2 (Red)';
      triageColor = 'red';
      waitTime = 'Under 10 mins';
    }
  }

  // 4. Critical Tachycardia or Bradycardia
  if (vitals.pulse && (vitals.pulse >= 130 || vitals.pulse <= 45)) {
    redFlags.push(`Significant Hemodynamic Instability: Pulse rate ${vitals.pulse} bpm.`);
    if (triageLevel > 2) {
      triageLevel = 2;
      triageCategory = 'Emergent / Priority 2 (Red)';
      triageColor = 'red';
      waitTime = 'Under 10 mins';
    }
  }

  // 5. Severe Acute Neurological Symptoms
  if (
    combined.includes('thunderclap') ||
    combined.includes('sudden weakness') ||
    combined.includes('facial droop') ||
    combined.includes('speech difficulty') ||
    combined.includes('loss of consciousness')
  ) {
    redFlags.push('Acute Neurological Red Flag: Sudden-onset deficit requiring rapid Stroke / SAH protocol screening.');
    if (triageLevel > 2) {
      triageLevel = 2;
      triageCategory = 'Emergent / Priority 2 (Red)';
      triageColor = 'red';
      waitTime = 'Under 10 mins';
    }
  }

  // 6. High-Grade Pyrexia / Febrile Illness (Triage 3)
  if (vitals.temp >= 102.0 || combined.includes('high grade fever') || combined.includes('chills')) {
    redFlags.push(`High Grade Pyrexia: Temperature ${vitals.temp || '102+'}°F with chills requiring acute febrile workup.`);
    if (triageLevel > 3) {
      triageLevel = 3;
      triageCategory = 'Urgent / Priority 3 (Yellow)';
      triageColor = 'amber';
      waitTime = '15-25 mins';
    }
  }

  // 7. Marked Hyperglycemia / Hypoglycemia
  if (vitals.blood_sugar && (vitals.blood_sugar >= 300 || vitals.blood_sugar <= 60)) {
    redFlags.push(`Glycemic Alert: Blood Glucose ${vitals.blood_sugar} mg/dL.`);
    if (triageLevel > 3) {
      triageLevel = 3;
      triageCategory = 'Urgent / Priority 3 (Yellow)';
      triageColor = 'amber';
      waitTime = '15-25 mins';
    }
  }

  // 8. Documented Severe Drug Allergies & Brand Cross-Matching
  const allergyMap = {
    'augmentin': 'Penicillin / Amoxicillin-Clavulanate class',
    'amoxicillin': 'Penicillin beta-lactam class',
    'penicillin': 'Penicillin beta-lactam class',
    'combiflam': 'NSAIDs (Ibuprofen / Paracetamol)',
    'voveran': 'NSAIDs (Diclofenac)',
    'dynapar': 'NSAIDs (Diclofenac)',
    'aspirin': 'Salicylates / NSAIDs (Antiplatelet cross-reaction)',
    'ecosprin': 'Aspirin / Salicylates',
    'ciplox': 'Fluoroquinolones (Ciprofloxacin)',
    'sulfa': 'Sulfonamides / Co-trimoxazole'
  };

  if (Array.isArray(drugAllergies) && drugAllergies.length > 0) {
    for (const allergy of drugAllergies) {
      if (typeof allergy === 'string' && allergy.trim().length > 0 && !allergy.includes('No Known Drug Allergies')) {
        const lowerAllergy = allergy.toLowerCase();
        let classNote = '';
        for (const [brand, genericClass] of Object.entries(allergyMap)) {
          if (lowerAllergy.includes(brand)) {
            classNote = ` (Cross-reactive with ${genericClass})`;
            break;
          }
        }
        redFlags.push(`Known Drug Allergy: ${allergy}${classNote}. Verify before prescribing any medication.`);
      }
    }
  }

  return {
    triageLevel,
    triageCategory,
    triageColor,
    waitTime,
    redFlags
  };
};
