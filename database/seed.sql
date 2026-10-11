-- Synthetic data only. No real patient information.
-- Vocabulary is OPTIONAL. It only merges spellings/aliases; unknown tests are stored anyway.
INSERT INTO repeat_rules_default (category, min_repeat_days) VALUES ('lab',30),('imaging',30),('vital',0),('other',30);
INSERT INTO term_vocabulary (canonical_key, display_name, category, loinc_code, min_repeat_days) VALUES
 ('hba1c','HbA1c','lab','4548-4',60), ('cbc','Complete Blood Count','lab','58410-2',14),
 ('lipid profile','Lipid Profile','lab','24331-1',90), ('tsh','TSH','lab','3016-3',60),
 ('chest x ray','Chest X-Ray','imaging',NULL,30);
INSERT INTO term_aliases (alias, term_id)
SELECT normalize_term(x.alias), v.id FROM (VALUES
 ('hba1c','HbA1c'),('hba1c','Glycated Hemoglobin'),('hba1c','Glycosylated Hemoglobin'),('hba1c','A1c'),
 ('cbc','CBC'),('cbc','Complete Blood Count'),('cbc','Hemogram'),('cbc','Complete Blood Picture'),
 ('lipid profile','Lipid Profile'),('lipid profile','Lipid Panel'),
 ('tsh','TSH'),('tsh','Thyroid Stimulating Hormone'),
 ('chest x ray','Chest X-Ray'),('chest x ray','CXR'),('chest x ray','X-Ray Chest')
) AS x(key, alias) JOIN term_vocabulary v ON v.canonical_key = x.key;

-- Fixed UUIDs so the demo is reproducible
INSERT INTO users (id, role, phone, email, preferred_lang) VALUES
 ('00000000-0000-0000-0000-0000000000a1', 'patient',  '9000000001', 'ravi.demo@example.com',  'te'),
 ('00000000-0000-0000-0000-0000000000a2', 'patient',  '9000000002', 'meena.demo@example.com', 'hi'),
 ('00000000-0000-0000-0000-0000000000b1', 'provider', '9000000101', 'phc.demo@example.com',   'en'),
 ('00000000-0000-0000-0000-0000000000b2', 'provider', '9000000102', 'clinic.demo@example.com','en');

INSERT INTO patients (id, user_id, abha_id, abha_address, full_name, date_of_birth, gender, blood_group, emergency_contact_name, emergency_contact_phone) VALUES
 ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1',
  '91-1234-5678-9012', 'ravi.kumar@abdm', 'Ravi Kumar', '1978-04-12', 'male', 'B+', 'Lakshmi Kumar', '9000000011'),
 ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a2',
  '91-2345-6789-0123', 'meena.devi@abdm', 'Meena Devi', '1992-09-30', 'female', 'O+', 'Suresh Devi', '9000000022');

INSERT INTO providers (id, user_id, name, type, registration_no, district, is_verified) VALUES
 ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1',
  'Shamirpet PHC', 'phc', 'TS-PHC-0001', 'Medchal-Malkajgiri', true),
 ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000b2',
  'Sai Care Clinic', 'clinic', 'TS-CLN-0457', 'Hyderabad', true);

INSERT INTO encounters (id, patient_id, provider_id, doctor_name, visit_date, chief_complaint, notes) VALUES
 ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
  'Dr. A. Reddy', now() - interval '25 days', 'Increased thirst, fatigue', 'Suspected type 2 diabetes; HbA1c ordered.'),
 ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
  'Dr. A. Reddy', now() - interval '6 months', 'Fever, cough', 'Viral URTI. Symptomatic treatment.');

INSERT INTO allergies (patient_id, allergen, reaction, severity, recorded_by) VALUES
 ('10000000-0000-0000-0000-000000000001', 'Penicillin', 'Rash, swelling', 'severe', '20000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000001', 'Sulfa drugs', 'Hives', 'moderate', '20000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002', 'Peanuts', 'Anaphylaxis', 'severe', '20000000-0000-0000-0000-000000000002');

INSERT INTO diagnoses (patient_id, encounter_id, condition, icd10_code, status, diagnosed_on, diagnosed_by) VALUES
 ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Type 2 diabetes mellitus', 'E11', 'chronic', current_date - 25, '20000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000001', NULL, 'Essential hypertension', 'I10', 'chronic', current_date - 400, '20000000-0000-0000-0000-000000000001');

INSERT INTO medications (patient_id, encounter_id, name, dosage, frequency, start_date, prescribed_by) VALUES
 ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Metformin', '500 mg', 'Twice daily', current_date - 25, '20000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000001', NULL, 'Amlodipine', '5 mg', 'Once daily', current_date - 400, '20000000-0000-0000-0000-000000000001');

INSERT INTO reports (id, patient_id, encounter_id, type, title, file_url, mime_type, ocr_status, ocr_text, extracted_data) VALUES
 ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'lab', 'HbA1c Report',
  'reports/ravi/hba1c-report.pdf', 'application/pdf', 'done', 'HbA1c: 7.9 %  Ref: 4.0-5.6',
  '{"test_code":"HBA1C","value":7.9,"unit":"%"}'),
 ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', NULL, 'imaging', 'Chest X-Ray (PA view)',
  'reports/ravi/cxr.jpg', 'image/jpeg', 'done', 'No active lung lesion.', '{"impression":"Normal"}');

-- HbA1c 20 days ago -> ordering it again (under ANY spelling) triggers a duplicate nudge.
-- 'Serum Ferritin' is in no vocabulary at all and still works (default 30-day rule).
INSERT INTO observations (patient_id, encounter_id, report_id, category, name, value_numeric, unit, ref_low, ref_high, source, performed_at, performed_by) VALUES
 ('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','lab','HbA1c',7.9,'%',4.0,5.6,'ocr', now() - interval '20 days','20000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000001',NULL,NULL,'lab','Serum Ferritin',18,'ng/mL',30,400,'manual', now() - interval '10 days','20000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000001',NULL,NULL,'lab','Lipid Panel',142,'mg/dL',NULL,100,'manual', now() - interval '5 months','20000000-0000-0000-0000-000000000001');
INSERT INTO observations (patient_id, report_id, category, name, value_text, details, source, performed_at, performed_by) VALUES
 ('10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','imaging','Chest X-Ray','Normal','{"view":"PA","impression":"No active lung lesion"}','manual', now() - interval '3 months','20000000-0000-0000-0000-000000000001');