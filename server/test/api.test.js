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
  console.log('🧪 Starting MediMitra Automated Backend Tests...\n');
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

    // Test 2: Doctor Authentication
    console.log('▶ Test 2: Doctor authentication (/api/auth/login)');
    const loginRes = await makeRequest('/api/auth/login', { method: 'POST' }, {
      username: 'dr.sharma',
      password: 'Doctor@123'
    });
    assert.strictEqual(loginRes.status, 200, 'Login should succeed with 200 OK');
    assert.ok(loginRes.data.token, 'Response should contain a JWT token');
    assert.strictEqual(loginRes.data.user.role, 'DOCTOR', 'User role should be DOCTOR');
    const doctorToken = loginRes.data.token;
    console.log('  ✓ PASSED: Doctor authentication and JWT generation verified.\n');

    // Test 3: Patient Intake Submission with Deterministic Red-Flag Triage
    console.log('▶ Test 3: Patient Intake Submission (/api/patients/intake)');
    const intakePayload = {
      name: 'Vikramaditya Rao',
      age: 58,
      gender: 'Male',
      phone: '9845012345',
      address: 'Banjara Hills, Hyderabad',
      abhaId: '91-9988-7766-5544',
      language: 'Telugu',
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
    assert.strictEqual(intakeRes.data.data.triageLevel, 1, 'Triage should be Level 1 (Resuscitation)');
    assert.strictEqual(intakeRes.data.data.triageColor, 'red', 'Triage color should be red');
    assert.ok(intakeRes.data.data.redFlags.length > 0, 'Red flags should be identified');
    const createdPatientId = intakeRes.data.data.id;
    console.log('  ✓ PASSED: Patient intake & deterministic red-flag triage verified.\n');

    // Test 4: Retrieve Patient Queue
    console.log('▶ Test 4: Retrieve Patient Queue (/api/patients)');
    const queueRes = await makeRequest('/api/patients');
    assert.strictEqual(queueRes.status, 200, 'Queue should return 200 OK');
    assert.ok(Array.isArray(queueRes.data.patients), 'Patients should be an array');
    const foundPatient = queueRes.data.patients.find(p => p.id === createdPatientId);
    assert.ok(foundPatient, 'Created patient should appear in live queue');
    assert.strictEqual(foundPatient.status, 'Waiting', 'Initial status should be Waiting');
    console.log('  ✓ PASSED: Patient queue retrieval verified.\n');

    // Test 5: Doctor Confirm Summary
    console.log('▶ Test 5: Doctor Confirm Clinical Summary (/api/doctor/confirm-summary)');
    const confirmRes = await makeRequest('/api/doctor/confirm-summary', {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` }
    }, {
      patientId: createdPatientId,
      doctorNotes: 'Confirmed acute coronary presentation. STAT ECG ordered.'
    });
    assert.strictEqual(confirmRes.status, 200, 'Confirm summary should return 200 OK');
    assert.strictEqual(confirmRes.data.verificationStatus, 'History Verified', 'Status should be History Verified');
    console.log('  ✓ PASSED: Doctor clinical summary verification verified.\n');

    // Test 6: Export ABDM FHIR R4 Bundle
    console.log('▶ Test 6: ABDM FHIR R4 Bundle Export (/api/fhir/patient/:id)');
    const fhirRes = await makeRequest(`/api/fhir/patient/${createdPatientId}`);
    assert.strictEqual(fhirRes.status, 200, 'FHIR export should return 200 OK');
    assert.strictEqual(fhirRes.data.resourceType, 'Bundle', 'Resource type should be Bundle');
    assert.strictEqual(fhirRes.data.type, 'document', 'Bundle type should be document');
    const patientResource = fhirRes.data.entry.find(e => e.resource.resourceType === 'Patient');
    assert.ok(patientResource, 'FHIR bundle should contain a Patient resource');
    assert.strictEqual(patientResource.resource.name[0].text, 'Vikramaditya Rao', 'Patient name should match');
    console.log('  ✓ PASSED: ABDM FHIR R4 document bundle verified.\n');

    console.log('🎉 ALL AUTOMATED BACKEND TESTS PASSED (6/6)!\n');
  } catch (err) {
    console.error('❌ Test Failure:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    db.close();
  }
}

runTests();
