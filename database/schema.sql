-- =====================================================================
-- COREX: Patient-held, consent-driven health record  |  PostgreSQL 14+
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid(), digest()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fuzzy matching of test names

-- ---------- ENUMS ----------------------------------------------------
CREATE TYPE user_role        AS ENUM ('patient', 'provider', 'admin');
CREATE TYPE lang_code        AS ENUM ('en', 'hi', 'te');
CREATE TYPE provider_type    AS ENUM ('phc', 'clinic', 'laboratory', 'district_hospital', 'private_hospital');
CREATE TYPE data_scope       AS ENUM ('allergies', 'medications', 'diagnoses', 'lab_results',
                                      'imaging', 'reports', 'encounters');
CREATE TYPE duration_option  AS ENUM ('this_visit', '24_hours', '7_days');
CREATE TYPE consent_status   AS ENUM ('pending', 'approved', 'denied', 'expired', 'revoked');
CREATE TYPE consent_channel  AS ENUM ('app', 'whatsapp', 'sms', 'voice', 'offline');
CREATE TYPE report_type      AS ENUM ('lab', 'imaging', 'prescription', 'discharge_summary', 'other');
CREATE TYPE ocr_status       AS ENUM ('not_required', 'pending', 'done', 'failed');
CREATE TYPE severity_level   AS ENUM ('mild', 'moderate', 'severe');

-- ---------- COMMON HELPERS -------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;

-- ---------- IDENTITY -------------------------------------------------
CREATE TABLE users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role          user_role NOT NULL,
    phone         text UNIQUE,
    email         citext UNIQUE,
    password_hash text,                       -- NULL for OTP-only patients
    preferred_lang lang_code NOT NULL DEFAULT 'en',
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

CREATE TABLE patients (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    abha_id       text NOT NULL UNIQUE CHECK (abha_id ~ '^\d{2}-\d{4}-\d{4}-\d{4}$'),  -- mock ABHA-style
    abha_address  text UNIQUE,                -- e.g. name@abdm (mock)
    full_name     text NOT NULL,
    date_of_birth date NOT NULL,
    gender        text CHECK (gender IN ('male', 'female', 'other')),
    blood_group   text CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    qr_token      text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),  -- opaque; holds NO medical data
    emergency_contact_name  text,
    emergency_contact_phone text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE providers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid UNIQUE REFERENCES users(id) ON DELETE SET NULL,  -- optional: access is login-free
    name            text NOT NULL,
    type            provider_type NOT NULL,
    registration_no text UNIQUE,
    phone           text,
    address         text,
    district        text,
    is_verified     boolean NOT NULL DEFAULT false,
    public_key      text,                      -- registered once online; lets offline grants be encrypted to this provider
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------- CLINICAL DATA --------------------------------------------
CREATE TABLE encounters (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id uuid NOT NULL REFERENCES providers(id),
    doctor_name text,
    visit_date  timestamptz NOT NULL DEFAULT now(),
    chief_complaint text,
    notes       text,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON encounters (patient_id, visit_date DESC);

CREATE TABLE allergies (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergen    text NOT NULL,
    reaction    text,
    severity    severity_level NOT NULL DEFAULT 'moderate',
    recorded_at date NOT NULL DEFAULT current_date,
    recorded_by uuid REFERENCES providers(id)
);
CREATE INDEX ON allergies (patient_id);

CREATE TABLE medications (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
    name        text NOT NULL,
    dosage      text,
    frequency   text,
    start_date  date,
    end_date    date,                          -- NULL = ongoing
    prescribed_by uuid REFERENCES providers(id),
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE INDEX ON medications (patient_id, end_date);

CREATE TABLE diagnoses (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
    condition   text NOT NULL,
    icd10_code  text,
    status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','chronic')),
    diagnosed_on date NOT NULL DEFAULT current_date,
    diagnosed_by uuid REFERENCES providers(id)
);
CREATE INDEX ON diagnoses (patient_id);


CREATE TABLE reports (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id  uuid REFERENCES encounters(id) ON DELETE SET NULL,
    type          report_type NOT NULL,
    title         text NOT NULL,
    file_url      text NOT NULL,               -- object storage path
    mime_type     text,
    ocr_status    ocr_status NOT NULL DEFAULT 'pending',
    ocr_text      text,
    extracted_data jsonb,                      -- structured fields parsed from OCR
    uploaded_by   uuid REFERENCES users(id),
    uploaded_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON reports (patient_id, uploaded_at DESC);

-- ---------- DYNAMIC OBSERVATIONS (any test / scan / vital) -----------
-- The vocabulary only HELPS normalise names. It never restricts what can be stored.
CREATE TABLE term_vocabulary (
    id              serial PRIMARY KEY,
    canonical_key   text NOT NULL UNIQUE,      -- e.g. 'hba1c'
    display_name    text NOT NULL,
    category        text NOT NULL DEFAULT 'lab',
    loinc_code      text,
    min_repeat_days integer CHECK (min_repeat_days >= 0)   -- NULL = fall back to category default
);
CREATE TABLE term_aliases (
    alias   text PRIMARY KEY,                  -- stored normalised
    term_id integer NOT NULL REFERENCES term_vocabulary(id) ON DELETE CASCADE
);
CREATE INDEX term_aliases_trgm ON term_aliases USING gin (alias gin_trgm_ops);

CREATE TABLE repeat_rules_default (            -- fallback window for tests we have never seen
    category        text PRIMARY KEY,
    min_repeat_days integer NOT NULL CHECK (min_repeat_days >= 0)
);

CREATE OR REPLACE FUNCTION normalize_term(t text) RETURNS text AS $$
    SELECT btrim(regexp_replace(lower(t), '[^a-z0-9]+', ' ', 'g'));
$$ LANGUAGE sql IMMUTABLE;

-- Known name/alias -> canonical key; near-match -> canonical key; unknown -> its own stable key
CREATE OR REPLACE FUNCTION resolve_term_key(p_name text) RETURNS text AS $$
DECLARE n text := normalize_term(p_name); k text;
BEGIN
    SELECT v.canonical_key INTO k FROM term_aliases a JOIN term_vocabulary v ON v.id = a.term_id WHERE a.alias = n;
    IF k IS NOT NULL THEN RETURN k; END IF;
    SELECT v.canonical_key INTO k FROM term_aliases a JOIN term_vocabulary v ON v.id = a.term_id
     WHERE similarity(a.alias, n) > 0.6 ORDER BY similarity(a.alias, n) DESC LIMIT 1;
    RETURN COALESCE(k, n);
END $$ LANGUAGE plpgsql STABLE;

CREATE TABLE observations (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id  uuid REFERENCES encounters(id) ON DELETE SET NULL,
    report_id     uuid REFERENCES reports(id) ON DELETE SET NULL,   -- set when extracted by OCR
    category      text NOT NULL DEFAULT 'lab' CHECK (category IN ('lab','imaging','vital','other')),
    name          text NOT NULL,               -- exactly as entered / extracted
    term_key      text NOT NULL,               -- filled by trigger
    value_text    text,
    value_numeric numeric,
    unit          text,
    ref_low       numeric,
    ref_high      numeric,
    is_abnormal   boolean,
    details       jsonb NOT NULL DEFAULT '{}', -- anything else: impression, components, free fields
    source        text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','ocr','import')),
    performed_at  timestamptz NOT NULL DEFAULT now(),
    performed_by  uuid REFERENCES providers(id)
);
CREATE INDEX ON observations (patient_id, term_key, performed_at DESC);
CREATE INDEX ON observations (patient_id, category);

CREATE OR REPLACE FUNCTION observations_prepare() RETURNS trigger AS $$
BEGIN
    NEW.term_key := resolve_term_key(NEW.name);
    IF NEW.is_abnormal IS NULL AND NEW.value_numeric IS NOT NULL AND (NEW.ref_low IS NOT NULL OR NEW.ref_high IS NOT NULL) THEN
        NEW.is_abnormal := (NEW.ref_low IS NOT NULL AND NEW.value_numeric < NEW.ref_low)
                        OR (NEW.ref_high IS NOT NULL AND NEW.value_numeric > NEW.ref_high);
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_observations_prepare BEFORE INSERT OR UPDATE OF name, value_numeric, ref_low, ref_high ON observations
    FOR EACH ROW EXECUTE FUNCTION observations_prepare();

CREATE TABLE ai_visit_summaries (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consent_id    uuid,                        -- FK added below (consent-scoped generation)
    summary_text  text NOT NULL,
    language      lang_code NOT NULL DEFAULT 'en',
    source_refs   jsonb NOT NULL DEFAULT '[]', -- [{table, id}] -> grounded in patient records
    model_name    text,
    generated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- CONSENT ENGINE -------------------------------------------
CREATE TABLE consents (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id       uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id      uuid NOT NULL REFERENCES providers(id),
    requester_name   text,                     -- doctor/staff name entered at scan
    purpose          text,
    requested_scopes data_scope[] NOT NULL,
    granted_scopes   data_scope[],             -- what the patient actually approved
    duration         duration_option,
    channel          consent_channel NOT NULL DEFAULT 'app',
    status           consent_status NOT NULL DEFAULT 'pending',
    link_token_hash  text UNIQUE,              -- sha256 of WhatsApp/SMS link token (never store raw)
    link_expires_at  timestamptz,
    requested_at     timestamptz NOT NULL DEFAULT now(),
    decided_at       timestamptz,
    starts_at        timestamptz,
    expires_at       timestamptz,
    revoked_at       timestamptz,
    revoked_via      consent_channel,
    revoke_reason    text,
    offline_signature text,                    -- patient-device signature when granted with no internet
    synced_at        timestamptz,              -- when the offline grant reached the server
    CONSTRAINT approved_has_window CHECK (
        status NOT IN ('approved','expired','revoked')
        OR (granted_scopes IS NOT NULL AND duration IS NOT NULL AND starts_at IS NOT NULL AND expires_at IS NOT NULL)),
    CONSTRAINT revoked_has_timestamp CHECK ((status = 'revoked') = (revoked_at IS NOT NULL)),
    CONSTRAINT granted_subset_of_requested CHECK (granted_scopes IS NULL OR granted_scopes <@ requested_scopes)
);
CREATE INDEX ON consents (patient_id, status, expires_at);
CREATE INDEX ON consents (provider_id, status);

ALTER TABLE ai_visit_summaries
    ADD CONSTRAINT fk_summary_consent FOREIGN KEY (consent_id) REFERENCES consents(id) ON DELETE SET NULL;

-- Voice consent: audio + transcript receipt
CREATE TABLE voice_consent_receipts (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id    uuid NOT NULL REFERENCES consents(id) ON DELETE CASCADE,
    language      lang_code NOT NULL,
    audio_url     text NOT NULL,
    audio_sha256  text NOT NULL,               -- tamper evidence
    transcript    text NOT NULL,
    stt_confidence numeric(4,3),
    recorded_at   timestamptz NOT NULL DEFAULT now()
);

-- Provider's login-free session, bound 1:1 to an approved consent
CREATE TABLE access_sessions (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id         uuid NOT NULL UNIQUE REFERENCES consents(id) ON DELETE CASCADE,
    session_token_hash text NOT NULL UNIQUE,   -- sha256 of provider bearer token
    wrapped_key        bytea,                  -- session key, wrapped by server master key (KMS/env)
    key_destroyed_at   timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now(),
    last_accessed_at   timestamptz,
    -- crypto-shredding invariant: key present XOR destroyed
    CONSTRAINT key_state CHECK ((wrapped_key IS NOT NULL AND key_destroyed_at IS NULL)
                             OR (wrapped_key IS NULL     AND key_destroyed_at IS NOT NULL))
);

-- Encrypted snapshot of ONLY the approved scopes (AES-256-GCM under the session key)
CREATE TABLE session_payloads (
    session_id  uuid NOT NULL REFERENCES access_sessions(id) ON DELETE CASCADE,
    scope       data_scope NOT NULL,
    ciphertext  bytea NOT NULL,
    iv          bytea NOT NULL,
    auth_tag    bytea NOT NULL,
    PRIMARY KEY (session_id, scope)
);

-- ---------- OFFLINE SUPPORT ------------------------------------------
-- Patient device holds the private key; server keeps only the public half.
CREATE TABLE patient_keys (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    key_id      text NOT NULL UNIQUE,
    public_key  text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    revoked_at  timestamptz
);
-- Signed, patient-chosen minimal summary printed/encoded in the QR for zero-internet scenes
CREATE TABLE emergency_cards (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    version         integer NOT NULL,
    included_fields text[] NOT NULL,           -- e.g. {blood_group,allergies,chronic_conditions,current_medicines}
    payload_sha256  text NOT NULL,
    signature       text NOT NULL,
    issued_at       timestamptz NOT NULL DEFAULT now(),
    revoked_at      timestamptz,               -- providers learn of this on next sync
    UNIQUE (patient_id, version)
);

-- ---------- AUDIT TRAIL (append-only, hash-chained) ------------------
CREATE TABLE audit_logs (
    id          bigserial PRIMARY KEY,
    patient_id  uuid REFERENCES patients(id) ON DELETE SET NULL,
    provider_id uuid REFERENCES providers(id) ON DELETE SET NULL,
    consent_id  uuid REFERENCES consents(id) ON DELETE SET NULL,
    event_type  text NOT NULL CHECK (event_type IN (
                  'qr_scanned','consent_requested','consent_approved','consent_denied',
                  'data_accessed','consent_revoked','consent_expired','key_destroyed',
                  'record_added','duplicate_test_nudge')),
    scope       data_scope,
    detail      jsonb NOT NULL DEFAULT '{}',
    ip_address  inet,
    created_at  timestamptz NOT NULL DEFAULT now(),
    prev_hash   text,
    entry_hash  text
);
CREATE INDEX ON audit_logs (patient_id, created_at DESC);
CREATE INDEX ON audit_logs (consent_id);

CREATE OR REPLACE FUNCTION audit_chain() RETURNS trigger AS $$
DECLARE last_hash text;
BEGIN
    PERFORM pg_advisory_xact_lock(727001);                -- serialize chain writes
    SELECT entry_hash INTO last_hash FROM audit_logs ORDER BY id DESC LIMIT 1;
    NEW.prev_hash := COALESCE(last_hash, 'GENESIS');
    NEW.entry_hash := encode(digest(
        NEW.prev_hash || COALESCE(NEW.patient_id::text,'') || COALESCE(NEW.provider_id::text,'')
        || COALESCE(NEW.consent_id::text,'') || NEW.event_type || COALESCE(NEW.scope::text,'')
        || NEW.detail::text || NEW.created_at::text, 'sha256'), 'hex');
    RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_chain BEFORE INSERT ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION audit_chain();

CREATE OR REPLACE FUNCTION audit_immutable() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_no_change BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION audit_immutable();

-- ---------- CONSENT LIFECYCLE FUNCTIONS ------------------------------
-- Instant revocation: flips status AND destroys the session key (crypto-shredding)
CREATE OR REPLACE FUNCTION revoke_consent(p_consent uuid, p_via consent_channel, p_reason text DEFAULT NULL)
RETURNS boolean AS $$
DECLARE c consents%ROWTYPE;
BEGIN
    SELECT * INTO c FROM consents WHERE id = p_consent FOR UPDATE;
    IF NOT FOUND OR c.status <> 'approved' THEN RETURN false; END IF;

    UPDATE consents SET status = 'revoked', revoked_at = now(), revoked_via = p_via, revoke_reason = p_reason
     WHERE id = p_consent;
    UPDATE access_sessions SET wrapped_key = NULL, key_destroyed_at = now()
     WHERE consent_id = p_consent AND wrapped_key IS NOT NULL;
    DELETE FROM session_payloads WHERE session_id IN (SELECT id FROM access_sessions WHERE consent_id = p_consent);

    INSERT INTO audit_logs (patient_id, provider_id, consent_id, event_type, detail)
    VALUES (c.patient_id, c.provider_id, c.id, 'consent_revoked', jsonb_build_object('via', p_via, 'reason', p_reason));
    INSERT INTO audit_logs (patient_id, provider_id, consent_id, event_type)
    VALUES (c.patient_id, c.provider_id, c.id, 'key_destroyed');
    RETURN true;
END $$ LANGUAGE plpgsql;

-- Auto-expiry: run every minute (pg_cron or backend scheduler)
CREATE OR REPLACE FUNCTION expire_due_consents() RETURNS integer AS $$
DECLARE n integer := 0; r record;
BEGIN
    FOR r IN SELECT * FROM consents WHERE status = 'approved' AND expires_at <= now() FOR UPDATE LOOP
        UPDATE consents SET status = 'expired' WHERE id = r.id;
        UPDATE access_sessions SET wrapped_key = NULL, key_destroyed_at = now()
         WHERE consent_id = r.id AND wrapped_key IS NOT NULL;
        DELETE FROM session_payloads WHERE session_id IN (SELECT id FROM access_sessions WHERE consent_id = r.id);
        INSERT INTO audit_logs (patient_id, provider_id, consent_id, event_type)
        VALUES (r.patient_id, r.provider_id, r.id, 'consent_expired');
        INSERT INTO audit_logs (patient_id, provider_id, consent_id, event_type)
        VALUES (r.patient_id, r.provider_id, r.id, 'key_destroyed');
        n := n + 1;
    END LOOP;
    RETURN n;
END $$ LANGUAGE plpgsql;

-- ---------- DUPLICATE-TEST DETECTION ---------------------------------
-- Works for ANY test name. Window = test-specific rule > category default > 30 days.
CREATE OR REPLACE FUNCTION find_duplicate_observations(p_patient uuid, p_name text)
RETURNS TABLE (obs_id uuid, name text, result text, unit text, performed_at timestamptz, days_ago integer) AS $$
    SELECT o.id, o.name, COALESCE(o.value_text, o.value_numeric::text), o.unit, o.performed_at,
           (current_date - o.performed_at::date)
      FROM observations o
      LEFT JOIN term_vocabulary v ON v.canonical_key = o.term_key
      LEFT JOIN repeat_rules_default d ON d.category = o.category
     WHERE o.patient_id = p_patient
       AND o.term_key = resolve_term_key(p_name)
       AND o.performed_at >= now() - make_interval(days => COALESCE(v.min_repeat_days, d.min_repeat_days, 30))
     ORDER BY o.performed_at DESC;
$$ LANGUAGE sql STABLE;

-- ---------- VIEWS ----------------------------------------------------
CREATE VIEW v_active_consents AS
SELECT c.id, c.patient_id, c.provider_id, p.name AS provider_name, c.granted_scopes,
       c.duration, c.starts_at, c.expires_at,
       GREATEST(0, EXTRACT(EPOCH FROM (c.expires_at - now()))::int) AS seconds_remaining
  FROM consents c JOIN providers p ON p.id = c.provider_id
 WHERE c.status = 'approved' AND c.expires_at > now();

CREATE VIEW v_medical_timeline AS
SELECT patient_id, visit_date AS event_at, 'encounter' AS kind, COALESCE(chief_complaint,'Visit') AS title, id AS ref_id FROM encounters
UNION ALL SELECT patient_id, diagnosed_on::timestamptz, 'diagnosis', condition, id FROM diagnoses
UNION ALL SELECT patient_id, COALESCE(start_date, current_date)::timestamptz, 'medication', name || COALESCE(' ' || dosage,''), id FROM medications
UNION ALL SELECT patient_id, performed_at, 'observation', name || COALESCE(': ' || COALESCE(value_text, value_numeric::text),''), id FROM observations
UNION ALL SELECT patient_id, uploaded_at, 'report', title, id FROM reports;

-- ---------- updated_at TRIGGERS --------------------------------------
CREATE TRIGGER trg_users_upd     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_patients_upd  BEFORE UPDATE ON patients  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_providers_upd BEFORE UPDATE ON providers FOR EACH ROW EXECUTE FUNCTION set_updated_at();