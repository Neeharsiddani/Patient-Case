/**
 * MediMitra ABDM FHIR R4 Bundle & Resource Generator
 * 
 * Compliant with National Health Authority (NHA) / NRCeS India FHIR R4 Profiles:
 * - https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle
 * - https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord
 * - https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient
 * - https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition
 * - https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation
 * - https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentReference
 * - https://nrces.in/ndhm/fhir/r4/StructureDefinition/Consent
 * 
 * Strict Provenance Differentiation:
 * - PATIENT_REPORTED
 * - MACHINE_EXTRACTED
 * - CLINICIAN_VERIFIED
 */

export const PROVENANCE_TAGS = {
  PATIENT: {
    system: 'https://medimitra.health/fhir/provenance-source',
    code: 'PATIENT_REPORTED',
    display: 'Patient-Reported via Kiosk'
  },
  MACHINE: {
    system: 'https://medimitra.health/fhir/provenance-source',
    code: 'MACHINE_EXTRACTED',
    display: 'Machine-Extracted via OCR/NLP'
  },
  CLINICIAN: {
    system: 'https://medimitra.health/fhir/provenance-source',
    code: 'CLINICIAN_VERIFIED',
    display: 'Clinician-Verified by Doctor'
  }
};

/**
 * Generate a complete, valid FHIR R4 Document Bundle for a patient consultation record
 */
export const generateFhirBundle = (patientData) => {
  const patientId = patientData.id || 'patient-uuid';
  const hospitalId = patientData.hospital_id || patientData.hospitalId || 'hosp-ggh-hyd';
  const hospitalName = patientData.hospital_name || patientData.hospitalName || 'Government General Hospital';
  const doctorName = patientData.assigned_doctor_name || patientData.assignedDoctor || 'Attending Medical Officer';
  const doctorId = patientData.assigned_doctor_id || patientData.assignedDoctorId || 'doc-001';
  
  const bundleId = `bundle-${patientId}-${Date.now()}`;
  const timestamp = new Date().toISOString();
  const isVerified = patientData.verification_status === 'History Verified' || patientData.case_status === 'Consultation Completed' || patientData.status === 'Completed';

  const bundleEntries = [];

  // ==========================================
  // 1. FHIR Organization Resource (Hospital)
  // ==========================================
  const orgId = `org-${hospitalId}`;
  const fhirOrg = {
    fullUrl: `urn:uuid:${orgId}`,
    resource: {
      resourceType: 'Organization',
      id: orgId,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Organization']
      },
      identifier: [
        {
          system: 'https://facility.ndhm.gov.in',
          value: patientData.hfr_id || hospitalId
        }
      ],
      name: hospitalName,
      telecom: [
        {
          system: 'phone',
          value: patientData.hospital_phone || '+91 40 2460 0121'
        }
      ],
      address: [
        {
          use: 'work',
          text: patientData.hospital_location || 'Hospital Campus'
        }
      ]
    }
  };

  // ==========================================
  // 2. FHIR Patient Resource
  // ==========================================
  const fhirPatient = {
    fullUrl: `urn:uuid:${patientId}`,
    resource: {
      resourceType: 'Patient',
      id: patientId,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient'],
        tag: [PROVENANCE_TAGS.PATIENT]
      },
      identifier: [
        {
          type: {
            coding: [
              {
                system: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/IdentifierType',
                code: 'ABHA',
                display: 'Ayushman Bharat Health Account Number'
              }
            ]
          },
          system: 'https://healthid.ndhm.gov.in',
          value: patientData.abha_id || patientData.abhaId || 'UNREGISTERED'
        },
        {
          type: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                code: 'MR',
                display: 'Medical Record Number / Token'
              }
            ]
          },
          system: `https://${hospitalId}.gov.in/mrn`,
          value: patientData.token_number || patientData.tokenNumber || `TOKEN-${patientId.slice(0, 8)}`
        }
      ],
      name: [
        {
          use: 'official',
          text: patientData.name || 'Patient'
        }
      ],
      telecom: [
        {
          system: 'phone',
          value: patientData.phone || '',
          use: 'mobile'
        }
      ],
      gender: (patientData.gender || 'unknown').toLowerCase(),
      address: [
        {
          use: 'home',
          text: patientData.address || 'Address on file'
        }
      ]
    }
  };

  // ==========================================
  // 3. FHIR Encounter Resource (OPD Consultation)
  // ==========================================
  const encounterId = `enc-${patientId}`;
  const fhirEncounter = {
    fullUrl: `urn:uuid:${encounterId}`,
    resource: {
      resourceType: 'Encounter',
      id: encounterId,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Encounter']
      },
      status: isVerified ? 'finished' : 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'Ambulatory / Outpatient'
      },
      subject: {
        reference: `urn:uuid:${patientId}`,
        display: patientData.name
      },
      serviceProvider: {
        reference: `urn:uuid:${orgId}`,
        display: hospitalName
      },
      period: {
        start: patientData.created_at || timestamp,
        end: isVerified ? (patientData.updated_at || timestamp) : undefined
      }
    }
  };

  // ==========================================
  // 4. FHIR Consent Resource
  // ==========================================
  const consentId = `consent-${patientId}`;
  const fhirConsent = {
    fullUrl: `urn:uuid:${consentId}`,
    resource: {
      resourceType: 'Consent',
      id: consentId,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Consent'],
        tag: [PROVENANCE_TAGS.PATIENT]
      },
      status: patientData.consent_status === 'DECLINED' ? 'rejected' : patientData.consent_status === 'REVOKED' ? 'inactive' : 'active',
      scope: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/consentscope',
            code: 'patient-privacy',
            display: 'Privacy Consent'
          }
        ]
      },
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/consentcategorycodes',
              code: 'inforequest',
              display: 'Information Request'
            }
          ]
        }
      ],
      patient: {
        reference: `urn:uuid:${patientId}`,
        display: patientData.name
      },
      dateTime: patientData.consent_granted_at || timestamp,
      performer: [
        {
          reference: `urn:uuid:${patientId}`,
          display: patientData.name
        }
      ],
      organization: [
        {
          reference: `urn:uuid:${orgId}`,
          display: hospitalName
        }
      ],
      policy: [
        {
          uri: 'https://ndhm.gov.in/privacy-policy'
        }
      ]
    }
  };

  // ==========================================
  // 5. FHIR Observations (Vital Signs & Labs)
  // ==========================================
  const observations = [];
  const v = patientData.vitals || {};

  // Systolic & Diastolic BP Panel
  if (v.bp_systolic || v.bpSystolic) {
    const sys = Number(v.bp_systolic || v.bpSystolic);
    const dia = Number(v.bp_diastolic || v.bpDiastolic || 80);
    const obsBpId = `obs-bp-${patientId}`;
    
    observations.push({
      fullUrl: `urn:uuid:${obsBpId}`,
      resource: {
        resourceType: 'Observation',
        id: obsBpId,
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation'],
          tag: [PROVENANCE_TAGS.PATIENT]
        },
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
        code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel with all children optional' }] },
        subject: { reference: `urn:uuid:${patientId}` },
        encounter: { reference: `urn:uuid:${encounterId}` },
        effectiveDateTime: timestamp,
        component: [
          {
            code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
            valueQuantity: { value: sys, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] },
            valueQuantity: { value: dia, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
          }
        ]
      }
    });
  }

  // SpO2
  if (v.spo2) {
    const spo2Id = `obs-spo2-${patientId}`;
    observations.push({
      fullUrl: `urn:uuid:${spo2Id}`,
      resource: {
        resourceType: 'Observation',
        id: spo2Id,
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation'],
          tag: [PROVENANCE_TAGS.PATIENT]
        },
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
        code: { coding: [{ system: 'http://loinc.org', code: '2708-6', display: 'Oxygen saturation in Arterial blood' }] },
        subject: { reference: `urn:uuid:${patientId}` },
        encounter: { reference: `urn:uuid:${encounterId}` },
        effectiveDateTime: timestamp,
        valueQuantity: { value: Number(v.spo2), unit: '%', system: 'http://unitsofmeasure.org', code: '%' }
      }
    });
  }

  // Pulse
  if (v.pulse) {
    const pulseId = `obs-pulse-${patientId}`;
    observations.push({
      fullUrl: `urn:uuid:${pulseId}`,
      resource: {
        resourceType: 'Observation',
        id: pulseId,
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation'],
          tag: [PROVENANCE_TAGS.PATIENT]
        },
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
        code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
        subject: { reference: `urn:uuid:${patientId}` },
        encounter: { reference: `urn:uuid:${encounterId}` },
        effectiveDateTime: timestamp,
        valueQuantity: { value: Number(v.pulse), unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' }
      }
    });
  }

  // ==========================================
  // 6. FHIR Conditions (Patient-Reported & Doctor-Verified)
  // ==========================================
  const conditions = [];

  // Patient-Reported Chief Complaints (Provisional Condition)
  const complaints = Array.isArray(patientData.chief_complaints || patientData.chiefComplaints)
    ? (patientData.chief_complaints || patientData.chiefComplaints)
    : [patientData.reason_for_visit || patientData.reasonForVisit || 'General Health Concern'];

  complaints.forEach((comp, idx) => {
    const condId = `cond-complaint-${patientId}-${idx}`;
    conditions.push({
      fullUrl: `urn:uuid:${condId}`,
      resource: {
        resourceType: 'Condition',
        id: condId,
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition'],
          tag: [PROVENANCE_TAGS.PATIENT]
        },
        clinicalStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }]
        },
        verificationStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'provisional', display: 'Provisional' }]
        },
        category: [
          {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'problem-list-item', display: 'Problem List Item' }]
          }
        ],
        code: {
          text: comp
        },
        subject: { reference: `urn:uuid:${patientId}`, display: patientData.name },
        encounter: { reference: `urn:uuid:${encounterId}` },
        recordedDate: timestamp
      }
    });
  });

  // Clinician-Verified Provisional Diagnosis (if doctor verified)
  const doctorNotes = patientData.doctor_notes || patientData.doctorNotes || {};
  if (doctorNotes.provisional_diagnosis || doctorNotes.provisionalDiagnosis) {
    const verifiedCondId = `cond-verified-${patientId}`;
    const diagText = doctorNotes.provisional_diagnosis || doctorNotes.provisionalDiagnosis;
    const icdCodes = doctorNotes.icd10_codes || doctorNotes.icd10 || [];

    const codings = [
      {
        system: 'http://snomed.info/sct',
        code: '186788009',
        display: diagText
      }
    ];

    if (Array.isArray(icdCodes) && icdCodes.length > 0) {
      icdCodes.forEach(code => {
        codings.push({
          system: 'http://hl7.org/fhir/sid/icd-10',
          code: code,
          display: diagText
        });
      });
    }

    conditions.push({
      fullUrl: `urn:uuid:${verifiedCondId}`,
      resource: {
        resourceType: 'Condition',
        id: verifiedCondId,
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition'],
          tag: [PROVENANCE_TAGS.CLINICIAN]
        },
        clinicalStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }]
        },
        verificationStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed', display: 'Confirmed' }]
        },
        category: [
          {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis', display: 'Encounter Diagnosis' }]
          }
        ],
        code: {
          coding: codings,
          text: diagText
        },
        subject: { reference: `urn:uuid:${patientId}`, display: patientData.name },
        encounter: { reference: `urn:uuid:${encounterId}` },
        recordedDate: timestamp
      }
    });
  }

  // ==========================================
  // 7. FHIR AllergyIntolerance Resources
  // ==========================================
  const allergies = [];
  const drugAllergies = patientData.drug_allergies || patientData.drugAllergies || [];
  if (Array.isArray(drugAllergies) && drugAllergies.length > 0) {
    drugAllergies.forEach((allergy, idx) => {
      const allergyId = `allergy-${patientId}-${idx}`;
      allergies.push({
        fullUrl: `urn:uuid:${allergyId}`,
        resource: {
          resourceType: 'AllergyIntolerance',
          id: allergyId,
          meta: {
            profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/AllergyIntolerance'],
            tag: [PROVENANCE_TAGS.PATIENT]
          },
          clinicalStatus: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active', display: 'Active' }]
          },
          verificationStatus: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed', display: 'Confirmed' }]
          },
          type: 'allergy',
          category: ['medication'],
          criticality: 'high',
          code: {
            text: allergy
          },
          patient: { reference: `urn:uuid:${patientId}`, display: patientData.name },
          recordedDate: timestamp
        }
      });
    });
  }

  // ==========================================
  // 8. FHIR DocumentReference Resources (Uploaded OCR Docs)
  // ==========================================
  const documentRefs = [];
  const docs = patientData.documents || patientData.uploaded_documents || [];
  if (Array.isArray(docs) && docs.length > 0) {
    docs.forEach((doc, idx) => {
      const docRefId = `docref-${patientId}-${doc.id || idx}`;
      const isDocVerified = doc.verification_status === 'CLINICIAN_VERIFIED';

      documentRefs.push({
        fullUrl: `urn:uuid:${docRefId}`,
        resource: {
          resourceType: 'DocumentReference',
          id: docRefId,
          meta: {
            profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentReference'],
            tag: [isDocVerified ? PROVENANCE_TAGS.CLINICIAN : PROVENANCE_TAGS.MACHINE]
          },
          status: 'current',
          docStatus: isDocVerified ? 'final' : 'preliminary',
          type: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '371531000',
                display: 'Report of clinical finding'
              }
            ],
            text: doc.doc_type_name || doc.doc_type || 'Medical Document'
          },
          category: [
            {
              coding: [{ system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category', code: 'clinical-note', display: 'Clinical Note' }]
            }
          ],
          subject: { reference: `urn:uuid:${patientId}`, display: patientData.name },
          date: doc.uploaded_at || timestamp,
          description: `Document: ${doc.original_filename || 'Uploaded Medical Record'}. Extraction: ${doc.doc_type || 'Report'}`,
          content: [
            {
              attachment: {
                contentType: doc.mime_type || 'text/plain',
                title: doc.original_filename || 'medical-report.txt',
                data: doc.raw_ocr_text ? Buffer.from(doc.raw_ocr_text).toString('base64') : undefined
              }
            }
          ]
        }
      });
    });
  }

  // ==========================================
  // 9. FHIR Composition (Clinical OPD Case Sheet)
  // ==========================================
  const compositionId = `composition-${patientId}`;
  const sections = [
    {
      title: 'Chief Complaints (Patient-Reported)',
      code: { coding: [{ system: 'http://snomed.info/sct', code: '422843007', display: 'Chief complaint section' }] },
      text: {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${complaints.join(', ')}</p></div>`
      },
      entry: conditions.filter(c => c.resource.category[0].coding[0].code === 'problem-list-item').map(c => ({ reference: c.fullUrl }))
    },
    {
      title: 'Triage & Risk Stratification',
      code: { coding: [{ system: 'http://snomed.info/sct', code: '225399009', display: 'Triage assessment' }] },
      text: {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>Triage Level: ${patientData.triage_level || 4} (${patientData.triage_category || 'Routine / Standard'}).</p></div>`
      }
    },
    {
      title: 'Vital Signs',
      code: { coding: [{ system: 'http://snomed.info/sct', code: '8716-3', display: 'Vital signs section' }] },
      text: {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>BP: ${v.bp_systolic || '--'}/${v.bp_diastolic || '--'} mmHg, Pulse: ${v.pulse || '--'} bpm, SpO2: ${v.spo2 || '--'}%.</p></div>`
      },
      entry: observations.map(o => ({ reference: o.fullUrl }))
    }
  ];

  // AYUSH Section (if AYUSH case)
  if (patientData.ayush_history || patientData.ayushHistory) {
    sections.push({
      title: 'AYUSH / Dashavidha Pariksha Intake',
      code: { coding: [{ system: 'http://snomed.info/sct', code: '371530004', display: 'Ayurvedic Clinical Intake' }] },
      text: {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>Prakriti, Vikriti, Agni, Koshtha, and lifestyle parameters recorded.</p></div>`
      }
    });
  }

  // Clinician Verification Section
  if (isVerified) {
    sections.push({
      title: 'Clinician Verification & Diagnosis',
      code: { coding: [{ system: 'http://snomed.info/sct', code: '28636000', display: 'Provisional diagnosis' }] },
      text: {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>Verified Diagnosis: ${doctorNotes.provisional_diagnosis || 'Clinically confirmed by attending physician.'}</p></div>`
      },
      entry: conditions.filter(c => c.resource.category[0].coding[0].code === 'encounter-diagnosis').map(c => ({ reference: c.fullUrl }))
    });
  }

  const fhirComposition = {
    fullUrl: `urn:uuid:${compositionId}`,
    resource: {
      resourceType: 'Composition',
      id: compositionId,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord'],
        tag: [isVerified ? PROVENANCE_TAGS.CLINICIAN : PROVENANCE_TAGS.PATIENT]
      },
      status: isVerified ? 'final' : 'preliminary',
      type: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '371530004',
            display: 'Clinical consultation report'
          }
        ],
        text: 'OPD Clinical Intake & Case Record'
      },
      subject: {
        reference: `urn:uuid:${patientId}`,
        display: patientData.name
      },
      encounter: {
        reference: `urn:uuid:${encounterId}`
      },
      date: timestamp,
      author: [
        {
          reference: `urn:uuid:user-${doctorId}`,
          display: doctorName
        }
      ],
      custodian: {
        reference: `urn:uuid:${orgId}`,
        display: hospitalName
      },
      title: 'Outpatient Consultation Record (MediMitra ABDM FHIR R4)',
      section: sections
    }
  };

  // Assemble Bundle Entries
  bundleEntries.push(
    fhirComposition,
    fhirPatient,
    fhirOrg,
    fhirEncounter,
    fhirConsent,
    ...observations,
    ...conditions,
    ...allergies,
    ...documentRefs
  );

  return {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      versionId: '1',
      lastUpdated: timestamp,
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle']
    },
    identifier: {
      system: `https://${hospitalId}.gov.in/fhir/bundles`,
      value: bundleId
    },
    type: 'document',
    timestamp,
    entry: bundleEntries
  };
};
