/**
 * MediMitra ABDM FHIR R4 Bundle & Resource Generator
 * 
 * Generates official HL7 FHIR Release 4 compliant JSON schemas for NHA ABDM Gateway interoperability.
 */
export const generateFhirBundle = (patientData) => {
  const patientId = patientData.id || 'patient-uuid';
  const bundleId = `bundle-${patientId}-${Date.now()}`;
  const timestamp = new Date().toISOString();

  // 1. FHIR Patient Resource
  const fhirPatient = {
    fullUrl: `urn:uuid:${patientId}`,
    resource: {
      resourceType: 'Patient',
      id: patientId,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient']
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
          value: patientData.abha_id || '91-0000-0000-0000'
        },
        {
          type: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                code: 'MR',
                display: 'Medical Record Number'
              }
            ]
          },
          system: 'https://aiims.edu/mrn',
          value: patientData.token_number || 'MED-001'
        }
      ],
      name: [
        {
          use: 'official',
          text: patientData.name || 'Anonymous Patient'
        }
      ],
      telecom: [
        {
          system: 'phone',
          value: patientData.phone || '9999999999',
          use: 'mobile'
        }
      ],
      gender: (patientData.gender || 'unknown').toLowerCase(),
      address: [
        {
          use: 'home',
          text: patientData.address || 'New Delhi, India'
        }
      ]
    }
  };

  // 2. FHIR Consent Resource
  const fhirConsent = {
    fullUrl: `urn:uuid:consent-${patientId}`,
    resource: {
      resourceType: 'Consent',
      id: `consent-${patientId}`,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Consent']
      },
      status: patientData.consent_status === 'DECLINED' ? 'rejected' : 'active',
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
          display: 'National Health Authority (NHA) / ABDM'
        }
      ],
      policy: [
        {
          uri: 'https://ndhm.gov.in/privacy-policy'
        }
      ]
    }
  };

  // 3. FHIR Observations (Vitals)
  const observations = [];
  if (patientData.vitals) {
    const v = patientData.vitals;
    
    // Blood Pressure
    if (v.bp_systolic && v.bp_diastolic) {
      observations.push({
        fullUrl: `urn:uuid:obs-bp-${patientId}`,
        resource: {
          resourceType: 'Observation',
          id: `obs-bp-${patientId}`,
          status: 'final',
          category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
          code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }] },
          subject: { reference: `urn:uuid:${patientId}` },
          component: [
            {
              code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
              valueQuantity: { value: v.bp_systolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
            },
            {
              code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] },
              valueQuantity: { value: v.bp_diastolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
            }
          ]
        }
      });
    }

    // Oxygen Saturation (SpO2)
    if (v.spo2) {
      observations.push({
        fullUrl: `urn:uuid:obs-spo2-${patientId}`,
        resource: {
          resourceType: 'Observation',
          id: `obs-spo2-${patientId}`,
          status: 'final',
          category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
          code: { coding: [{ system: 'http://loinc.org', code: '2708-6', display: 'Oxygen saturation in Arterial blood' }] },
          subject: { reference: `urn:uuid:${patientId}` },
          valueQuantity: { value: v.spo2, unit: '%', system: 'http://unitsofmeasure.org', code: '%' }
        }
      });
    }
  }

  // 4. FHIR Composition (Clinical OPD Case Sheet Document)
  const fhirComposition = {
    fullUrl: `urn:uuid:composition-${patientId}`,
    resource: {
      resourceType: 'Composition',
      id: `composition-${patientId}`,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord']
      },
      status: patientData.verification_status === 'History Verified' ? 'final' : 'preliminary',
      type: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '371530004',
            display: 'Clinical consultation report'
          }
        ],
        text: 'OPD Clinical Intake & Case Summary'
      },
      subject: {
        reference: `urn:uuid:${patientId}`,
        display: patientData.name
      },
      date: timestamp,
      author: [
        {
          display: patientData.assigned_doctor_name || 'Medical Officer'
        }
      ],
      title: 'Outpatient Consultation Record (MediMitra ABDM FHIR R4)',
      section: [
        {
          title: 'Chief Complaints',
          text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${Array.isArray(patientData.chief_complaints) ? patientData.chief_complaints.join(', ') : (patientData.chief_complaints || 'None')}</p></div>`
          }
        },
        {
          title: 'Clinical Triage & Risk Assessment',
          text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>Triage Level: ${patientData.triage_level} (${patientData.triage_category})</p></div>`
          }
        }
      ]
    }
  };

  return {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      versionId: '1',
      lastUpdated: timestamp,
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle']
    },
    identifier: {
      system: 'https://aiims.gov.in/fhir/bundles',
      value: bundleId
    },
    type: 'document',
    timestamp,
    entry: [
      fhirComposition,
      fhirPatient,
      fhirConsent,
      ...observations
    ]
  };
};
