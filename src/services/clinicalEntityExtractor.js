/**
 * MediMitra Client-Side Clinical NLP & Entity Extraction Engine
 * 
 * Strict Clinical Safety Rules:
 * 1. NEVER invent or fabricate missing dates, diagnoses, medicines, dosages, or reference ranges.
 * 2. If an entity is not present in the raw OCR text, return null / empty list.
 * 3. Abnormal lab values are ONLY flagged when a valid reference range is present in the document text itself.
 * 4. Preserves 100% of the raw OCR text alongside extracted entities.
 * 5. Supported Classifications:
 *    - Prescription
 *    - Consultation Note
 *    - Lab Report
 *    - Diagnostic Report
 *    - Pharmacy / Medication Receipt
 *    - Discharge Summary
 *    - Imaging Report
 *    - Referral
 *    - Other Medical Document
 *    - Unknown / Unclassified
 */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

/**
 * Robust clinical date parser and formatter
 * Formats valid dates as "DD MMM YYYY" (e.g., "08 Jun 2026")
 * Eliminates malformed truncated labels like "08-J" or "29-M".
 */
export const parseAndFormatClinicalDate = (dateInput) => {
  if (!dateInput || typeof dateInput !== 'string') {
    return {
      docDate: null,
      docYear: null,
      formattedDate: 'Date not detected',
      year: 'Undated',
      timestamp: 0
    };
  }

  const clean = dateInput.trim();
  let day = null;
  let month = null; // 0-11
  let year = null;

  // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = clean.match(/^(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10) - 1;
    day = parseInt(isoMatch[3], 10);
  }

  // 2. Named month: 08-Jun-2026 or 08 Jun 2026 or 08/Jun/2026
  if (!day) {
    const namedMatch1 = clean.match(/\b(\d{1,2})[\s\-\/\.]([A-Za-z]{3,9})[\s\-\/\.](\d{2,4})\b/);
    if (namedMatch1) {
      day = parseInt(namedMatch1[1], 10);
      const mStr = namedMatch1[2].toLowerCase();
      if (MONTH_MAP[mStr] !== undefined) {
        month = MONTH_MAP[mStr];
        let y = parseInt(namedMatch1[3], 10);
        if (y < 100) y = y < 50 ? 2000 + y : 1900 + y;
        year = y;
      }
    }
  }

  // 3. Named month prefix: Jun 08, 2026 or June 8 2026
  if (!day) {
    const namedMatch2 = clean.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})\b/);
    if (namedMatch2) {
      const mStr = namedMatch2[1].toLowerCase();
      if (MONTH_MAP[mStr] !== undefined) {
        month = MONTH_MAP[mStr];
        day = parseInt(namedMatch2[2], 10);
        let y = parseInt(namedMatch2[3], 10);
        if (y < 100) y = y < 50 ? 2000 + y : 1900 + y;
        year = y;
      }
    }
  }

  // 4. Numeric DD/MM/YYYY or DD-MM-YYYY
  if (!day) {
    const numMatch = clean.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
    if (numMatch) {
      day = parseInt(numMatch[1], 10);
      month = parseInt(numMatch[2], 10) - 1;
      let y = parseInt(numMatch[3], 10);
      if (y < 100) y = y < 50 ? 2000 + y : 1900 + y;
      year = y;

      // Handle MM/DD/YYYY if month > 11 and day <= 12
      if (month > 11 && day <= 12) {
        const temp = day;
        day = month + 1;
        month = temp - 1;
      }
    }
  }

  if (day && month !== null && month >= 0 && month <= 11 && year && year >= 1900 && year <= 2100) {
    const paddedDay = String(day).padStart(2, '0');
    const monthName = MONTH_NAMES[month];
    const formattedDate = `${paddedDay} ${monthName} ${year}`;
    const timestamp = new Date(year, month, day).getTime();
    return {
      docDate: formattedDate,
      docYear: String(year),
      formattedDate,
      year: String(year),
      timestamp: isNaN(timestamp) ? 0 : timestamp
    };
  }

  // Fallback: search for 4-digit year in string
  const yearMatch = clean.match(/\b(19\d\d|20\d\d)\b/);
  const fallbackYear = yearMatch ? yearMatch[1] : null;
  return {
    docDate: clean,
    docYear: fallbackYear,
    formattedDate: clean,
    year: fallbackYear || 'Undated',
    timestamp: fallbackYear ? new Date(parseInt(fallbackYear, 10), 0, 1).getTime() : 0
  };
};

/**
 * Normalizes healthcare facility names across OCR variations
 * e.g. "SUVIDHA HOSPITALS", "(Inside Suvidha Hospitals)", "Suvidha Hospitals" -> "Suvidha Hospitals"
 */
export const normalizeFacilityName = (rawFacility) => {
  if (!rawFacility || typeof rawFacility !== 'string') return null;
  let clean = rawFacility.trim();
  clean = clean.replace(/^[\(\[\{]+|[\)\]\}]+$/g, '').trim();
  clean = clean.replace(/^(?:inside|at|near|opp(?:\.|\s+)|opposite|beside)\s+/i, '').trim();
  clean = clean.replace(/^[#*•\-\s:]+|[#*•\-\s:,;]+$/g, '').trim();
  if (clean.length < 4 || clean.length > 100) return null;

  const words = clean.split(/\s+/);
  const normalizedWords = words.map(word => {
    if (/^[A-Z]{2,5}$/.test(word)) return word;
    if (/^[A-Za-z0-9\-\.]+$/.test(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word;
  });

  return normalizedWords.join(' ') || null;
};

/**
 * Normalizes doctor names from OCR text
 * e.g. "Dr. Priya Nair, MD", "Consultant: Dr Priya Nair" -> "Dr. Priya Nair, MD"
 */
export const normalizeDoctorName = (rawDoctor) => {
  if (!rawDoctor || typeof rawDoctor !== 'string') return null;
  let clean = rawDoctor.trim();
  clean = clean.replace(/^[\(\[\{]+|[\)\]\}]+$/g, '').trim();
  clean = clean.replace(/^(?:physician|doctor|consultant|treating\s+doctor|attending\s+physician)\s*[:\-]\s*/i, '').trim();

  if (!/^dr\.?\s+/i.test(clean)) {
    clean = `Dr. ${clean}`;
  } else {
    clean = clean.replace(/^dr\.?\s*/i, 'Dr. ');
  }
  clean = clean.replace(/[#*•\-\s:,;]+$/, '').trim();

  const knownDegrees = new Set(['MD', 'MS', 'MBBS', 'BAMS', 'BHMS', 'DM', 'MCH', 'FRCS', 'DNB', 'MRCP', 'DGO', 'DCH']);
  clean = clean.split(/(\s+|,\s*)/).map(part => {
    const upper = part.trim().toUpperCase();
    if (knownDegrees.has(upper)) return upper;
    if (/^[A-Z]{2,}$/.test(part) && part !== 'DR.') {
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }
    return part;
  }).join('');

  return clean || null;
};

export const extractClinicalEntities = (rawText = '', docTypeHint = null) => {
  if (!rawText || !rawText.trim()) {
    return {
      docType: 'Unknown / Unclassified',
      category: 'Uncategorized',
      hospitalName: null,
      doctorName: null,
      docDate: null,
      docYear: null,
      docTimestamp: 0,
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

  // 1. Genuinely Extract Clinical Document Date
  let rawDateCandidate = null;
  const datePatterns = [
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/,
    /\b(\d{1,2})[\s\-](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-](\d{2,4})\b/i,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})\b/i,
    /\b(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})\b/
  ];

  const clinicalDateLabelRegex = /(?:Report\s*Date|Prescription\s*Date|Visit\s*Date|Consultation\s*Date|Collection\s*Date|Admission\s*Date|Discharge\s*Date|Date\s*of\s*Consultation|Date\s*of\s*Visit|Investigation\s*Date)\s*[:\-]\s*([^\n\r;]+)/i;
  for (const line of lines) {
    const labelMatch = line.match(clinicalDateLabelRegex);
    if (labelMatch && labelMatch[1]) {
      for (const pattern of datePatterns) {
        const match = labelMatch[1].match(pattern);
        if (match) {
          rawDateCandidate = match[0];
          break;
        }
      }
    }
    if (rawDateCandidate) break;
  }

  if (!rawDateCandidate) {
    const genericDateLabelRegex = /(?<!(?:Birth|Registration|Expiry|MFG|Valid|DOB)\s*)\bDate\s*[:\-]\s*([^\n\r;]+)/i;
    for (const line of lines) {
      if (!/birth|dob|born|registration|expiry|mfg/i.test(line)) {
        const labelMatch = line.match(genericDateLabelRegex);
        if (labelMatch && labelMatch[1]) {
          for (const pattern of datePatterns) {
            const match = labelMatch[1].match(pattern);
            if (match) {
              rawDateCandidate = match[0];
              break;
            }
          }
        }
      }
      if (rawDateCandidate) break;
    }
  }

  if (!rawDateCandidate) {
    for (const line of lines) {
      if (!/birth|dob|born|registered|registration|valid\s+till|expiry/i.test(line)) {
        for (const pattern of datePatterns) {
          const match = line.match(pattern);
          if (match) {
            rawDateCandidate = match[0];
            break;
          }
        }
      }
      if (rawDateCandidate) break;
    }
  }

  const dateParsed = parseAndFormatClinicalDate(rawDateCandidate);
  const docDate = dateParsed.docDate;
  const docYear = dateParsed.docYear;
  const docTimestamp = dateParsed.timestamp;

  // 2. Genuinely Extract Facility Name
  let rawHospitalCandidate = null;
  const facilityRegex = /\b(?:hospital(?:s)?|clinic(?:s)?|polyclinic|dispensary|nursing\s+home|medical\s+cent(?:er|re)|health\s+cent(?:er|re)|healthcare|pathlab(?:s)?|laboratory|laboratories|pathology|diagnostics?|diagnostic\s+cent(?:er|re)|institute|medical\s+college|aiims|super\s*speciality|care\s+hospital(?:s)?|multispeciality|multi-speciality)\b/i;

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

  const facilityLabelRegex = /(?:Facility(?:\s+Name)?|Hospital(?:\s+Name)?|Clinic(?:\s+Name)?|Medical\s+Cent(?:er|re)|Health\s+Cent(?:er|re)|Healthcare(?:\s+Facility)?|Laboratory|Laboratories|PathLabs?|Pathology(?:\s+Lab)?|Diagnostics(?:\s+Cent(?:er|re))?|Diagnostic\s+Centre|Diagnostic\s+Center|Institute|Institution|Medical\s+College)\s*[:\-]\s*([^\n\r,;]{3,80})/i;
  for (const line of lines) {
    const labelMatch = line.match(facilityLabelRegex);
    if (labelMatch && labelMatch[1] && isValidFacilityLine(labelMatch[1])) {
      rawHospitalCandidate = labelMatch[1].replace(/[^\w\s\.,\-\(\)]/g, '').trim();
      break;
    }
  }

  if (!rawHospitalCandidate) {
    const headerLimit = Math.min(lines.length, 12);
    for (let i = 0; i < headerLimit; i++) {
      const line = lines[i];
      if (isValidFacilityLine(line) && facilityRegex.test(line)) {
        rawHospitalCandidate = line.replace(/^(?:Facility|Hospital|Clinic|Centre|Center)\s*[:\-]\s*/i, '').replace(/[^\w\s\.,\-\(\)]/g, '').trim();
        break;
      }
    }
  }

  if (!rawHospitalCandidate) {
    for (let i = 12; i < lines.length; i++) {
      const line = lines[i];
      if (isValidFacilityLine(line) && facilityRegex.test(line)) {
        rawHospitalCandidate = line.replace(/^(?:Facility|Hospital|Clinic|Centre|Center)\s*[:\-]\s*/i, '').replace(/[^\w\s\.,\-\(\)]/g, '').trim();
        break;
      }
    }
  }

  const hospitalName = normalizeFacilityName(rawHospitalCandidate);

  // 3. Genuinely Extract Doctor Name
  let rawDoctorCandidate = null;
  const docPatterns = [
    /\bDr\.?\s+([A-Za-z\s\.]+)(?:,\s*(MD|MS|MBBS|BAMS|BHMS|DM|MCh|FRCS|DNB))?/i,
    /\b(?:Physician|Doctor|Consultant)\s*[:\-]\s*([^\n,]+)/i
  ];
  for (const line of lines) {
    for (const pattern of docPatterns) {
      const match = line.match(pattern);
      if (match) {
        rawDoctorCandidate = match[0].trim();
        break;
      }
    }
    if (rawDoctorCandidate) break;
  }

  const doctorName = normalizeDoctorName(rawDoctorCandidate);

  // 4. Genuinely Extract Diagnosis / Clinical Impression
  let diagnosis = null;
  const diagnosisPatterns = [
    /(?:Provisional\s+Diagnosis|Final\s+Diagnosis|Diagnosis|Impression|Clinical\s+Evaluation|Known\s+case\s+of)\s*[:\-]\s*([^\n\r;]+)/i,
    /(?<![A-Za-z0-9])(?:Dx|Imp)\s*[:\-]\s*([^\n\r;]+)/i
  ];

  for (const line of lines) {
    if (/^(?:chief\s+complaint|complaint|c\/o|symptoms?|reason\s+for\s+visit|history\s+of\s+present)/i.test(line)) {
      continue;
    }
    for (const pattern of diagnosisPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim().replace(/[#*•;]+$/, '').trim();
        if (!/^(?:digitized\s+clinical\s+record|clinical\s+record|medical\s+document|record|document|n\/a|nil|none)$/i.test(candidate) && candidate.length >= 3) {
          diagnosis = candidate;
          break;
        }
      }
    }
    if (diagnosis) break;
  }

  // 5. Genuinely Extract Prescription Medications
  const medicines = [];
  const drugFormRegex = /\b(Tab(?:let)?|Cap(?:sule)?|Inj(?:ection)?|Syr(?:up)?|Oint(?:ment)?|Drops|Gel|Susp(?:ension)?|Inhaler)\.?\s+/i;
  const dosagePattern = /\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|IU|units|%))\b/i;
  const frequencyPattern = /\b(1-0-1|1-1-1|1-0-0|0-0-1|0-1-0|OD|BD|TDS|QID|HS|SOS|once\s+daily|twice\s+daily|thrice\s+daily|stat)\b/i;
  const durationPattern = /\b(\d+\s*(?:days|weeks|months|d|w|m))\b/i;
  const instructionPattern = /\b(after\s+meals|before\s+meals|with\s+meals|empty\s+stomach|at\s+bedtime|before\s+breakfast|after\s+food)\b/i;

  const isValidDrugName = (name) => {
    if (!name || typeof name !== 'string') return false;
    const clean = name.replace(/^(?:Tab(?:let)?|Cap(?:sule)?|Inj(?:ection)?|Syr(?:up)?|Oint(?:ment)?|Drops|Gel|Susp(?:ension)?|Inhaler)\.?\s*/i, '').trim();
    if (clean.length < 3) return false;
    if (!/^[A-Za-z]/.test(clean)) return false;
    const words = clean.split(/[\s\+\-\/]+/).filter(Boolean);
    if (words.length === 0) return false;
    const hasSubstantialWord = words.some(w => /^[A-Za-z]{3,}$/.test(w));
    if (!hasSubstantialWord) return false;
    const shortWords = words.filter(w => w.length <= 2 || /\d/.test(w));
    if (shortWords.length >= 2 && shortWords.length >= words.length * 0.6) return false;
    if (/^(?:date|name|age|sex|gender|history|diagnosis|vitals|investigation|test|rx|advice|review|follow|patient|doctor)/i.test(clean)) return false;
    return true;
  };

  for (const line of lines) {
    const formMatch = line.match(drugFormRegex);
    if (formMatch) {
      const form = formMatch[1].replace(/\.$/, '');
      const afterForm = line.slice(formMatch.index + formMatch[0].length);

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

  // 6. Genuinely Extract Lab Investigations
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
        const numMatches = line.match(/\b\d+(?:\.\d+)?\b/g);
        if (numMatches && numMatches.length > 0) {
          const observedValue = numMatches[0];

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
            name: lab.name,
            testName: lab.name,
            value: observedValue,
            observedValue,
            unit: lab.unit,
            refRange,
            isAbnormal: isAbnormal === true,
            status: isAbnormal === true ? 'HIGH' : isAbnormal === false ? 'NORMAL' : 'RECORDED',
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

  // 8. Evidence-Based 10-Class Document Classification
  const textLower = rawText.toLowerCase();

  // 1. Discharge Summary
  const isDischarge = (
    textLower.includes('discharge summary') ||
    textLower.includes('discharge card') ||
    textLower.includes('discharge certificate') ||
    textLower.includes('discharge note') ||
    textLower.includes('post-operative') ||
    textLower.includes('post-op') ||
    (procedures.length > 0 && (textLower.includes('surgery') || textLower.includes('cholecystectomy') || textLower.includes('appendectomy'))) ||
    (textLower.includes('date of admission') && textLower.includes('date of discharge')) ||
    (textLower.includes('inpatient') && (textLower.includes('course in hospital') || textLower.includes('admission note')))
  );

  // 2. Pharmacy / Medication Receipt
  const isPharmacyReceipt = (
    /\b(?:pharmacy|chemist(?:s)?|drug\s+store|medical\s+store|retail\s+invoice|cash\s+memo|bill\s+of\s+supply|tax\s+invoice|medication\s+receipt|pharmacy\s+bill)\b/i.test(textLower) ||
    ((textLower.includes('total amount') || textLower.includes('net amount')) && (textLower.includes('mrp') || textLower.includes('batch') || textLower.includes('qty')))
  );

  // 3. Lab Report
  const isLab = (
    textLower.includes('laboratory report') ||
    textLower.includes('lab report') ||
    textLower.includes('pathology report') ||
    textLower.includes('biochemistry report') ||
    textLower.includes('hematology report') ||
    textLower.includes('blood examination') ||
    textLower.includes('urine examination') ||
    textLower.includes('lipid profile') ||
    textLower.includes('complete blood count') ||
    textLower.includes('liver function test') ||
    textLower.includes('kidney function test') ||
    textLower.includes('thyroid profile') ||
    (investigations.length > 0 && (
      textLower.includes('reference interval') ||
      textLower.includes('biological reference') ||
      textLower.includes('reference range') ||
      textLower.includes('specimen') ||
      textLower.includes('laboratory') ||
      textLower.includes('pathology')
    ))
  );

  // 4. Imaging Report
  const isImaging = (
    textLower.includes('imaging report') ||
    textLower.includes('radiology report') ||
    textLower.includes('x-ray') ||
    textLower.includes('ultrasound') ||
    textLower.includes('ultrasonography') ||
    textLower.includes('usg report') ||
    textLower.includes('ct scan') ||
    textLower.includes('computed tomography') ||
    textLower.includes('mri report') ||
    textLower.includes('magnetic resonance') ||
    textLower.includes('mammography') ||
    textLower.includes('doppler study')
  );

  // 5. Diagnostic Report
  const isDiagnostic = (
    textLower.includes('diagnostic report') ||
    textLower.includes('electrocardiogram') ||
    textLower.includes('ecg report') ||
    textLower.includes('echocardiogram') ||
    textLower.includes('2d echo') ||
    textLower.includes('eeg report') ||
    textLower.includes('endoscopy report') ||
    textLower.includes('colonoscopy report') ||
    textLower.includes('tmt report') ||
    textLower.includes('spirometry') ||
    textLower.includes('audiometry')
  );

  // 6. Referral
  const isReferral = (
    textLower.includes('referral letter') ||
    textLower.includes('referral note') ||
    textLower.includes('referral slip') ||
    textLower.includes('referred to') ||
    textLower.includes('referred by') ||
    textLower.includes('kindly evaluate')
  );

  // 7. Consultation Note
  const isConsultationNote = (
    textLower.includes('consultation note') ||
    textLower.includes('clinical note') ||
    textLower.includes('progress note') ||
    textLower.includes('doctor note') ||
    textLower.includes('opd consultation') ||
    textLower.includes('outpatient consultation') ||
    textLower.includes('case sheet') ||
    textLower.includes('history & physical') ||
    textLower.includes('history and physical') ||
    (textLower.includes('chief complaint') && textLower.includes('assessment')) ||
    (textLower.includes('plan of care') && doctorName)
  );

  // 8. Prescription (Explicit Rx markers required - never default)
  const rxSymbolRegex = /(?:℞|\brx\b|\brx\s*:|\br\/x\b)/i;
  const isPrescription = (
    rxSymbolRegex.test(rawText) ||
    textLower.includes('prescription') ||
    textLower.includes('prescribed by') ||
    textLower.includes('rx order') ||
    textLower.includes('prescription slip') ||
    textLower.includes('treatment sheet') ||
    textLower.includes('medication order')
  );

  let docType = 'Unknown / Unclassified';
  let category = 'Uncategorized';

  if (isDischarge) {
    docType = 'Discharge Summary';
    category = 'Discharge / Inpatient';
  } else if (isPharmacyReceipt) {
    docType = 'Pharmacy / Medication Receipt';
    category = 'Pharmacy';
  } else if (isLab) {
    docType = 'Lab Report';
    category = 'Investigation';
  } else if (isImaging) {
    docType = 'Imaging Report';
    category = 'Investigation';
  } else if (isDiagnostic) {
    docType = 'Diagnostic Report';
    category = 'Investigation';
  } else if (isReferral) {
    docType = 'Referral';
    category = 'Referral';
  } else if (isConsultationNote) {
    docType = 'Consultation Note';
    category = 'Consultation';
  } else if (isPrescription) {
    docType = 'Prescription';
    category = 'Prescription';
  } else if (procedures.length > 0 || investigations.length > 0 || medicines.length > 0 || hospitalName || doctorName || diagnosis) {
    docType = 'Other Medical Document';
    category = 'Medical Record';
  } else {
    docType = 'Unknown / Unclassified';
    category = 'Uncategorized';
  }

  return {
    docType,
    category,
    hospitalName,
    doctorName,
    docDate,
    docYear,
    docTimestamp,
    diagnosis,
    medicines,
    investigations,
    procedures,
    rawTextSummary: `Extracted ${docType}${hospitalName ? ` from ${hospitalName}` : ''}${docDate ? ` dated ${docDate}` : ''}.${medicines.length > 0 ? ` ${medicines.length} medicine(s)` : ''}${investigations.length > 0 ? ` ${investigations.length} lab investigation(s)` : ''}.`,
    rawText,
    hasStructuredEntities: medicines.length > 0 || investigations.length > 0 || procedures.length > 0 || Boolean(diagnosis)
  };
};
