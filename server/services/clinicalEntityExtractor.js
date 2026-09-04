/**
 * MediMitra Genuine Clinical NLP & Medical Entity Extraction Engine
 * 
 * Strict Clinical Safety Rules:
 * 1. NEVER invent or fabricate missing dates, diagnoses, medicines, dosages, or reference ranges.
 * 2. If an entity is not present in the raw OCR text, return null / empty list.
 * 3. Abnormal lab values are ONLY flagged when a valid reference range is present in the document text itself.
 * 4. Preserves 100% of the raw OCR text alongside extracted entities.
 */

export const extractClinicalEntities = (rawText = '', docTypeHint = 'prescription') => {
  if (!rawText || !rawText.trim()) {
    return {
      docType: 'Medical Document',
      category: 'General',
      hospitalName: null,
      doctorName: null,
      docDate: null,
      docYear: null,
      diagnosis: null,
      medicines: [],
      investigations: [],
      procedures: [],
      rawTextSummary: 'No readable text was extracted from this document.',
      rawText: '',
      hasStructuredEntities: false
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // 1. Genuinely Extract Document Date
  let docDate = null;
  let docYear = null;

  const datePatterns = [
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/,
    /\b(\d{1,2})[\s\-](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-](\d{2,4})\b/i,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})\b/i,
    /\b(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})\b/
  ];

  // Pass 1: High priority clinical/report dates (strictly prefer Report/Prescription/Visit/Consultation dates)
  const clinicalDateLabelRegex = /(?:Report\s*Date|Prescription\s*Date|Visit\s*Date|Consultation\s*Date|Collection\s*Date|Admission\s*Date|Discharge\s*Date|Date\s*of\s*Consultation|Date\s*of\s*Visit)\s*[:\-]\s*([^\n\r;]+)/i;
  for (const line of lines) {
    const labelMatch = line.match(clinicalDateLabelRegex);
    if (labelMatch && labelMatch[1]) {
      for (const pattern of datePatterns) {
        const match = labelMatch[1].match(pattern);
        if (match) {
          docDate = match[0];
          const yearMatch = match[0].match(/\b(19\d\d|20\d\d)\b/);
          if (yearMatch) {
            docYear = yearMatch[1];
          }
          break;
        }
      }
    }
    if (docDate) break;
  }

  // Pass 2: Generic "Date:" label (excluding Birthdate, Registration, Expiry, MFG)
  if (!docDate) {
    const genericDateLabelRegex = /(?<!(?:Birth|Registration|Expiry|MFG|Valid)\s*)\bDate\s*[:\-]\s*([^\n\r;]+)/i;
    for (const line of lines) {
      if (!/birth|dob|registration|expiry/i.test(line)) {
        const labelMatch = line.match(genericDateLabelRegex);
        if (labelMatch && labelMatch[1]) {
          for (const pattern of datePatterns) {
            const match = labelMatch[1].match(pattern);
            if (match) {
              docDate = match[0];
              const yearMatch = match[0].match(/\b(19\d\d|20\d\d)\b/);
              if (yearMatch) {
                docYear = yearMatch[1];
              }
              break;
            }
          }
        }
      }
      if (docDate) break;
    }
  }

  // Pass 3: Fallback to any line containing a valid date pattern (excluding birthdate lines)
  if (!docDate) {
    for (const line of lines) {
      if (!/birth|dob|born/i.test(line)) {
        for (const pattern of datePatterns) {
          const match = line.match(pattern);
          if (match) {
            docDate = match[0];
            const yearMatch = match[0].match(/\b(19\d\d|20\d\d)\b/);
            if (yearMatch) {
              docYear = yearMatch[1];
            }
            break;
          }
        }
      }
      if (docDate) break;
    }
  }

  // 2. Genuinely Extract Hospital / Healthcare Facility Header
  let hospitalName = null;
  const facilityRegex = /\b(?:hospital(?:s)?|clinic(?:s)?|polyclinic|dispensary|nursing\s+home|medical\s+cent(?:er|re)|health\s+cent(?:er|re)|healthcare|pathlab(?:s)?|laboratory|laboratories|pathology|diagnostics?|diagnostic\s+cent(?:er|re)|institute|medical\s+college|aiims|super\s*speciality|care\s+hospital(?:s)?|multispeciality|multi-speciality)\b/i;

  // Helper to validate a candidate facility line
  const isValidFacilityLine = (line) => {
    if (!line || typeof line !== 'string') return false;
    const clean = line.replace(/^[#*•\-\s:]+/, '').trim();
    if (clean.length < 4 || clean.length > 90) return false;
    const lower = clean.toLowerCase();
    if (/^(?:patient|name|age|sex|gender|date|rx|diagnosis|dx|imp|chief complaint|clinical history|history|past history|vitals|weight|height|allergies)/i.test(lower)) return false;
    if (/^(?:dr\.?|doctor)\s+(?!.*(?:pathlab|clinic|hospital|centre|center|diagnostics|laboratory))/i.test(lower)) return false;
    if (/^\d+$/.test(clean)) return false;
    return true;
  };

  // Pass 1: Contextual labeled facility patterns anywhere in the document
  const facilityLabelRegex = /(?:Facility(?:\s+Name)?|Hospital(?:\s+Name)?|Clinic(?:\s+Name)?|Medical\s+Cent(?:er|re)|Health\s+Cent(?:er|re)|Healthcare(?:\s+Facility)?|Laboratory|Laboratories|PathLabs?|Pathology(?:\s+Lab)?|Diagnostics(?:\s+Cent(?:er|re))?|Diagnostic\s+Centre|Diagnostic\s+Center|Institute|Institution|Medical\s+College)\s*[:\-]\s*([^\n\r,;]{3,80})/i;
  for (const line of lines) {
    const labelMatch = line.match(facilityLabelRegex);
    if (labelMatch && labelMatch[1] && isValidFacilityLine(labelMatch[1])) {
      hospitalName = labelMatch[1].replace(/[^\w\s\.,\-\(\)]/g, '').trim();
      break;
    }
  }

  // Pass 2: Inspect header lines (lines 0 to 12) ranked by top position
  if (!hospitalName) {
    const headerLimit = Math.min(lines.length, 12);
    for (let i = 0; i < headerLimit; i++) {
      const line = lines[i];
      if (isValidFacilityLine(line) && facilityRegex.test(line)) {
        hospitalName = line.replace(/^(?:Facility|Hospital|Clinic|Centre|Center)\s*[:\-]\s*/i, '').replace(/[^\w\s\.,\-\(\)]/g, '').trim();
        break;
      }
    }
  }

  // Pass 3: Search complete document text for prominent facility keywords
  if (!hospitalName) {
    for (let i = 12; i < lines.length; i++) {
      const line = lines[i];
      if (isValidFacilityLine(line) && facilityRegex.test(line)) {
        hospitalName = line.replace(/^(?:Facility|Hospital|Clinic|Centre|Center)\s*[:\-]\s*/i, '').replace(/[^\w\s\.,\-\(\)]/g, '').trim();
        break;
      }
    }
  }

  // 3. Genuinely Extract Doctor Name
  let doctorName = null;
  const docPatterns = [
    /\bDr\.?\s+([A-Za-z\s\.]+)(?:,\s*(MD|MS|MBBS|BAMS|BHMS|DM|MCh|FRCS))?/i,
    /\b(?:Physician|Doctor|Consultant)\s*[:\-]\s*([^\n,]+)/i
  ];
  for (const line of lines) {
    for (const pattern of docPatterns) {
      const match = line.match(pattern);
      if (match) {
        doctorName = match[0].trim();
        break;
      }
    }
    if (doctorName) break;
  }

  // 4. Genuinely Extract Diagnosis / Clinical Impression
  let diagnosis = null;
  const diagnosisPatterns = [
    /(?:Diagnosis|Provisional Diagnosis|Impression|Clinical Evaluation|Known case of)\s*[:\-]\s*([^\n\r;]+)/i,
    /(?:Dx|Imp)\s*[:\-]\s*([^\n\r;]+)/i
  ];
  for (const line of lines) {
    for (const pattern of diagnosisPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        diagnosis = match[1].trim();
        break;
      }
    }
    if (diagnosis) break;
  }

  // 5. Genuinely Extract Medications (Drug name, dosage strength, frequency, instructions)
  const medicines = [];
  const drugFormRegex = /\b(Tab(?:let)?|Cap(?:sule)?|Inj(?:ection)?|Syr(?:up)?|Oint(?:ment)?|Drops|Gel|Susp(?:ension)?|Inhaler)\.?\s+/i;
  const dosagePattern = /\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|IU|units|%))\b/i;
  const frequencyPattern = /\b(1-0-1|1-1-1|1-0-0|0-0-1|0-1-0|OD|BD|TDS|QID|HS|SOS|once\s+daily|twice\s+daily|thrice\s+daily|stat)\b/i;
  const durationPattern = /\b(\d+\s*(?:days|weeks|months|d|w|m))\b/i;
  const instructionPattern = /\b(after\s+meals|before\s+meals|with\s+meals|empty\s+stomach|at\s+bedtime|before\s+breakfast|after\s+food)\b/i;

  // Validation function to reject garbled OCR fragments like "Cap 0 it sa"
  const isValidDrugName = (name) => {
    if (!name || typeof name !== 'string') return false;
    const clean = name.replace(/^(?:Tab(?:let)?|Cap(?:sule)?|Inj(?:ection)?|Syr(?:up)?|Oint(?:ment)?|Drops|Gel|Susp(?:ension)?|Inhaler)\.?\s*/i, '').trim();
    if (clean.length < 3) return false;
    // Must start with an alphabetical letter (not digits or symbols)
    if (!/^[A-Za-z]/.test(clean)) return false;
    // Split into words
    const words = clean.split(/[\s\+\-\/]+/).filter(Boolean);
    if (words.length === 0) return false;
    // Must have at least one substantial word (>= 3 letters)
    const hasSubstantialWord = words.some(w => /^[A-Za-z]{3,}$/.test(w));
    if (!hasSubstantialWord) return false;
    // Check if candidate consists mostly of 1-2 character tokens or isolated digits
    const shortWords = words.filter(w => w.length <= 2 || /\d/.test(w));
    if (shortWords.length >= 2 && shortWords.length >= words.length * 0.6) return false;
    // Disallow common non-drug headers
    if (/^(?:date|name|age|sex|gender|history|diagnosis|vitals|investigation|test|rx|advice|review|follow|patient|doctor)/i.test(clean)) return false;
    return true;
  };

  for (const line of lines) {
    const formMatch = line.match(drugFormRegex);
    if (formMatch) {
      const form = formMatch[1].replace(/\.$/, '');
      const afterForm = line.slice(formMatch.index + formMatch[0].length);

      // Stop candidate name at first occurrence of dosage, frequency, duration, instructions, or trailing punctuation
      const stopPattern = /\b(?:\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|IU|units|%)|1-0-1|1-1-1|1-0-0|0-0-1|0-1-0|OD|BD|TDS|QID|HS|SOS|once\s+daily|twice\s+daily|thrice\s+daily|stat|\d+\s*(?:days|weeks|months|d|w|m)|after\s+meals|before\s+meals|with\s+meals|empty\s+stomach|at\s+bedtime|before\s+breakfast|after\s+food)\b/i;
      const stopIndex = afterForm.search(stopPattern);
      const rawCandidateName = (stopIndex !== -1 ? afterForm.slice(0, stopIndex) : afterForm)
        .replace(/[^\w\s\+\-\/\.]/g, '')
        .trim();

      const fullDrugName = `${form}. ${rawCandidateName}`;
      if (isValidDrugName(fullDrugName)) {
        const dosageMatch = line.match(dosagePattern);
        const freqMatch = line.match(frequencyPattern);
        const durMatch = line.match(durationPattern);
        const instMatch = line.match(instructionPattern);

        medicines.push({
          name: fullDrugName,
          drugName: fullDrugName,
          dosage: dosageMatch ? dosageMatch[1] : null,
          frequency: freqMatch ? freqMatch[1] : null,
          freq: freqMatch ? freqMatch[1] : null,
          duration: durMatch ? durMatch[1] : null,
          instructions: instMatch ? instMatch[1] : null,
          rawLine: line.trim(),
          isClinicianVerified: false,
          verificationStatus: 'MACHINE_EXTRACTED_UNVERIFIED'
        });
      }
    }
  }

  // 6. Genuinely Extract Laboratory Investigations, Observed Values & Reference Ranges
  const investigations = [];
  const commonLabTerms = [
    { key: 'FBS', name: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL' },
    { key: 'PPBS', name: 'Post-Prandial Blood Sugar (PPBS)', unit: 'mg/dL' },
    { key: 'RBS', name: 'Random Blood Sugar (RBS)', unit: 'mg/dL' },
    { key: 'HbA1c', name: 'Glycated Hemoglobin (HbA1c)', unit: '%' },
    { key: 'Hemoglobin', name: 'Hemoglobin (Hb)', unit: 'g/dL' },
    { key: 'Hb', name: 'Hemoglobin (Hb)', unit: 'g/dL' },
    { key: 'Creatinine', name: 'Serum Creatinine', unit: 'mg/dL' },
    { key: 'Blood Urea', name: 'Blood Urea', unit: 'mg/dL' },
    { key: 'Urea', name: 'Blood Urea', unit: 'mg/dL' },
    { key: 'Cholesterol', name: 'Serum Total Cholesterol', unit: 'mg/dL' },
    { key: 'Triglycerides', name: 'Serum Triglycerides', unit: 'mg/dL' },
    { key: 'Bilirubin', name: 'Serum Total Bilirubin', unit: 'mg/dL' },
    { key: 'SGOT', name: 'AST / SGOT', unit: 'U/L' },
    { key: 'SGPT', name: 'ALT / SGPT', unit: 'U/L' },
    { key: 'Platelet', name: 'Platelet Count', unit: '/mcL' },
    { key: 'TLC', name: 'Total Leukocyte Count (WBC)', unit: '/mcL' },
    { key: 'WBC', name: 'Total Leukocyte Count (WBC)', unit: '/mcL' },
    { key: 'ESR', name: 'Erythrocyte Sedimentation Rate (ESR)', unit: 'mm/hr' },
    { key: 'TSH', name: 'Thyroid Stimulating Hormone (TSH)', unit: 'mIU/L' },
    { key: 'Uric Acid', name: 'Serum Uric Acid', unit: 'mg/dL' }
  ];

  for (const line of lines) {
    for (const lab of commonLabTerms) {
      const regex = new RegExp(`\\b${lab.key}\\b`, 'i');
      if (regex.test(line)) {
        // Extract numeric value from this line
        const numMatches = line.match(/\b\d+(?:\.\d+)?\b/g);
        if (numMatches && numMatches.length > 0) {
          const observedValue = numMatches[0];

          // Check if reference range is printed on this line (e.g., "70 - 100" or "< 200" or "0.7 to 1.3")
          const rangeMatch = line.match(/(?:ref(?:erence)?\s*(?:range)?[:\s]*)?([<>]?\s*\d+(?:\.\d+)?\s*(?:-|to)\s*\d+(?:\.\d+)?|<|>|\d+(?:\.\d+)?)/i);
          let refRange = null;
          let isAbnormal = null;

          const explicitRange = line.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)/i);
          const maxOnlyRange = line.match(/(?:<|less than)\s*(\d+(?:\.\d+)?)/i);

          if (explicitRange) {
            const min = parseFloat(explicitRange[1]);
            const max = parseFloat(explicitRange[2]);
            refRange = `${min} - ${max}`;
            const valNum = parseFloat(observedValue);
            if (!isNaN(valNum) && !isNaN(min) && !isNaN(max)) {
              isAbnormal = valNum < min || valNum > max;
            }
          } else if (maxOnlyRange) {
            const max = parseFloat(maxOnlyRange[1]);
            refRange = `< ${max}`;
            const valNum = parseFloat(observedValue);
            if (!isNaN(valNum) && !isNaN(max)) {
              isAbnormal = valNum > max;
            }
          }

          investigations.push({
            testName: lab.name,
            observedValue,
            unit: lab.unit,
            refRange, // STRICT: null if not in document
            isAbnormal, // STRICT: null if no ref range found
            rawLine: line
          });
          break;
        }
      }
    }
  }

  // 7. Genuinely Extract Procedures / Surgeries
  const procedures = [];
  const procedureKeywords = ['procedure', 'laparoscopic', 'appendectomy', 'cholecystectomy', 'excision', 'biopsy', 'angioplasty', 'hernioplasty', 'intubation', 'surgery:'];
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    const isHeaderOrDiag = lineLower.includes('hospital') || lineLower.includes('department of') || lineLower.startsWith('diagnosis:') || lineLower.startsWith('dx:') || lineLower.startsWith('dr.');
    if (!isHeaderOrDiag && procedureKeywords.some(kw => lineLower.includes(kw))) {
      procedures.push({
        procedureName: line.replace(/^(?:Procedure|Surgery)\s*[:\-]\s*/i, '').replace(/[^\w\s\.,\-\(\)]/g, '').trim(),
        date: docDate,
        rawLine: line
      });
    }
  }

  // 8. Classify Document Type & Category
  let docType = 'Prescription';
  let category = 'Prescription';

  const textLower = rawText.toLowerCase();
  if (textLower.includes('discharge summary') || textLower.includes('admission') || textLower.includes('post-operative') || procedures.length > 0) {
    docType = 'Discharge Summary';
    category = 'Surgery';
  } else if (textLower.includes('laboratory') || textLower.includes('pathology') || textLower.includes('biochemistry') || investigations.length > 1) {
    docType = 'Lab Report';
    category = 'Investigation';
  } else if (textLower.includes('radiology') || textLower.includes('x-ray') || textLower.includes('ultrasound') || textLower.includes('ecg') || textLower.includes('ct scan')) {
    docType = 'Diagnostic Investigation';
    category = 'Investigation';
  } else {
    docType = 'Prescription';
    category = 'Prescription';
  }

  return {
    docType,
    category,
    hospitalName,
    doctorName,
    docDate,
    docYear,
    diagnosis,
    medicines,
    investigations,
    procedures,
    rawTextSummary: `Extracted ${docType}${hospitalName ? ` from ${hospitalName}` : ''}${docDate ? ` dated ${docDate}` : ''}.${medicines.length > 0 ? ` ${medicines.length} medicine(s)` : ''}${investigations.length > 0 ? ` ${investigations.length} lab investigation(s)` : ''}.`,
    rawText,
    hasStructuredEntities: medicines.length > 0 || investigations.length > 0 || procedures.length > 0 || Boolean(diagnosis)
  };
};
