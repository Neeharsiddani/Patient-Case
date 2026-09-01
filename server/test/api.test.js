import assert from 'assert';
import http from 'http';
import { app } from '../app.js';
import { seedDatabase } from '../db/seed.js';
import { db } from '../db/database.js';

let server;
const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function makeRequest(path, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting MediMitra Automated Backend Multi-Hospital & RBAC Test Suite...\n');
  await seedDatabase();

  server = app.listen(TEST_PORT);

  try {
    // Test 1: Health Check Endpoint
    console.log('▶ Test 1: Health check endpoint (/api/health)');
    const healthRes = await makeRequest('/api/health');
    assert.strictEqual(healthRes.status, 200, 'Health endpoint should return 200 OK');
    assert.strictEqual(healthRes.data.status, 'HEALTHY', 'Status should be HEALTHY');
    assert.strictEqual(healthRes.data.database, 'CONNECTED', 'Database should be CONNECTED');
    console.log('  ✓ PASSED: System health and DB connection verified.\n');

    // Test 2: Hospital Search & Department Directory
    console.log('▶ Test 2: Hospital and Department Discovery (/api/hospitals)');
    const hospRes = await makeRequest('/api/hospitals?search=Hyderabad&limit=50');
    assert.strictEqual(hospRes.status, 200, 'Hospital search should return 200 OK');
    assert.ok(Array.isArray(hospRes.data.hospitals), 'Should return hospital list');
    assert.ok(hospRes.data.hospitals.some(h => h.id === 'hosp-ggh-hyd'), 'GGH should exist');
    assert.ok(hospRes.data.hospitals.some(h => h.id === 'hosp-apollo-hyd'), 'Apollo should exist');

    const deptRes = await makeRequest('/api/hospitals/hosp-ggh-hyd/departments');
    assert.strictEqual(deptRes.status, 200, 'Departments should return 200 OK');
    assert.ok(Array.isArray(deptRes.data.departments), 'Departments should be an array');
    assert.ok(deptRes.data.departments.some(d => d.id === 'dept-ggh-hyd-cardio'), 'Cardiology dept should exist');
    console.log('  ✓ PASSED: Hospital & Department discovery endpoints verified.\n');

    // Test 3: Multi-Hospital Staff Authentication
    console.log('▶ Test 3: Multi-Hospital Staff Authentication (/api/auth/login)');
    
    // Doctor A: Dr. Sharma at GGH (Cardiology, GenMed)
    const docALogin = await makeRequest('/api/auth/login', { method: 'POST' }, {
      username: 'dr.sharma',
      password: 'Doctor@123'
    });
    assert.strictEqual(docALogin.status, 200);
    assert.strictEqual(docALogin.data.user.hospitalId, 'hosp-ggh-hyd');
    const docAToken = docALogin.data.token;

    // Doctor B: Dr. Anand at GGH (Orthopedics ONLY)
    const docBLogin = await makeRequest('/api/auth/login', { method: 'POST' }, {
      username: 'dr.anand',
      password: 'Doctor@123'
    });
    assert.strictEqual(docBLogin.status, 200);
    assert.strictEqual(docBLogin.data.user.hospitalId, 'hosp-ggh-hyd');
    const docBToken = docBLogin.data.token;

    // Doctor C: Dr. Kiran at Apollo (Cardiology ONLY at Apollo)
    const docCLogin = await makeRequest('/api/auth/login', { method: 'POST' }, {
      username: 'dr.kiran',
      password: 'Doctor@123'
    });
    assert.strictEqual(docCLogin.status, 200);
    assert.strictEqual(docCLogin.data.user.hospitalId, 'hosp-apollo-hyd');
    const docCToken = docCLogin.data.token;

    // Admin: GGH Hospital Admin
    const adminLogin = await makeRequest('/api/auth/login', { method: 'POST' }, {
      username: 'admin.ggh',
      password: 'Admin@123'
    });
    assert.strictEqual(adminLogin.status, 200);
    assert.strictEqual(adminLogin.data.user.role, 'HOSPITAL_ADMIN');
    const adminToken = adminLogin.data.token;

    console.log('  ✓ PASSED: Multi-facility clinicians & administrators authenticated.\n');

    // Test 4: Patient Intake Routed to GGH Cardiology
    console.log('▶ Test 4: Patient Intake Routed to GGH Cardiology (/api/patients/intake)');
    const intakePayload = {
      name: 'Vikramaditya Rao',
      age: 58,
      gender: 'Male',
      phone: '9845012345',
      address: 'Banjara Hills, Hyderabad',
      abhaId: '91-9988-7766-5544',
      language: 'Telugu',
      hospitalId: 'hosp-ggh-hyd',
      hospitalName: 'Government General Hospital',
      departmentId: 'dept-ggh-hyd-cardio',
      department: 'Cardiology',
      reasonForVisit: 'Severe chest tightness and cold sweat for 45 mins',
      consentAgreed: true,
      signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      chiefComplaints: ['Chest Pain / Angina', 'Cold Sweating'],
      duration: '45 mins',
      painScore: 9,
      onset: 'Sudden onset during morning walk',
      hpi: { character: 'Crushing substernal pain radiating to jaw and left arm' },
      pastMedicalHistory: ['Hypertension', 'Dyslipidemia'],
      vitals: {
        bp_systolic: 178,
        bp_diastolic: 104,
        pulse: 110,
        spo2: 91,
        temp: 98.4,
        blood_sugar: 185
      }
    };
    const intakeRes = await makeRequest('/api/patients/intake', { method: 'POST' }, intakePayload);
    assert.strictEqual(intakeRes.status, 201, 'Intake should return 201 Created');
    assert.ok(intakeRes.data.data.id, 'Patient ID should be generated');
    assert.strictEqual(intakeRes.data.data.hospitalId, 'hosp-ggh-hyd');
    assert.strictEqual(intakeRes.data.data.departmentId, 'dept-ggh-hyd-cardio');
    assert.strictEqual(intakeRes.data.data.triageLevel, 1, 'Triage should be Level 1 (Resuscitation / High Risk)');
    const createdPatientId = intakeRes.data.data.id;
    console.log('  ✓ PASSED: Case routed to Hospital: GGH, Department: Cardiology.\n');

    // Test 5: Strict Multi-Hospital & Department RBAC Isolation
    console.log('▶ Test 5: Strict Multi-Hospital & Department RBAC Isolation Enforcement');
    
    // Doctor A (GGH Cardiology) queries queue
    const docAQueue = await makeRequest('/api/patients', {
      headers: { Authorization: `Bearer ${docAToken}` }
    });
    assert.strictEqual(docAQueue.status, 200);
    const docAHasPatient = docAQueue.data.patients.some(p => p.id === createdPatientId);
    assert.strictEqual(docAHasPatient, true, 'Doctor A (GGH Cardiology) MUST see the GGH Cardiology case');

    // Doctor B (GGH Orthopedics) queries queue
    const docBQueue = await makeRequest('/api/patients', {
      headers: { Authorization: `Bearer ${docBToken}` }
    });
    assert.strictEqual(docBQueue.status, 200);
    const docBHasPatient = docBQueue.data.patients.some(p => p.id === createdPatientId);
    assert.strictEqual(docBHasPatient, false, 'Doctor B (GGH Ortho) MUST NOT see the GGH Cardiology case');

    // Doctor C (Apollo Cardiology) queries queue
    const docCQueue = await makeRequest('/api/patients', {
      headers: { Authorization: `Bearer ${docCToken}` }
    });
    assert.strictEqual(docCQueue.status, 200);
    const docCHasPatient = docCQueue.data.patients.some(p => p.id === createdPatientId);
    assert.strictEqual(docCHasPatient, false, 'Doctor C (Apollo) MUST NOT see GGH cases');

    // Doctor B directly accessing patient record by ID -> 403 Forbidden
    const docBAccessRes = await makeRequest(`/api/patients/${createdPatientId}`, {
      headers: { Authorization: `Bearer ${docBToken}` }
    });
    assert.strictEqual(docBAccessRes.status, 403, 'Doctor B must be Forbidden (403) from accessing Cardiology record');

    // Doctor C directly accessing patient record by ID -> 403 Forbidden
    const docCAccessRes = await makeRequest(`/api/patients/${createdPatientId}`, {
      headers: { Authorization: `Bearer ${docCToken}` }
    });
    assert.strictEqual(docCAccessRes.status, 403, 'Doctor C must be Forbidden (403) from accessing GGH patient record');

    console.log('  ✓ PASSED: Strict Hospital & Department RBAC isolation verified on backend (403 Forbidden on cross-access).\n');

    // Test 6: Hospital Admin Stats & Doctor Assignment
    console.log('▶ Test 6: Hospital Admin Stats & Doctor Assignment');
    const adminStatsRes = await makeRequest('/api/hospitals/hosp-ggh-hyd/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminStatsRes.status, 200);
    assert.ok(adminStatsRes.data.stats.departmentBreakdown.length > 0);

    const assignRes = await makeRequest('/api/hospitals/hosp-ggh-hyd/assign-doctor', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      patientId: createdPatientId,
      doctorId: docALogin.data.user.id
    });
    assert.strictEqual(assignRes.status, 200, 'Assignment should succeed');
    console.log('  ✓ PASSED: Hospital admin stats and doctor assignment verified.\n');

    // Test 7: Doctor Confirm Clinical Summary
    console.log('▶ Test 7: Doctor Verification of Clinical History (/api/doctor/confirm-summary)');
    const confirmRes = await makeRequest('/api/doctor/confirm-summary', {
      method: 'POST',
      headers: { Authorization: `Bearer ${docAToken}` }
    }, {
      patientId: createdPatientId,
      doctorNotes: 'Confirmed acute coronary presentation. STAT ECG ordered.'
    });
    assert.strictEqual(confirmRes.status, 200, 'Confirm summary should return 200 OK');
    assert.strictEqual(confirmRes.data.verificationStatus, 'History Verified', 'Status should be History Verified');
    console.log('  ✓ PASSED: Doctor clinical summary verification verified.\n');

    // Test 8: Export ABDM FHIR R4 Bundle
    console.log('▶ Test 8: ABDM FHIR R4 Bundle Export (/api/fhir/patient/:id)');
    const fhirRes = await makeRequest(`/api/fhir/patient/${createdPatientId}`, {
      headers: { Authorization: `Bearer ${docAToken}` }
    });
    assert.strictEqual(fhirRes.status, 200, 'FHIR export should return 200 OK');
    assert.strictEqual(fhirRes.data.resourceType, 'Bundle', 'Resource type should be Bundle');
    assert.strictEqual(fhirRes.data.type, 'document', 'Bundle type should be document');
    const patientResource = fhirRes.data.entry.find(e => e.resource.resourceType === 'Patient');
    assert.ok(patientResource, 'FHIR bundle should contain a Patient resource');
    assert.strictEqual(patientResource.resource.name[0].text, 'Vikramaditya Rao', 'Patient name should match');
    console.log('  ✓ PASSED: ABDM FHIR R4 document bundle verified.\n');

    // Test 9: India-Wide Hospital Directory Search, State Filter & Pagination
    console.log('▶ Test 9: India-Wide Directory Search, State Filter & Pagination (/api/hospitals)');
    
    // 9a. Test paginated listing with limits
    const pagedRes = await makeRequest('/api/hospitals?page=1&limit=5');
    assert.strictEqual(pagedRes.status, 200);
    assert.strictEqual(pagedRes.data.limit, 5);
    assert.strictEqual(pagedRes.data.page, 1);
    assert.ok(pagedRes.data.total >= 10, 'Total hospitals in national directory should be >= 10');
    assert.ok(pagedRes.data.totalPages >= 2, 'Total pages should be >= 2');
    assert.ok(pagedRes.data.filters.states.includes('Delhi'), 'Filter should include Delhi');
    assert.ok(pagedRes.data.filters.states.includes('Maharashtra'), 'Filter should include Maharashtra');
    assert.ok(pagedRes.data.filters.states.includes('Telangana'), 'Filter should include Telangana');

    // 9b. Test state filter
    const delhiRes = await makeRequest('/api/hospitals?state=Delhi');
    assert.strictEqual(delhiRes.status, 200);
    assert.ok(delhiRes.data.hospitals.every(h => h.state === 'Delhi'), 'All results must be in Delhi');
    assert.ok(delhiRes.data.hospitals.some(h => h.id === 'hosp-aiims-delhi'), 'AIIMS Delhi must be present');

    // 9c. Test multi-field search (by city, PIN, or name)
    const searchRes = await makeRequest('/api/hospitals?search=400012'); // Mumbai Pincode (Tata Memorial / KEM)
    assert.strictEqual(searchRes.status, 200);
    assert.ok(searchRes.data.hospitals.length > 0, 'Should find hospitals by PIN code');
    assert.ok(searchRes.data.hospitals.some(h => h.city === 'Mumbai'), 'Matching hospital should be in Mumbai');

    console.log('  ✓ PASSED: Multi-field search, state filtering, and pagination verified.\n');

    // Test 10: Healthcare Facility Import API Endpoint
    console.log('▶ Test 10: Hospital Directory Data Import & Ingestion (/api/hospitals/import)');
    const importPayload = {
      overwrite: true,
      source: 'ABDM_HFR_TEST_IMPORT',
      hospitals: [
        {
          id: 'hosp-aiims-rishikesh',
          name: 'AIIMS Rishikesh',
          code: 'AIIMS-RSH',
          facility_type: 'Apex National Institute of Medical Sciences',
          state: 'Uttarakhand',
          district: 'Dehradun',
          city: 'Rishikesh',
          address: 'Virbhadra Road, Rishikesh',
          pincode: '249203',
          hfr_id: 'IN-UK-DEH-AIIMS-001',
          phone: '+91 135 246 2929',
          email: 'director@aiimsrishikesh.edu.in',
          departments: [
            { name: 'General Medicine', code: 'GENMED', room_number: 'OPD 101', description: 'Internal Medicine' },
            { name: 'Cardiology', code: 'CARDIO', room_number: 'OPD 105', description: 'Cardiac Care' }
          ]
        }
      ]
    };
    const importRes = await makeRequest('/api/hospitals/import', { 
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, importPayload);
    assert.strictEqual(importRes.status, 200);
    assert.strictEqual(importRes.data.success, true);
    assert.ok(importRes.data.imported >= 1 || importRes.data.updated >= 1);

    // Verify imported hospital is immediately searchable
    const verifyImport = await makeRequest('/api/hospitals?search=Rishikesh');
    assert.strictEqual(verifyImport.status, 200);
    assert.ok(verifyImport.data.hospitals.some(h => h.code === 'AIIMS-RSH'), 'Imported hospital must be searchable');
    console.log('  ✓ PASSED: Hospital directory bulk import API verified.\n');

    console.log('🎉 ALL MULTI-HOSPITAL, DIRECTORY & RBAC AUTOMATED TESTS PASSED (10/10)!\n');
  } catch (err) {
    console.error('❌ Test Failure:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    db.close();
  }
}

runTests();
