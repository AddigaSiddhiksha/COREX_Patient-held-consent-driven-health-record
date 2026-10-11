import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import fileURLToPath from 'node:url';

const dbPath = path.resolve('./database/corex.sqlite');

export async function getDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  return db;
}

export async function initDb() {
  const db = await getDb();

  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('patient', 'provider', 'admin')),
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      preferred_lang TEXT NOT NULL DEFAULT 'en',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      abha_id TEXT NOT NULL UNIQUE,
      abha_address TEXT UNIQUE,
      full_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      gender TEXT CHECK (gender IN ('male', 'female', 'other')),
      blood_group TEXT CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
      qr_token TEXT NOT NULL UNIQUE,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('phc', 'clinic', 'laboratory', 'district_hospital', 'private_hospital')),
      registration_no TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      district TEXT,
      is_verified INTEGER NOT NULL DEFAULT 0,
      public_key TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS encounters (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      provider_id TEXT NOT NULL REFERENCES providers(id),
      doctor_name TEXT,
      visit_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      chief_complaint TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS allergies (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      allergen TEXT NOT NULL,
      reaction TEXT,
      severity TEXT NOT NULL DEFAULT 'moderate',
      recorded_at TEXT NOT NULL DEFAULT CURRENT_DATE,
      recorded_by TEXT REFERENCES providers(id)
    );

    CREATE TABLE IF NOT EXISTS medications (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      encounter_id TEXT REFERENCES encounters(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      dosage TEXT,
      frequency TEXT,
      start_date TEXT,
      end_date TEXT,
      prescribed_by TEXT REFERENCES providers(id)
    );

    CREATE TABLE IF NOT EXISTS diagnoses (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      encounter_id TEXT REFERENCES encounters(id) ON DELETE SET NULL,
      condition TEXT NOT NULL,
      icd10_code TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','chronic')),
      diagnosed_on TEXT NOT NULL DEFAULT CURRENT_DATE,
      diagnosed_by TEXT REFERENCES providers(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      encounter_id TEXT REFERENCES encounters(id) ON DELETE SET NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      file_url TEXT NOT NULL,
      mime_type TEXT,
      ocr_status TEXT NOT NULL DEFAULT 'pending',
      ocr_text TEXT,
      extracted_data TEXT,
      uploaded_by TEXT REFERENCES users(id),
      uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS repeat_rules_default (
      category TEXT PRIMARY KEY,
      min_repeat_days INTEGER NOT NULL CHECK (min_repeat_days >= 0)
    );

    CREATE TABLE IF NOT EXISTS term_vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      canonical_key TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'lab',
      loinc_code TEXT,
      min_repeat_days INTEGER CHECK (min_repeat_days >= 0)
    );

    CREATE TABLE IF NOT EXISTS term_aliases (
      alias TEXT PRIMARY KEY,
      term_id INTEGER NOT NULL REFERENCES term_vocabulary(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS observations (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      encounter_id TEXT REFERENCES encounters(id) ON DELETE SET NULL,
      report_id TEXT REFERENCES reports(id) ON DELETE SET NULL,
      category TEXT NOT NULL DEFAULT 'lab',
      name TEXT NOT NULL,
      term_key TEXT NOT NULL,
      value_text TEXT,
      value_numeric REAL,
      unit TEXT,
      ref_low REAL,
      ref_high REAL,
      is_abnormal INTEGER,
      details TEXT NOT NULL DEFAULT '{}',
      source TEXT NOT NULL DEFAULT 'manual',
      performed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      performed_by TEXT REFERENCES providers(id)
    );

    CREATE TABLE IF NOT EXISTS consents (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      provider_id TEXT NOT NULL REFERENCES providers(id),
      requester_name TEXT,
      purpose TEXT,
      requested_scopes TEXT NOT NULL, -- JSON array
      granted_scopes TEXT,           -- JSON array
      duration TEXT,                 -- 'this_visit', '24_hours', '7_days'
      channel TEXT NOT NULL DEFAULT 'app',
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'expired', 'revoked'
      link_token_hash TEXT UNIQUE,
      link_expires_at TEXT,
      requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      decided_at TEXT,
      starts_at TEXT,
      expires_at TEXT,
      revoked_at TEXT,
      revoked_via TEXT,
      revoke_reason TEXT,
      offline_signature TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS voice_consent_receipts (
      id TEXT PRIMARY KEY,
      consent_id TEXT NOT NULL REFERENCES consents(id) ON DELETE CASCADE,
      language TEXT NOT NULL,
      audio_url TEXT NOT NULL,
      audio_sha256 TEXT NOT NULL,
      transcript TEXT NOT NULL,
      stt_confidence REAL,
      recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS access_sessions (
      id TEXT PRIMARY KEY,
      consent_id TEXT NOT NULL UNIQUE REFERENCES consents(id) ON DELETE CASCADE,
      session_token_hash TEXT NOT NULL UNIQUE,
      wrapped_key TEXT,
      key_destroyed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_accessed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS session_payloads (
      session_id TEXT NOT NULL REFERENCES access_sessions(id) ON DELETE CASCADE,
      scope TEXT NOT NULL,
      ciphertext TEXT NOT NULL,
      iv TEXT NOT NULL,
      auth_tag TEXT NOT NULL,
      PRIMARY KEY (session_id, scope)
    );

    CREATE TABLE IF NOT EXISTS ai_visit_summaries (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      consent_id TEXT REFERENCES consents(id) ON DELETE SET NULL,
      summary_text TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      source_refs TEXT NOT NULL DEFAULT '[]',
      model_name TEXT,
      generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
      provider_id TEXT REFERENCES providers(id) ON DELETE SET NULL,
      consent_id TEXT REFERENCES consents(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      scope TEXT,
      detail TEXT NOT NULL DEFAULT '{}',
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      prev_hash TEXT,
      entry_hash TEXT
    );
  `);

  async function addCol(table, colDef) {
    try {
      await db.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
    } catch (e) {
      // Column already exists
    }
  }

  await addCol('users', 'verification_code TEXT');
  await addCol('users', 'is_verified INTEGER NOT NULL DEFAULT 1');
  await addCol('providers', 'specialty TEXT');
  await addCol('providers', 'qualification TEXT');
  await addCol('providers', 'council_name TEXT');
  await addCol('providers', 'verified_at TEXT');
  await addCol('providers', 'verified_by TEXT');

  await seedInitialData(db);
  await seedConsentsIfEmpty(db);
}

export function normalizeTerm(term) {
  if (!term) return '';
  return term.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export async function resolveTermKey(db, name) {
  const norm = normalizeTerm(name);
  if (!norm) return 'unknown';

  const aliasRow = await db.get(
    `SELECT v.canonical_key FROM term_aliases a JOIN term_vocabulary v ON v.id = a.term_id WHERE a.alias = ?`,
    [norm]
  );
  if (aliasRow) return aliasRow.canonical_key;

  const vocabRow = await db.get(
    `SELECT canonical_key FROM term_vocabulary WHERE LOWER(display_name) = ? OR canonical_key = ?`,
    [norm, norm]
  );
  if (vocabRow) return vocabRow.canonical_key;

  return norm;
}

export async function addAuditLog(db, { patientId, providerId, consentId, eventType, scope, detail = {}, ipAddress = '127.0.0.1' }) {
  const lastLog = await db.get(`SELECT entry_hash FROM audit_logs ORDER BY id DESC LIMIT 1`);
  const prevHash = lastLog ? lastLog.entry_hash : 'GENESIS';
  const timestamp = new Date().toISOString();
  const detailStr = JSON.stringify(detail);

  const dataToHash = prevHash + (patientId || '') + (providerId || '') + (consentId || '') + eventType + (scope || '') + detailStr + timestamp;
  const entryHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

  await db.run(
    `INSERT INTO audit_logs (patient_id, provider_id, consent_id, event_type, scope, detail, ip_address, created_at, prev_hash, entry_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [patientId || null, providerId || null, consentId || null, eventType, scope || null, detailStr, ipAddress, timestamp, prevHash, entryHash]
  );
  return entryHash;
}

async function seedInitialData(db) {
  const userCount = await db.get(`SELECT count(*) as count FROM users`);
  if (userCount.count > 0) return; // already seeded

  console.log('Seeding SQLite database with synthetic healthcare records...');

  // Seed repeat rules
  await db.run(`INSERT OR IGNORE INTO repeat_rules_default (category, min_repeat_days) VALUES ('lab',30),('imaging',30),('vital',0),('other',30)`);

  // Seed term vocabulary
  const vocabItems = [
    { key: 'hba1c', name: 'HbA1c', cat: 'lab', loinc: '4548-4', days: 60 },
    { key: 'cbc', name: 'Complete Blood Count', cat: 'lab', loinc: '58410-2', days: 14 },
    { key: 'lipid profile', name: 'Lipid Profile', cat: 'lab', loinc: '24331-1', days: 90 },
    { key: 'tsh', name: 'TSH', cat: 'lab', loinc: '3016-3', days: 60 },
    { key: 'chest x ray', name: 'Chest X-Ray', cat: 'imaging', loinc: null, days: 30 }
  ];

  for (const item of vocabItems) {
    const res = await db.run(
      `INSERT INTO term_vocabulary (canonical_key, display_name, category, loinc_code, min_repeat_days) VALUES (?, ?, ?, ?, ?)`,
      [item.key, item.name, item.cat, item.loinc, item.days]
    );
    const termId = res.lastID;
    
    // aliases
    const aliases = [item.key, item.name];
    if (item.key === 'hba1c') aliases.push('Glycated Hemoglobin', 'A1c');
    if (item.key === 'cbc') aliases.push('CBC', 'Hemogram', 'Complete Blood Picture');
    if (item.key === 'lipid profile') aliases.push('Lipid Panel');
    if (item.key === 'tsh') aliases.push('Thyroid Stimulating Hormone');
    if (item.key === 'chest x ray') aliases.push('CXR', 'X-Ray Chest');

    for (const a of aliases) {
      await db.run(`INSERT OR IGNORE INTO term_aliases (alias, term_id) VALUES (?, ?)`, [normalizeTerm(a), termId]);
    }
  }

  // Users
  const users = [
    { id: '00000000-0000-0000-0000-0000000000a1', role: 'patient', phone: '9000000001', email: 'ravi.demo@example.com', lang: 'te' },
    { id: '00000000-0000-0000-0000-0000000000a2', role: 'patient', phone: '9000000002', email: 'meena.demo@example.com', lang: 'hi' },
    { id: '00000000-0000-0000-0000-0000000000b1', role: 'provider', phone: '9000000101', email: 'phc.demo@example.com', lang: 'en' },
    { id: '00000000-0000-0000-0000-0000000000b2', role: 'provider', phone: '9000000102', email: 'clinic.demo@example.com', lang: 'en' }
  ];

  for (const u of users) {
    await db.run(
      `INSERT INTO users (id, role, phone, email, preferred_lang) VALUES (?, ?, ?, ?, ?)`,
      [u.id, u.role, u.phone, u.email, u.lang]
    );
  }

  // Patients
  const patients = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      user_id: '00000000-0000-0000-0000-0000000000a1',
      abha_id: '91-1234-5678-9012',
      abha_address: 'ravi.kumar@abdm',
      full_name: 'Ravi Kumar',
      date_of_birth: '1978-04-12',
      gender: 'male',
      blood_group: 'B+',
      qr_token: 'qr_ravi_kumar_91123456789012',
      emergency_contact_name: 'Lakshmi Kumar',
      emergency_contact_phone: '9000000011'
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      user_id: '00000000-0000-0000-0000-0000000000a2',
      abha_id: '91-2345-6789-0123',
      abha_address: 'meena.devi@abdm',
      full_name: 'Meena Devi',
      date_of_birth: '1992-09-30',
      gender: 'female',
      blood_group: 'O+',
      qr_token: 'qr_meena_devi_91234567890123',
      emergency_contact_name: 'Suresh Devi',
      emergency_contact_phone: '9000000022'
    }
  ];

  for (const p of patients) {
    await db.run(
      `INSERT INTO patients (id, user_id, abha_id, abha_address, full_name, date_of_birth, gender, blood_group, qr_token, emergency_contact_name, emergency_contact_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.user_id, p.abha_id, p.abha_address, p.full_name, p.date_of_birth, p.gender, p.blood_group, p.qr_token, p.emergency_contact_name, p.emergency_contact_phone]
    );
  }

  // Providers
  const providers = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      user_id: '00000000-0000-0000-0000-0000000000b1',
      name: 'Shamirpet PHC',
      type: 'phc',
      registration_no: 'TS-PHC-0001',
      district: 'Medchal-Malkajgiri',
      is_verified: 1
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      user_id: '00000000-0000-0000-0000-0000000000b2',
      name: 'Sai Care Clinic',
      type: 'clinic',
      registration_no: 'TS-CLN-0457',
      district: 'Hyderabad',
      is_verified: 1
    }
  ];

  for (const pr of providers) {
    await db.run(
      `INSERT INTO providers (id, user_id, name, type, registration_no, district, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [pr.id, pr.user_id, pr.name, pr.type, pr.registration_no, pr.district, pr.is_verified]
    );
  }

  // Encounters
  const encounters = [
    {
      id: '30000000-0000-0000-0000-000000000001',
      patient_id: '10000000-0000-0000-0000-000000000001',
      provider_id: '20000000-0000-0000-0000-000000000001',
      doctor_name: 'Dr. A. Reddy',
      visit_date: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
      chief_complaint: 'Increased thirst, fatigue',
      notes: 'Suspected type 2 diabetes; HbA1c ordered.'
    },
    {
      id: '30000000-0000-0000-0000-000000000002',
      patient_id: '10000000-0000-0000-0000-000000000001',
      provider_id: '20000000-0000-0000-0000-000000000001',
      doctor_name: 'Dr. A. Reddy',
      visit_date: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
      chief_complaint: 'Fever, cough',
      notes: 'Viral URTI. Symptomatic treatment.'
    }
  ];

  for (const e of encounters) {
    await db.run(
      `INSERT INTO encounters (id, patient_id, provider_id, doctor_name, visit_date, chief_complaint, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [e.id, e.patient_id, e.provider_id, e.doctor_name, e.visit_date, e.chief_complaint, e.notes]
    );
  }

  // Allergies
  const allergies = [
    { id: 'a1', patient_id: '10000000-0000-0000-0000-000000000001', allergen: 'Penicillin', reaction: 'Rash, swelling', severity: 'severe', provider_id: '20000000-0000-0000-0000-000000000001' },
    { id: 'a2', patient_id: '10000000-0000-0000-0000-000000000001', allergen: 'Sulfa drugs', reaction: 'Hives', severity: 'moderate', provider_id: '20000000-0000-0000-0000-000000000001' },
    { id: 'a3', patient_id: '10000000-0000-0000-0000-000000000002', allergen: 'Peanuts', reaction: 'Anaphylaxis', severity: 'severe', provider_id: '20000000-0000-0000-0000-000000000002' }
  ];

  for (const al of allergies) {
    await db.run(
      `INSERT INTO allergies (id, patient_id, allergen, reaction, severity, recorded_by) VALUES (?, ?, ?, ?, ?, ?)`,
      [al.id, al.patient_id, al.allergen, al.reaction, al.severity, al.provider_id]
    );
  }

  // Diagnoses
  const diagnoses = [
    { id: 'd1', patient_id: '10000000-0000-0000-0000-000000000001', encounter_id: '30000000-0000-0000-0000-000000000001', condition: 'Type 2 diabetes mellitus', icd10: 'E11', status: 'chronic', date: '2026-03-15', provider_id: '20000000-0000-0000-0000-000000000001' },
    { id: 'd2', patient_id: '10000000-0000-0000-0000-000000000001', encounter_id: null, condition: 'Essential hypertension', icd10: 'I10', status: 'chronic', date: '2025-02-10', provider_id: '20000000-0000-0000-0000-000000000001' }
  ];

  for (const diag of diagnoses) {
    await db.run(
      `INSERT INTO diagnoses (id, patient_id, encounter_id, condition, icd10_code, status, diagnosed_on, diagnosed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [diag.id, diag.patient_id, diag.encounter_id, diag.condition, diag.icd10, diag.status, diag.date, diag.provider_id]
    );
  }

  // Medications
  const meds = [
    { id: 'm1', patient_id: '10000000-0000-0000-0000-000000000001', encounter_id: '30000000-0000-0000-0000-000000000001', name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily', start_date: '2026-03-15', provider_id: '20000000-0000-0000-0000-000000000001' },
    { id: 'm2', patient_id: '10000000-0000-0000-0000-000000000001', encounter_id: null, name: 'Amlodipine', dosage: '5 mg', frequency: 'Once daily', start_date: '2025-02-10', provider_id: '20000000-0000-0000-0000-000000000001' }
  ];

  for (const md of meds) {
    await db.run(
      `INSERT INTO medications (id, patient_id, encounter_id, name, dosage, frequency, start_date, prescribed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [md.id, md.patient_id, md.encounter_id, md.name, md.dosage, md.frequency, md.start_date, md.provider_id]
    );
  }

  // Reports
  const reports = [
    {
      id: '50000000-0000-0000-0000-000000000001',
      patient_id: '10000000-0000-0000-0000-000000000001',
      encounter_id: '30000000-0000-0000-0000-000000000001',
      type: 'lab',
      title: 'HbA1c Report',
      file_url: 'reports/ravi/hba1c-report.pdf',
      mime_type: 'application/pdf',
      ocr_status: 'done',
      ocr_text: 'HbA1c: 7.9 %  Ref: 4.0-5.6',
      extracted_data: JSON.stringify({ test_code: 'HBA1C', value: 7.9, unit: '%' })
    },
    {
      id: '50000000-0000-0000-0000-000000000002',
      patient_id: '10000000-0000-0000-0000-000000000001',
      encounter_id: null,
      type: 'imaging',
      title: 'Chest X-Ray (PA view)',
      file_url: 'reports/ravi/cxr.jpg',
      mime_type: 'image/jpeg',
      ocr_status: 'done',
      ocr_text: 'No active lung lesion.',
      extracted_data: JSON.stringify({ impression: 'Normal' })
    }
  ];

  for (const r of reports) {
    await db.run(
      `INSERT INTO reports (id, patient_id, encounter_id, type, title, file_url, mime_type, ocr_status, ocr_text, extracted_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.patient_id, r.encounter_id, r.type, r.title, r.file_url, r.mime_type, r.ocr_status, r.ocr_text, r.extracted_data]
    );
  }

  // Observations
  const observations = [
    {
      id: 'o1',
      patient_id: '10000000-0000-0000-0000-000000000001',
      encounter_id: '30000000-0000-0000-0000-000000000001',
      report_id: '50000000-0000-0000-0000-000000000001',
      category: 'lab',
      name: 'HbA1c',
      term_key: 'hba1c',
      value_text: null,
      value_numeric: 7.9,
      unit: '%',
      ref_low: 4.0,
      ref_high: 5.6,
      is_abnormal: 1,
      details: '{}',
      source: 'ocr',
      performed_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
      performed_by: '20000000-0000-0000-0000-000000000001'
    },
    {
      id: 'o2',
      patient_id: '10000000-0000-0000-0000-000000000001',
      encounter_id: null,
      report_id: null,
      category: 'lab',
      name: 'Serum Ferritin',
      term_key: 'serum ferritin',
      value_text: null,
      value_numeric: 18,
      unit: 'ng/mL',
      ref_low: 30,
      ref_high: 400,
      is_abnormal: 1,
      details: '{}',
      source: 'manual',
      performed_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      performed_by: '20000000-0000-0000-0000-000000000001'
    },
    {
      id: 'o3',
      patient_id: '10000000-0000-0000-0000-000000000001',
      encounter_id: null,
      report_id: null,
      category: 'lab',
      name: 'Lipid Panel',
      term_key: 'lipid profile',
      value_text: null,
      value_numeric: 142,
      unit: 'mg/dL',
      ref_low: null,
      ref_high: 100,
      is_abnormal: 1,
      details: '{}',
      source: 'manual',
      performed_at: new Date(Date.now() - 150 * 24 * 3600 * 1000).toISOString(),
      performed_by: '20000000-0000-0000-0000-000000000001'
    }
  ];

  for (const obs of observations) {
    await db.run(
      `INSERT INTO observations (id, patient_id, encounter_id, report_id, category, name, term_key, value_text, value_numeric, unit, ref_low, ref_high, is_abnormal, details, source, performed_at, performed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [obs.id, obs.patient_id, obs.encounter_id, obs.report_id, obs.category, obs.name, obs.term_key, obs.value_text, obs.value_numeric, obs.unit, obs.ref_low, obs.ref_high, obs.is_abnormal, obs.details, obs.source, obs.performed_at, obs.performed_by]
    );
  }

  // Initial audit log
  await addAuditLog(db, {
    patientId: '10000000-0000-0000-0000-000000000001',
    providerId: '20000000-0000-0000-0000-000000000001',
    eventType: 'record_added',
    detail: { note: 'Initial synthetic patient health records initialized' }
  });

  console.log('Database initialization & seed complete!');
}

export async function seedConsentsIfEmpty(db) {
  const count = await db.get(`SELECT count(*) as count FROM consents`);
  if (count.count > 0) return;

  console.log('Seeding initial consents...');
  const now = Date.now();
  const allScopes = JSON.stringify(['allergies', 'medications', 'diagnoses', 'lab_results', 'imaging', 'reports', 'encounters']);

  // Dr. A. Reddy (Shamirpet PHC) - 1 Active Consultation with Ravi Kumar
  await db.run(
    `INSERT INTO consents (id, patient_id, provider_id, requester_name, purpose, requested_scopes, granted_scopes, duration, channel, status, requested_at, decided_at, starts_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'c0000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000001',
      'Dr. A. Reddy',
      'Outpatient Consultation & Follow-Up',
      allScopes,
      allScopes,
      '30_mins',
      'app',
      'approved',
      new Date(now - 5 * 60 * 1000).toISOString(),
      new Date(now - 5 * 60 * 1000).toISOString(),
      new Date(now - 5 * 60 * 1000).toISOString(),
      new Date(now + 30 * 60 * 1000).toISOString()
    ]
  );

  const sessionId1 = crypto.randomUUID();
  const sessionToken1 = crypto.randomBytes(24).toString('hex');
  const tokenHash1 = crypto.createHash('sha256').update(sessionToken1).digest('hex');
  const mockWrappedKey1 = crypto.randomBytes(32).toString('hex');

  await db.run(
    `INSERT OR IGNORE INTO access_sessions (id, consent_id, session_token_hash, wrapped_key, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [sessionId1, 'c0000000-0000-0000-0000-000000000001', tokenHash1, mockWrappedKey1, new Date(now - 5 * 60 * 1000).toISOString()]
  );

  // Dr. Ananya Rao (Sai Care Clinic) - 1 Completed Consultation in history (NO active consultation)
  await db.run(
    `INSERT INTO consents (id, patient_id, provider_id, requester_name, purpose, requested_scopes, granted_scopes, duration, channel, status, requested_at, decided_at, starts_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'c0000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000002',
      'Dr. Ananya Rao',
      'Routine Annual Health Checkup',
      allScopes,
      allScopes,
      '1_hour',
      'app',
      'completed',
      new Date(now - 3 * 86400 * 1000).toISOString(),
      new Date(now - 3 * 86400 * 1000).toISOString(),
      new Date(now - 3 * 86400 * 1000).toISOString(),
      new Date(now - 3 * 86400 * 1000 + 3600 * 1000).toISOString()
    ]
  );
}

