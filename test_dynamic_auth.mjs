// Comprehensive E2E Verification Script for dynamic patient & doctor auth, consent, and records
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('========================================================');
  console.log('STARTING DYNAMIC AUTH & WORKFLOW COMPREHENSIVE TESTS');
  console.log('========================================================');
  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, message) {
    testsTotal++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // Generate unique test suffix to ensure run-to-run idempotency
  const uid = Math.floor(1000 + Math.random() * 9000);
  const patientPhone = `98765${uid}`;
  const patientEmail = `drithi_${uid}@example.com`;
  const doctorReg = `NMC-2024-${uid}`;
  const doctorPhone = `98112${uid}`;

  // 1. Dynamic Patient Registration (OTP flow)
  console.log('\n[1] Testing Dynamic Patient Registration (/api/auth/register-patient)...');
  const patientData = {
    fullName: `Drithi Verma ${uid}`,
    dateOfBirth: '1995-06-15',
    gender: 'Female',
    phone: patientPhone,
    email: patientEmail,
    address: 'Indiranagar, Bengaluru, Karnataka',
    password: 'Password123!',
    autoVerify: false // Test full OTP verification flow
  };

  const regPatientRes = await fetch(`${BASE_URL}/auth/register-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData)
  });
  const regPatientJson = await regPatientRes.json();
  if (regPatientRes.status !== 201) {
    console.error('Registration failed with response:', regPatientRes.status, regPatientJson);
  }
  assert(regPatientRes.status === 201, `Patient registered successfully: ${regPatientJson.message}`);
  assert(regPatientJson.patient && regPatientJson.patient.id, 'Patient returned has valid ID');
  assert(regPatientJson.patient.abha_id && regPatientJson.patient.abha_id.length === 17, `Patient has 14-digit hyphenated ABHA: ${regPatientJson.patient.abha_id}`);
  assert(regPatientJson.patient.abha_address.includes('@'), `Patient has valid ABHA address: ${regPatientJson.patient.abha_address}`);
  assert(Boolean(regPatientJson.otpPreview), `Visual simulated OTP received: ${regPatientJson.otpPreview}`);
  
  const newPatientId = regPatientJson.patient.id;
  const newUserId = regPatientJson.userId;
  const otpCode = regPatientJson.otpPreview;

  // 2. Test Login Before OTP Verification (should require verification)
  console.log('\n[2] Testing Patient Login before OTP verification...');
  const preVerifyLoginRes = await fetch(`${BASE_URL}/auth/login-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: patientPhone,
      password: 'Password123!'
    })
  });
  const preVerifyLoginJson = await preVerifyLoginRes.json();
  assert((preVerifyLoginRes.status === 403 || preVerifyLoginRes.status === 401) && preVerifyLoginJson.requiresVerification, 'Correctly prevented unverified patient login with requiresVerification=true');

  // 3. Complete ABDM Phone OTP Verification
  console.log('\n[3] Testing ABDM Phone OTP Verification (/api/auth/verify-patient)...');
  const latestOtp = preVerifyLoginJson.otpPreview || otpCode;
  const verifyRes = await fetch(`${BASE_URL}/auth/verify-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: newUserId,
      phone: patientPhone,
      otp: latestOtp
    })
  });
  const verifyJson = await verifyRes.json();
  assert(verifyRes.status === 200, `Patient OTP verified: ${verifyJson.message}`);
  assert(verifyJson.patient.id === newPatientId, 'Verified patient ID matches');

  // 4. Test Dynamic Patient Login Post-Verification
  console.log('\n[4] Testing Patient Login with Mobile & Password (/api/auth/login-patient)...');
  const loginPatientRes = await fetch(`${BASE_URL}/auth/login-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: patientPhone,
      password: 'Password123!'
    })
  });
  const loginPatientJson = await loginPatientRes.json();
  assert(loginPatientRes.status === 200, 'New patient logged in successfully with mobile and password');
  assert(loginPatientJson.patient.id === newPatientId, 'Logged-in patient ID matches newly registered patient');

  // 5. Test Backward Compatibility: Seed Patient Login (Ravi Kumar)
  console.log('\n[5] Testing Seed Patient Login Backward Compatibility (Ravi Kumar)...');
  const loginRaviRes = await fetch(`${BASE_URL}/auth/login-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'ravi.kumar@abdm',
      password: 'password123'
    })
  });
  const loginRaviJson = await loginRaviRes.json();
  assert(loginRaviRes.status === 200, `Seed patient logged in: ${loginRaviJson.patient.full_name}`);

  // 6. Dynamic Doctor Registration
  console.log('\n[6] Testing Doctor Registration (/api/auth/register-doctor)...');
  const doctorData = {
    doctorName: `Dr. Vikram Seth ${uid}`,
    registrationNumber: doctorReg,
    specialty: 'Cardiology',
    medicalCouncil: 'Karnataka Medical Council',
    qualification: 'MBBS, MD (Cardiology)',
    facilityName: 'Apex Heart Hospital',
    type: 'hospital',
    district: 'Bengaluru Urban',
    phone: doctorPhone,
    password: 'DocPassword123!',
    autoVerify: true
  };

  const regDocRes = await fetch(`${BASE_URL}/auth/register-doctor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doctorData)
  });
  const regDocJson = await regDocRes.json();
  if (regDocRes.status !== 201) {
    console.error('Doctor registration failed with status:', regDocRes.status, regDocJson);
  }
  assert(regDocRes.status === 201, `Doctor registered successfully: ${regDocJson.message}`);
  assert(regDocJson.is_verified === 1, 'Doctor credentials verified via NMC Registry auto-check');
  const newDoctorId = regDocJson.providerId;

  // 7. Dynamic Doctor Login
  console.log('\n[7] Testing Doctor Login (/api/auth/login-doctor)...');
  const loginDocRes = await fetch(`${BASE_URL}/auth/login-doctor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: doctorReg,
      password: 'DocPassword123!'
    })
  });
  const loginDocJson = await loginDocRes.json();
  assert(loginDocRes.status === 200, `New doctor logged in: ${loginDocJson.doctor.name}`);
  assert(loginDocJson.doctor.id === newDoctorId, 'Doctor ID matches registration');

  // 8. Backward Compatibility: Seed Doctor Login (TS-PHC-0001)
  console.log('\n[8] Testing Seed Doctor Login (TS-PHC-0001)...');
  const loginReddyRes = await fetch(`${BASE_URL}/auth/login-doctor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'TS-PHC-0001',
      password: 'password123'
    })
  });
  const loginReddyJson = await loginReddyRes.json();
  assert(loginReddyRes.status === 200, `Seed doctor logged in: ${loginReddyJson.doctor.name}`);

  // 9. Add Medical Records for New Patient (Allergy & Condition)
  console.log('\n[9] Adding Baseline Medical Records for New Patient...');
  const addAllergyRes = await fetch(`${BASE_URL}/allergies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: newPatientId,
      substance: 'Penicillin',
      reaction: 'Cutaneous hives and itching',
      severity: 'moderate'
    })
  });
  assert(addAllergyRes.status === 201, 'Allergy record created for new patient');

  const addDiagRes = await fetch(`${BASE_URL}/diagnoses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: newPatientId,
      condition_name: 'Mild Bronchial Asthma',
      clinical_status: 'active'
    })
  });
  assert(addDiagRes.status === 201, 'Diagnosis record created for new patient');

  // 10. Doctor Requests Consent for New Patient
  console.log('\n[10] Doctor Requests Consent for New Patient (/api/consents/request)...');
  const consentReqRes = await fetch(`${BASE_URL}/consents/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId: newPatientId,
      requesterId: newDoctorId,
      requesterName: `Dr. Vikram Seth ${uid}`,
      facilityId: '10000000-0000-0000-0000-000000000001',
      purpose: 'CARE_MANAGEMENT',
      hiTypes: ['Prescription', 'DiagnosticReport', 'OPDRecord'],
      expireMinutes: 1440
    })
  });
  const consentReqJson = await consentReqRes.json();
  assert(consentReqRes.status === 200, `Consent requested with Artifact ID: ${consentReqJson.consentArtifactId}`);
  const consentId = consentReqJson.consentId;

  // 11. Patient Checks Pending Consents
  console.log('\n[11] Checking Pending Consent Count (/api/consents/pending-count)...');
  const countRes = await fetch(`${BASE_URL}/consents/pending-count?patientId=${newPatientId}`);
  const countJson = await countRes.json();
  assert(countJson.pendingCount >= 1, `Pending consent count is ${countJson.pendingCount}`);

  // 12. Patient Approves Consent
  console.log('\n[12] Patient Approves Consent (/api/consents/respond)...');
  const respondRes = await fetch(`${BASE_URL}/consents/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consentId: consentId,
      action: 'APPROVE',
      patientId: newPatientId
    })
  });
  const respondJson = await respondRes.json();
  assert(respondRes.status === 200, `Consent response accepted with status: ${respondJson.status}`);

  // 13. Doctor Accesses Patient Records via Consent
  console.log('\n[13] Doctor Accesses Health Records for Patient (/api/patient-records/:id)...');
  const accessRes = await fetch(`${BASE_URL}/patient-records/${newPatientId}?providerId=${newDoctorId}&consentId=${consentId}`);
  const accessJson = await accessRes.json();
  assert(accessRes.status === 200, 'Health records accessed successfully by doctor');
  assert(accessJson.allergies && accessJson.allergies.some(a => a.substance === 'Penicillin'), 'Doctor sees patient Penicillin allergy');
  assert(accessJson.diagnoses && accessJson.diagnoses.some(d => d.condition_name === 'Mild Bronchial Asthma'), 'Doctor sees patient Mild Bronchial Asthma diagnosis');

  // 14. Doctor Issues Prescription for Patient
  console.log('\n[14] Doctor Issues Prescription for Patient (/api/prescriptions)...');
  const rxRes = await fetch(`${BASE_URL}/prescriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId: newPatientId,
      providerId: newDoctorId,
      encounterType: 'OPD_CONSULTATION',
      medications: [
        {
          medicationName: 'Salbutamol Inhaler 100mcg',
          dosage: '2 puffs',
          frequency: 'PRN (As needed)',
          duration: '30 days',
          instructions: 'Inhale 2 puffs during sudden shortness of breath'
        }
      ],
      notes: 'Controlled asthma symptoms. Avoid cold air triggers.'
    })
  });
  const rxJson = await rxRes.json();
  assert(rxRes.status === 201, `Prescription issued with number: ${rxJson.prescriptionNumber}`);

  // 15. Check Patient View of Prescription
  console.log('\n[15] Patient Views Prescriptions (/api/patients/:id/records)...');
  const patientRecordsRes = await fetch(`${BASE_URL}/patients/${newPatientId}/records`);
  const patientRecordsJson = await patientRecordsRes.json();
  assert(patientRecordsJson.prescriptions.length >= 1, `Patient has ${patientRecordsJson.prescriptions.length} prescription(s)`);
  assert(patientRecordsJson.prescriptions.some(p => p.prescription_number === rxJson.prescriptionNumber), 'Newly issued prescription is present in patient record');

  console.log(`\n========================================================`);
  console.log(`ALL 15 INTEGRATION TESTS PASSED SUCCESSFULLY! (${testsPassed}/${testsTotal})`);
  console.log(`Dynamic Patient & Doctor Registration & Auth is 100% operational!`);
  console.log(`========================================================`);
}

runTests().catch(err => {
  console.error('\nTest runner failed:', err);
  process.exit(1);
});
