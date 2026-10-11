import React, { useState, useEffect } from 'react';
import {
  QrCode, Shield, Clock, AlertTriangle, Check, X, Lock, Eye, FileText,
  ChevronRight, RefreshCw, Activity, UserCheck, Key, ShieldCheck, History,
  LogIn, LogOut, User, Stethoscope, ArrowRight, UserPlus, Phone, Calendar, Heart, Plus, Sparkles, CheckCircle2, LockKeyhole
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PrescriptionPad } from './PrescriptionPad';

interface PatientPortalProps {
  onRefreshTrigger?: () => void;
  targetPatientId?: string;
  onPatientChange?: (patientId: string) => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  onRefreshTrigger,
  targetPatientId,
  onPatientChange
}) => {
  // Authentication state (Session persisted in localStorage)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('patient_auth') === 'true' || Boolean(targetPatientId);
  });

  // Auth Screen Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('9000000001');
  const [loginPassword, setLoginPassword] = useState('••••••••');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign Up (New Patient Registration) Form State
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDob, setRegDob] = useState('1996-05-18');
  const [regGender, setRegGender] = useState('female');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regPassword, setRegPassword] = useState('password123');
  const [regConfirmPassword, setRegConfirmPassword] = useState('password123');
  const [regEmergencyName, setRegEmergencyName] = useState('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Phone OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpPreview, setOtpPreview] = useState('');
  const [otpUserId, setOtpUserId] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Baseline Medical Record Modal State (for newly registered patients)
  const [showAddBaselineModal, setShowAddBaselineModal] = useState(false);
  const [baselineType, setBaselineType] = useState<'allergy' | 'diagnosis'>('allergy');
  const [baselineAllergen, setBaselineAllergen] = useState('');
  const [baselineReaction, setBaselineReaction] = useState('');
  const [baselineSeverity, setBaselineSeverity] = useState('moderate');
  const [baselineCondition, setBaselineCondition] = useState('');
  const [baselineIcd, setBaselineIcd] = useState('');
  const [baselineStatus, setBaselineStatus] = useState('active');
  const [baselineSaving, setBaselineSaving] = useState(false);

  // Dynamic List of all registered patients from database
  const [allPatients, setAllPatients] = useState<any[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    return targetPatientId || localStorage.getItem('selected_patient_id') || '10000000-0000-0000-0000-000000000001';
  });

  const [patient, setPatient] = useState<any>(null);
  const [consents, setConsents] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active tab inside Patient Portal: 'consents' | 'card' | 'records' | 'prescription' | 'history'
  const [activeSubTab, setActiveSubTab] = useState<'consents' | 'card' | 'records' | 'prescription' | 'history'>('consents');

  // State for pending consent approval customization
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'allergies', 'medications', 'diagnoses', 'lab_results', 'imaging', 'reports', 'encounters'
  ]);
  const [selectedDuration, setSelectedDuration] = useState<string>('this_visit');

  // Pre-consent data preview modal
  const [previewOpen, setPreviewOpen] = useState(false);

  // Incoming request alert if received for another patient profile
  const [incomingAlert, setIncomingAlert] = useState<{
    patientId: string;
    patientName: string;
    doctorName: string;
  } | null>(null);

  // Fetch all registered patients from database dynamically
  const fetchPatientsList = async () => {
    try {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const data = await res.json();
        setAllPatients(data || []);
      }
    } catch (err) {
      console.error('Error fetching registered patients:', err);
    }
  };

  useEffect(() => {
    fetchPatientsList();
  }, []);

  // Sync targetPatientId when passed from doctor portal / app
  useEffect(() => {
    if (targetPatientId) {
      setSelectedPatientId(targetPatientId);
      setIsAuthenticated(true);
      setActiveSubTab('consents');
      localStorage.setItem('selected_patient_id', targetPatientId);
      localStorage.setItem('patient_auth', 'true');
    }
  }, [targetPatientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      // Fetch patient info
      const pRes = await fetch(`/api/patients/by-identifier/${selectedPatientId}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setPatient(pData);
      }

      // Fetch consents for this patient
      const cRes = await fetch(`/api/patients/${selectedPatientId}/consents`);
      if (cRes.ok) {
        const cData = await cRes.json();
        setConsents(cData);
      }

      // Fetch patient medical records (isSelfView=true)
      const rRes = await fetch(`/api/patient-records/${selectedPatientId}?isSelfView=true`);
      if (rRes.ok) {
        const rData = await rRes.json();
        setMedicalRecords(rData);
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [selectedPatientId]);

  // Real-time SSE Connection for instant doctor consent synchronization
  useEffect(() => {
    const es = new EventSource('/api/events');

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.eventType === 'patient_registered') {
          fetchPatientsList();
        } else if (data.eventType === 'consent_requested') {
          if (data.payload?.patient_id) {
            if (data.payload.patient_id === selectedPatientId) {
              fetchPatientData();
              setActiveSubTab('consents');
            } else {
              setIncomingAlert({
                patientId: data.payload.patient_id,
                patientName: data.payload.patient_name || 'Registered Patient',
                doctorName: data.payload.requester_name || 'Attending Physician'
              });
              fetchPatientData();
            }
          }
          if (onRefreshTrigger) onRefreshTrigger();
        } else if (
          data.eventType === 'consent_approved' ||
          data.eventType === 'consent_denied' ||
          data.eventType === 'consent_revoked' ||
          data.eventType === 'consent_expired' ||
          data.eventType === 'consent_completed' ||
          data.eventType === 'prescription_added' ||
          data.eventType === 'clinical_note_added' ||
          data.eventType === 'data_accessed' ||
          data.eventType === 'allergy_added' ||
          data.eventType === 'diagnosis_added'
        ) {
          fetchPatientData();
          if (onRefreshTrigger) onRefreshTrigger();
        }
      } catch (err) {
        console.error('SSE message parse error:', err);
      }
    };

    return () => {
      es.close();
    };
  }, [selectedPatientId]);

  // Handle Dynamic Patient Sign In with Credentials
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification) {
          setOtpUserId(data.userId);
          setOtpPhone(data.phone);
          setOtpPreview(data.otpPreview);
          setOtpCode(data.otpPreview);
          setShowOtpModal(true);
          setLoginError('Phone verification pending. Please verify the OTP.');
        } else {
          setLoginError(data.error || 'Failed to sign in.');
        }
        return;
      }

      setSelectedPatientId(data.patient.id);
      setPatient(data.patient);
      setIsAuthenticated(true);
      localStorage.setItem('patient_auth', 'true');
      localStorage.setItem('selected_patient_id', data.patient.id);
      if (onPatientChange) onPatientChange(data.patient.id);
      await fetchPatientsList();
    } catch (err: any) {
      setLoginError(err.message || 'Network error while signing in.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Quick Sign In for any registered patient (Seed or Dynamically Added)
  const handleQuickPatientSelect = async (p: any) => {
    setSelectedPatientId(p.id);
    setPatient(p);
    setIsAuthenticated(true);
    localStorage.setItem('patient_auth', 'true');
    localStorage.setItem('selected_patient_id', p.id);
    if (onPatientChange) onPatientChange(p.id);
  };

  // Handle Dynamic New Patient Registration
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (!regFullName.trim() || !regPhone.trim() || !regPassword) {
      setRegError('Please provide your full name, phone number, and password.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-enter.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch('/api/auth/register-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName,
          phone: regPhone,
          email: regEmail,
          dateOfBirth: regDob,
          gender: regGender,
          bloodGroup: regBloodGroup,
          password: regPassword,
          emergencyContactName: regEmergencyName,
          emergencyContactPhone: regEmergencyPhone
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || 'Registration failed.');
        return;
      }

      // Prompt OTP Verification
      setOtpUserId(data.userId);
      setOtpPhone(data.phone);
      setOtpPreview(data.otpPreview);
      setOtpCode(data.otpPreview); // prefill code for instant testing
      setShowOtpModal(true);
    } catch (err: any) {
      setRegError(err.message || 'Registration request failed.');
    } finally {
      setRegLoading(false);
    }
  };

  // Handle OTP Verification and Account Activation
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch('/api/auth/verify-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: otpUserId,
          phone: otpPhone,
          otp: otpCode
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Verification code failed.');
        return;
      }

      setShowOtpModal(false);
      setSelectedPatientId(data.patient.id);
      setPatient(data.patient);
      setIsAuthenticated(true);
      localStorage.setItem('patient_auth', 'true');
      localStorage.setItem('selected_patient_id', data.patient.id);
      if (onPatientChange) onPatientChange(data.patient.id);
      await fetchPatientsList();
      if (onRefreshTrigger) onRefreshTrigger();
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification error.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle adding baseline record for new patient
  const handleAddBaselineRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setBaselineSaving(true);
    try {
      if (baselineType === 'allergy') {
        if (!baselineAllergen.trim()) return;
        await fetch('/api/allergies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: selectedPatientId,
            allergen: baselineAllergen.trim(),
            reaction: baselineReaction.trim() || 'Mild reaction',
            severity: baselineSeverity
          })
        });
      } else {
        if (!baselineCondition.trim()) return;
        await fetch('/api/diagnoses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: selectedPatientId,
            condition: baselineCondition.trim(),
            icd10Code: baselineIcd.trim() || 'Z00.0',
            status: baselineStatus
          })
        });
      }
      setShowAddBaselineModal(false);
      setBaselineAllergen('');
      setBaselineReaction('');
      setBaselineCondition('');
      await fetchPatientData();
    } catch (err) {
      console.error('Error adding baseline record:', err);
    } finally {
      setBaselineSaving(false);
    }
  };

  const handleApprove = async (consentId: string) => {
    try {
      const res = await fetch(`/api/consents/${consentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantedScopes: selectedScopes,
          duration: selectedDuration,
          channel: 'app'
        })
      });
      if (res.ok) {
        await fetchPatientData();
        if (onRefreshTrigger) onRefreshTrigger();
      }
    } catch (err) {
      console.error('Error approving consent:', err);
    }
  };

  const handleDeny = async (consentId: string) => {
    try {
      const res = await fetch(`/api/consents/${consentId}/deny`, { method: 'POST' });
      if (res.ok) {
        await fetchPatientData();
        if (onRefreshTrigger) onRefreshTrigger();
      }
    } catch (err) {
      console.error('Error denying consent:', err);
    }
  };

  const handleRevoke = async (consentId: string) => {
    try {
      const res = await fetch(`/api/consents/${consentId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ via: 'app', reason: 'Patient revoked consent explicitly' })
      });
      if (res.ok) {
        await fetchPatientData();
        if (onRefreshTrigger) onRefreshTrigger();
      }
    } catch (err) {
      console.error('Error revoking consent:', err);
    }
  };

  // Pure Database Filtered Consents
  const pendingConsents = consents.filter(c => c.status === 'pending');
  const activeConsents = consents.filter(
    c => c.status === 'approved' && c.expires_at && new Date(c.expires_at) > new Date()
  );
  const pastConsents = consents.filter(
    c => c.status === 'revoked' || c.status === 'expired' || c.status === 'completed' || c.status === 'denied' || (c.status === 'approved' && c.expires_at && new Date(c.expires_at) <= new Date())
  );

  const scopeLabels: Record<string, string> = {
    allergies: 'Allergies & Drug Warnings',
    medications: 'Current Prescriptions',
    diagnoses: 'Diagnoses & Medical History',
    lab_results: 'Lab Test Results',
    imaging: 'Imaging & X-Rays',
    reports: 'Uploaded Diagnostic Reports',
    encounters: 'Past Clinical Encounters'
  };

  // Patient Profile Details (Fully Dynamic)
  const displayName = patient?.full_name || 'Registered Patient';
  const displayAbhaId = patient?.abha_id || 'Generating ABHA...';
  const displayAbhaAddress = patient?.abha_address || 'patient@abdm';

  // Construct QR Payload URL for Phone Camera Scanning
  const qrPayload = `${window.location.protocol}//${window.location.host}/?portal=doctor&scan=${patient?.qr_token || 'qr_token_default'}`;

  // ==========================================
  // VIEW 1: DYNAMIC PATIENT SIGN IN & SIGN UP (IF NOT AUTHENTICATED)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5f8f6] py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-6">

          {/* OTP Verification Modal */}
          {showOtpModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-7 border-2 border-[#177e71] shadow-2xl space-y-5 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#123d3b] text-[#bff46d]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#102b2c]">Verify Phone with ABDM</h3>
                    <p className="text-xs text-[#647774]">National Health Authority Security Check</p>
                  </div>
                </div>

                {/* Simulated SMS Alert Box */}
                <div className="p-3.5 bg-[#f4fbf0] rounded-2xl border border-[#c8dfbc] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#123d3b]">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#177e71]" /> Simulated SMS Notification
                    </span>
                    <span className="text-[10px] bg-[#177e71] text-white px-2 py-0.5 rounded-full">INSTANT</span>
                  </div>
                  <p className="text-xs text-[#28634f] font-mono leading-relaxed">
                    "Your ABDM 6-digit verification code is <strong className="text-sm text-[#123d3b] font-black">{otpPreview || '123456'}</strong>. Enter this OTP to activate your Ayushman Bharat Digital Health Record."
                  </p>
                  <button
                    type="button"
                    onClick={() => setOtpCode(otpPreview || '123456')}
                    className="w-full py-1.5 bg-[#177e71] hover:bg-[#12645a] text-white text-[11px] font-extrabold rounded-lg transition"
                  >
                    ⚡ Auto-Fill Code ({otpPreview || '123456'})
                  </button>
                </div>

                {otpError && (
                  <div className="p-3 bg-[#fff0ec] rounded-xl border border-[#ff795f] text-xs font-bold text-[#cb4f3b]">
                    {otpError}
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Enter 6-Digit OTP:</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full text-center tracking-[0.5em] text-xl font-mono font-bold bg-[#f8faf9] border-2 border-[#c5d6cf] text-[#102b2c] rounded-2xl p-3 focus:border-[#177e71] focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowOtpModal(false)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="flex-1 py-3 bg-[#123d3b] hover:bg-[#0c302f] text-white font-extrabold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
                    >
                      {otpLoading ? <RefreshCw className="w-4 h-4 animate-spin text-[#bff46d]" /> : <Check className="w-4 h-4 text-[#bff46d]" />}
                      Verify & Activate ABHA
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-[#dfe8e4] p-6 sm:p-9 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#123d3b] text-[#bff46d] mx-auto shadow-md">
                <Shield className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#177e71] bg-[#177e71]/10 px-3 py-1 rounded-full inline-block">
                Ayushman Bharat Digital Mission (ABDM)
              </span>
              <h2 className="text-2xl font-extrabold text-[#102b2c]">Patient Health Record Portal</h2>
              <p className="text-xs text-[#647774] max-w-md mx-auto">
                Securely sign in to your ABHA account or register a new patient to receive, control, and share time-bound consent-driven medical records.
              </p>
            </div>

            {/* Switcher: Sign In vs Sign Up */}
            <div className="flex p-1.5 bg-[#f0f5f2] rounded-2xl border border-[#dfe8e4]">
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setLoginError(null); setRegError(null); }}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 ${
                  authMode === 'signin'
                    ? 'bg-[#123d3b] text-white shadow-md'
                    : 'text-[#526765] hover:text-[#102b2c]'
                }`}
              >
                <LogIn className="w-4 h-4" /> Sign In to Existing Account
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setLoginError(null); setRegError(null); }}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 ${
                  authMode === 'signup'
                    ? 'bg-[#123d3b] text-white shadow-md'
                    : 'text-[#526765] hover:text-[#102b2c]'
                }`}
              >
                <UserPlus className="w-4 h-4 text-[#bff46d]" /> Register New Patient (Create ABHA)
              </button>
            </div>

            {/* TAB 1: SIGN IN VIEW */}
            {authMode === 'signin' && (
              <div className="space-y-6">
                {loginError && (
                  <div className="p-3 bg-[#fff0ec] rounded-xl border border-[#ff795f] text-xs font-bold text-[#cb4f3b] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleSignIn} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Mobile Number / ABHA ID / Email:</label>
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. 9000000001 or 91-1234-5678-9012"
                      className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Password / PIN:</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                      required
                    />
                    <span className="text-[10px] text-[#8a9997] mt-1 block">
                      Tip: Demo accounts accept 'password123' or '••••••••'.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3.5 bg-[#123d3b] hover:bg-[#0c302f] text-white text-xs font-extrabold rounded-2xl transition shadow flex items-center justify-center gap-2"
                  >
                    {loginLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#bff46d]" />
                    ) : (
                      <LogIn className="w-4 h-4 text-[#bff46d]" />
                    )}
                    Sign In with Credentials
                  </button>
                </form>

                {/* Quick Select All Registered Patients (Seed & Dynamically Added) */}
                <div className="pt-4 border-t border-[#eef3f1] space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-[#526765] uppercase tracking-wider block">
                      Or Quick Select Registered Patient ({allPatients.length} in Database):
                    </span>
                    <button
                      type="button"
                      onClick={fetchPatientsList}
                      className="text-[10px] font-bold text-[#177e71] hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {allPatients.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleQuickPatientSelect(p)}
                        className="p-3 rounded-2xl border-2 border-[#d2e0da] hover:border-[#177e71] bg-[#f8faf9] hover:bg-[#f4fbf0] transition text-left flex items-center justify-between group shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#123d3b] text-[#bff46d] font-black text-xs flex-shrink-0">
                            {p.full_name?.split(' ').map((n: string) => n[0]).join('') || 'PT'}
                          </div>
                          <div className="min-w-0 truncate">
                            <h4 className="font-extrabold text-[#102b2c] text-xs truncate group-hover:text-[#177e71] transition">
                              {p.full_name}
                            </h4>
                            <p className="text-[10px] text-[#647774] font-mono truncate">
                              {p.abha_id}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#177e71] group-hover:translate-x-0.5 transition flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SIGN UP VIEW (DYNAMIC REGISTRATION) */}
            {authMode === 'signup' && (
              <div className="space-y-5 text-left">
                {regError && (
                  <div className="p-3 bg-[#fff0ec] rounded-xl border border-[#ff795f] text-xs font-bold text-[#cb4f3b] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterPatient} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Full Name (as per Aadhaar): *</label>
                      <input
                        type="text"
                        value={regFullName}
                        onChange={e => setRegFullName(e.target.value)}
                        placeholder="e.g. Aarav Sharma"
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Mobile Number (for OTP): *</label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Date of Birth: *</label>
                      <input
                        type="date"
                        value={regDob}
                        onChange={e => setRegDob(e.target.value)}
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Gender: *</label>
                      <select
                        value={regGender}
                        onChange={e => setRegGender(e.target.value)}
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Blood Group: *</label>
                      <select
                        value={regBloodGroup}
                        onChange={e => setRegBloodGroup(e.target.value)}
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Email Address (Optional):</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="e.g. aarav.sharma@example.com"
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Emergency Contact Phone:</label>
                      <input
                        type="tel"
                        value={regEmergencyPhone}
                        onChange={e => setRegEmergencyPhone(e.target.value)}
                        placeholder="e.g. 9876543211"
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Password: *</label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Confirm Password: *</label>
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={e => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#f0f5f2] rounded-xl border border-[#dfe8e4] text-[11px] text-[#526765] flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#177e71] flex-shrink-0 mt-0.5" />
                    <span>
                      Upon registering, an official 14-digit ABDM ABHA Number (e.g. 91-xxxx-xxxx-xxxx) and ABHA Address will be automatically created and bound to your encrypted health vault.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3.5 bg-[#123d3b] hover:bg-[#0c302f] text-white text-xs font-extrabold rounded-2xl transition shadow flex items-center justify-center gap-2"
                  >
                    {regLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#bff46d]" />
                    ) : (
                      <UserPlus className="w-4 h-4 text-[#bff46d]" />
                    )}
                    Register & Generate ABHA Health ID
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED PATIENT PORTAL
  // ==========================================
  return (
    <div className="min-h-screen bg-[#f5f8f6] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Modal: Add Baseline Medical Record */}
        {showAddBaselineModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 border-2 border-[#177e71] shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-base font-extrabold text-[#102b2c] flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#177e71]" /> Add Health Record Entry
                </h3>
                <button onClick={() => setShowAddBaselineModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBaselineType('allergy')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition ${
                    baselineType === 'allergy' ? 'bg-[#ff795f] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Drug Allergy
                </button>
                <button
                  type="button"
                  onClick={() => setBaselineType('diagnosis')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition ${
                    baselineType === 'diagnosis' ? 'bg-[#9a7bcc] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Medical Diagnosis
                </button>
              </div>

              <form onSubmit={handleAddBaselineRecord} className="space-y-3.5">
                {baselineType === 'allergy' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[#102b2c] mb-1">Allergen Name:</label>
                      <input
                        type="text"
                        value={baselineAllergen}
                        onChange={e => setBaselineAllergen(e.target.value)}
                        placeholder="e.g. Penicillin or Sulfa drugs"
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#102b2c] mb-1">Reaction Symptoms:</label>
                      <input
                        type="text"
                        value={baselineReaction}
                        onChange={e => setBaselineReaction(e.target.value)}
                        placeholder="e.g. Skin rash, facial swelling, breathing difficulty"
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#102b2c] mb-1">Severity Level:</label>
                      <select
                        value={baselineSeverity}
                        onChange={e => setBaselineSeverity(e.target.value)}
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none"
                      >
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe (High Risk)</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[#102b2c] mb-1">Diagnosed Condition:</label>
                      <input
                        type="text"
                        value={baselineCondition}
                        onChange={e => setBaselineCondition(e.target.value)}
                        placeholder="e.g. Type 2 Diabetes Mellitus or Hypertension"
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#102b2c] mb-1">ICD-10 Code (Optional):</label>
                      <input
                        type="text"
                        value={baselineIcd}
                        onChange={e => setBaselineIcd(e.target.value)}
                        placeholder="e.g. E11.9 or I10"
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#102b2c] mb-1">Status:</label>
                      <select
                        value={baselineStatus}
                        onChange={e => setBaselineStatus(e.target.value)}
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="chronic">Chronic</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddBaselineModal(false)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={baselineSaving}
                    className="flex-1 py-2.5 bg-[#123d3b] hover:bg-[#0c302f] text-white font-extrabold text-xs rounded-xl shadow"
                  >
                    {baselineSaving ? 'Saving...' : 'Save Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Real-time Alert for request sent to other patient */}
        {incomingAlert && (
          <div className="bg-[#123d3b] text-white p-4 rounded-2xl border-2 border-[#bff46d] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#bff46d] text-[#123d3b] flex-shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#bff46d]">
                  Doctor Request Sent for {incomingAlert.patientName}!
                </h4>
                <p className="text-xs text-white/80 mt-0.5">
                  {incomingAlert.doctorName} requested permission to access records.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  setSelectedPatientId(incomingAlert.patientId);
                  localStorage.setItem('selected_patient_id', incomingAlert.patientId);
                  if (onPatientChange) onPatientChange(incomingAlert.patientId);
                  setActiveSubTab('consents');
                  setIncomingAlert(null);
                }}
                className="px-4 py-2 bg-[#bff46d] hover:bg-[#caff78] text-[#123d3b] text-xs font-extrabold rounded-xl transition shadow flex items-center gap-1.5"
              >
                Switch & Review Request →
              </button>
              <button
                onClick={() => setIncomingAlert(null)}
                className="text-white/60 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Patient Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-5 rounded-3xl border border-[#dfe8e4] shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#123d3b] text-[#bff46d] font-extrabold text-lg flex-shrink-0">
              {displayName.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-[#102b2c]">{displayName}</h2>
                <span className="bg-[#e8ffd0] text-[#28634f] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#28634f]" /> ABDM Active Session
                </span>
              </div>
              <p className="text-xs font-mono text-[#647774] mt-0.5">
                ABHA ID: <span className="font-bold text-[#177e71]">{displayAbhaId}</span> ({displayAbhaAddress})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#647774]">Switch Patient:</span>
              <select
                value={selectedPatientId}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedPatientId(val);
                  localStorage.setItem('selected_patient_id', val);
                  if (onPatientChange) onPatientChange(val);
                  setActiveSubTab('consents');
                }}
                className="bg-[#f0f5f2] border border-[#d2e0da] text-xs font-bold text-[#102b2c] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#177e71] cursor-pointer max-w-[200px] truncate"
              >
                {allPatients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.abha_id})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setIsAuthenticated(false);
                setAuthMode('signup');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#eef6f3] hover:bg-[#dfeee8] text-xs font-bold text-[#177e71] transition"
              title="Register a new patient"
            >
              <UserPlus className="w-3.5 h-3.5" /> + New Patient
            </button>

            <button
              onClick={() => {
                setIsAuthenticated(false);
                localStorage.removeItem('patient_auth');
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition"
              title="Sign Out of Patient Portal"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#dfe8e4] pb-2">
          <button
            onClick={() => setActiveSubTab('consents')}
            className={`relative px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeSubTab === 'consents'
                ? 'bg-[#123d3b] text-white shadow-md'
                : 'bg-white text-[#526765] hover:bg-[#e4ece8]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Pending & Active Access</span>
            {pendingConsents.length > 0 && (
              <span className="bg-[#ff795f] text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                {pendingConsents.length} REQUEST
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('card')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeSubTab === 'card'
                ? 'bg-[#123d3b] text-white shadow-md'
                : 'bg-white text-[#526765] hover:bg-[#e4ece8]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Digital Health Card & QR Code</span>
          </button>

          <button
            onClick={() => setActiveSubTab('records')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeSubTab === 'records'
                ? 'bg-[#123d3b] text-white shadow-md'
                : 'bg-white text-[#526765] hover:bg-[#e4ece8]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>My Health Records & Timeline</span>
          </button>

          <button
            onClick={() => setActiveSubTab('prescription')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeSubTab === 'prescription'
                ? 'bg-[#123d3b] text-white shadow-md'
                : 'bg-white text-[#526765] hover:bg-[#e4ece8]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Official Prescription Pad</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeSubTab === 'history'
                ? 'bg-[#123d3b] text-white shadow-md'
                : 'bg-white text-[#526765] hover:bg-[#e4ece8]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Access History & Revocations</span>
          </button>
        </div>

        {/* SECTION 1: PENDING CONSENT REQUESTS & ACTIVE GRANTS */}
        {activeSubTab === 'consents' && (
          <div className="space-y-6">

            {/* PENDING CONSENT REQUESTS WAITING FOR PATIENT APPROVAL */}
            {pendingConsents.length > 0 ? (
              <div className="bg-white rounded-3xl border-2 border-[#177e71] p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-[#eef3f1] pb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff0ec] text-[#d95d45]">
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#102b2c]">Pending Doctor Consent Request</h3>
                      <p className="text-xs text-[#647774]">Doctor is waiting for your explicit approval</p>
                    </div>
                  </div>
                  <span className="bg-[#177e71]/10 text-[#177e71] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    ACTION REQUIRED
                  </span>
                </div>

                {pendingConsents.map(req => (
                  <div key={req.id} className="space-y-5">
                    <div className="bg-[#f8faf9] p-4 rounded-2xl border border-[#dfe8e4] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#177e71]">Requesting Provider</p>
                        <h4 className="text-lg font-extrabold text-[#102b2c]">{req.provider_name}</h4>
                        <p className="text-xs text-[#526765] mt-0.5">
                          Doctor: <span className="font-semibold text-[#102b2c]">{req.requester_name || 'Attending Physician'}</span> · Purpose: <span className="font-semibold text-[#102b2c]">{req.purpose}</span>
                        </p>
                        <p className="text-[11px] text-[#8a9997] mt-0.5">
                          Requested at: {req.requested_at ? new Date(req.requested_at).toLocaleTimeString() : 'Just now'}
                        </p>
                      </div>

                      <button
                        onClick={() => setPreviewOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#c5d6cf] text-xs font-extrabold text-[#177e71] hover:bg-[#eef6f3] transition"
                      >
                        <Eye className="w-4 h-4" /> Preview Records Before Sharing
                      </button>
                    </div>

                    {/* Scope Selector Checkboxes */}
                    <div>
                      <p className="text-xs font-extrabold text-[#102b2c] mb-2">Select Health Records to Release to Doctor:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {['allergies', 'medications', 'diagnoses', 'lab_results', 'imaging', 'reports', 'encounters'].map(scope => {
                          const isChecked = selectedScopes.includes(scope);
                          return (
                            <label
                              key={scope}
                              className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                                isChecked ? 'bg-[#f4fbf0] border-[#c8dfbc] text-[#123d3b]' : 'bg-white border-[#e0e8e4] text-[#8a9997]'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${isChecked ? 'bg-[#177e71]' : 'bg-gray-300'}`} />
                                {scopeLabels[scope]}
                              </span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedScopes(selectedScopes.filter(s => s !== scope));
                                  } else {
                                    setSelectedScopes([...selectedScopes, scope]);
                                  }
                                }}
                                className="accent-[#177e71] h-4 w-4 rounded cursor-pointer"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dynamic Access Duration Selector */}
                    <div>
                      <p className="text-xs font-extrabold text-[#102b2c] mb-2">Set Access Time Limit (Auto-Expires):</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { id: '15_mins', label: '15 Mins', detail: 'Quick review' },
                          { id: '30_mins', label: '30 Mins', detail: 'Short visit' },
                          { id: '1_hour', label: '1 Hour', detail: 'Standard visit' },
                          { id: 'this_visit', label: '2 Hours', detail: 'Full consultation' },
                          { id: '4_hours', label: '4 Hours', detail: 'Half day access' },
                          { id: '24_hours', label: '24 Hours', detail: 'Day long' },
                          { id: '7_days', label: '7 Days', detail: 'Follow-up period' }
                        ].map(d => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setSelectedDuration(d.id)}
                            className={`p-2.5 rounded-2xl border text-center transition ${
                              selectedDuration === d.id
                                ? 'bg-[#123d3b] text-white border-[#123d3b] shadow-md'
                                : 'bg-white text-[#526765] border-[#dfe8e4] hover:bg-[#f0f5f2]'
                            }`}
                          >
                            <span className="block text-xs font-extrabold">{d.label}</span>
                            <span className="block text-[10px] opacity-80 mt-0.5">{d.detail}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons: Approve & Deny */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#bff46d] hover:bg-[#caff78] text-[#163f3b] py-3.5 rounded-2xl font-extrabold text-sm shadow-md transition"
                      >
                        <Check className="w-5 h-5" /> Approve Consent & Release Records
                      </button>
                      <button
                        onClick={() => handleDeny(req.id)}
                        className="px-6 bg-[#fff0ec] hover:bg-[#ffe2db] text-[#d95d45] py-3.5 rounded-2xl font-extrabold text-sm transition"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-[#dfe8e4] text-center py-10 space-y-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f0f5f2] text-[#177e71] mx-auto">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-[#102b2c]">No Pending Access Requests for {displayName}</h3>
                <p className="text-xs text-[#647774] mt-1 max-w-sm mx-auto">
                  When a doctor scans your digital health card QR or enters your ABHA ID, their consent request will appear here instantly for your review.
                </p>
              </div>
            )}

            {/* ACTIVE ACCESS GRANTS */}
            <div className="bg-white p-6 rounded-3xl border border-[#dfe8e4] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#eef3f1] pb-3">
                <h3 className="text-base font-extrabold text-[#102b2c] flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#5ab79f] animate-ping" />
                  Active Access Grants ({activeConsents.length})
                </h3>
                <span className="text-xs text-[#647774]">Live Encrypted Sessions</span>
              </div>

              {activeConsents.length > 0 ? (
                <div className="space-y-3">
                  {activeConsents.map(grant => (
                    <div
                      key={grant.id}
                      className="p-4 rounded-2xl bg-[#f4fbf0] border border-[#c8dfbc] flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-[#102b2c] text-sm">{grant.provider_name}</h4>
                          <span className="bg-[#bff46d] text-[#123d3b] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                            ACTIVE
                          </span>
                        </div>
                        <p className="text-xs text-[#526765] mt-1">
                          Doctor: <span className="font-bold text-[#102b2c]">{grant.requester_name || 'Attending Physician'}</span> · Duration: <span className="font-bold text-[#102b2c]">{grant.duration?.replace('_', ' ')}</span> · Expires: {grant.expires_at ? new Date(grant.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Session End'}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(grant.granted_scopes || []).map((s: string) => (
                            <span key={s} className="bg-white border border-[#c8dfbc] text-[#28634f] text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {scopeLabels[s] || s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevoke(grant.id)}
                        className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#fff0ec] hover:bg-[#ffe2db] text-[#cb4f3b] text-xs font-extrabold transition shadow-sm"
                      >
                        <Lock className="w-4 h-4" /> Revoke Access (Shred Key)
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8a9997] italic py-2">No active doctor sessions at the moment.</p>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: DIGITAL HEALTH CARD & QR CODE */}
        {activeSubTab === 'card' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* ABHA Card Graphic */}
            <div className="bg-[#123d3b] text-white p-7 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[380px]">
              <div className="absolute right-0 top-0 w-64 h-64 bg-[#bff46d]/10 rounded-full blur-3xl" />
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#bff46d]">
                      AYUSHMAN BHARAT DIGITAL MISSION
                    </span>
                    <h3 className="text-2xl font-extrabold mt-1">ABHA Health Card</h3>
                  </div>
                  <Shield className="w-8 h-8 text-[#bff46d]" />
                </div>

                <div className="mt-8 space-y-3">
                  <div>
                    <p className="text-[10px] text-white/50 font-bold uppercase">Patient Name</p>
                    <p className="text-xl font-extrabold">{displayName}</p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[10px] text-white/50 font-bold uppercase">ABHA ID</p>
                      <p className="text-sm font-mono font-bold text-[#bff46d]">{displayAbhaId}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 font-bold uppercase">ABHA Address</p>
                      <p className="text-xs font-mono text-white/80">{displayAbhaAddress}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 font-bold uppercase">Blood Group</p>
                      <p className="text-xs font-bold text-white">{patient?.blood_group || 'B+'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xs text-white/60">
                <span>Emergency Contact: {patient?.emergency_contact_name ? `${patient.emergency_contact_name} (${patient.emergency_contact_phone})` : '+91 90000 00011'}</span>
                <span className="text-[#bff46d] font-bold">COREX Protected</span>
              </div>
            </div>

            {/* Generated QR Code Container */}
            <div className="bg-white p-7 rounded-3xl border border-[#dfe8e4] text-center flex flex-col items-center justify-center space-y-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#177e71]">Initiate Health Record Sharing</p>
                <h4 className="text-base font-extrabold text-[#102b2c] mt-0.5">Physical Scan QR Code</h4>
              </div>

              <div className="p-4 bg-[#f4fbf0] border-2 border-[#123d3b] rounded-2xl shadow-inner inline-block">
                <QRCodeSVG
                  value={qrPayload}
                  size={190}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#123d3b"
                />
              </div>

              <div className="text-xs space-y-1">
                <p className="text-[#647774]">
                  Token Hash: <span className="font-mono text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold text-[#102b2c]">{patient?.qr_token || 'qr_token_verified'}</span>
                </p>
                <p className="text-[11px] text-[#8a9997] max-w-xs mx-auto">
                  🔒 Scanning this QR code from the Doctor Portal initiates a real-time consent handshake. Records remain encrypted and patient-controlled.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: MY HEALTH RECORDS & TIMELINE */}
        {activeSubTab === 'records' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-3xl border border-[#dfe8e4] shadow-sm">
              <div>
                <h3 className="font-extrabold text-[#102b2c] text-base">Personal Health Vault & Records</h3>
                <p className="text-xs text-[#647774]">All medical history is encrypted and patient-held. Doctors only access what you explicitly approve.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBaselineModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#123d3b] hover:bg-[#0c302f] text-white font-extrabold text-xs rounded-xl transition shadow"
              >
                <Plus className="w-4 h-4 text-[#bff46d]" /> Add Allergy / Diagnosis
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Allergies Card */}
              <div className="bg-white p-5 rounded-3xl border border-[#dfe8e4] space-y-3">
                <h3 className="font-extrabold text-[#102b2c] text-sm flex items-center justify-between">
                  <span>Drug Allergies ({medicalRecords?.allergies?.length || 0})</span>
                  <AlertTriangle className="w-4 h-4 text-[#ff795f]" />
                </h3>
                <div className="space-y-2">
                  {medicalRecords?.allergies && medicalRecords.allergies.length > 0 ? (
                    medicalRecords.allergies.map((a: any) => (
                      <div key={a.id} className="p-3 bg-[#fff0ec] rounded-2xl border border-[#ffd5cc]">
                        <p className="font-extrabold text-[#cb4f3b] text-xs">{a.allergen}</p>
                        <p className="text-[11px] text-[#647774] mt-0.5">Reaction: {a.reaction}</p>
                        <span className="inline-block mt-1 bg-[#ff795f] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          {a.severity}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No drug allergies recorded.</p>
                  )}
                </div>
              </div>

              {/* Current Medications */}
              <div className="bg-white p-5 rounded-3xl border border-[#dfe8e4] space-y-3">
                <h3 className="font-extrabold text-[#102b2c] text-sm flex items-center justify-between">
                  <span>Current Medications ({medicalRecords?.medications?.length || 0})</span>
                  <Activity className="w-4 h-4 text-[#5ab79f]" />
                </h3>
                <div className="space-y-2">
                  {medicalRecords?.medications && medicalRecords.medications.length > 0 ? (
                    medicalRecords.medications.map((m: any) => (
                      <div key={m.id} className="p-3 bg-[#f4fbf0] rounded-2xl border border-[#c8dfbc]">
                        <p className="font-extrabold text-[#123d3b] text-xs">{m.name}</p>
                        <p className="text-[11px] text-[#526765] mt-0.5">Dosage: {m.dosage} · {m.frequency}</p>
                        <p className="text-[10px] text-[#8a9997] mt-1">Started: {m.start_date}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No active medications.</p>
                  )}
                </div>
              </div>

              {/* Medical Diagnoses */}
              <div className="bg-white p-5 rounded-3xl border border-[#dfe8e4] space-y-3">
                <h3 className="font-extrabold text-[#102b2c] text-sm flex items-center justify-between">
                  <span>Medical Diagnoses ({medicalRecords?.diagnoses?.length || 0})</span>
                  <UserCheck className="w-4 h-4 text-[#9a7bcc]" />
                </h3>
                <div className="space-y-2">
                  {medicalRecords?.diagnoses && medicalRecords.diagnoses.length > 0 ? (
                    medicalRecords.diagnoses.map((d: any) => (
                      <div key={d.id} className="p-3 bg-[#f7f4fc] rounded-2xl border border-[#e3d7f7]">
                        <p className="font-extrabold text-[#5c3c92] text-xs">{d.condition}</p>
                        <p className="text-[11px] text-[#647774] mt-0.5">ICD-10: {d.icd10_code || 'N/A'}</p>
                        <span className="inline-block mt-1 bg-[#9a7bcc] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          {d.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No diagnoses recorded.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Longitudinal Medical Timeline */}
            <div className="bg-white p-6 rounded-3xl border border-[#dfe8e4] shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-[#102b2c]">Unified Longitudinal Timeline</h3>
              <div className="relative border-l-2 border-[#177e71]/20 ml-3 space-y-6 pl-6 py-2">
                {medicalRecords?.timeline && medicalRecords.timeline.length > 0 ? (
                  medicalRecords.timeline.map((item: any, idx: number) => (
                    <div key={idx} className="relative group">
                      <span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#177e71]" />
                      <div className="bg-[#f8faf9] p-4 rounded-2xl border border-[#e4ece8]">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-[#177e71] uppercase tracking-wider">{item.type}</span>
                          <span className="text-[#8a9997] font-semibold">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-extrabold text-[#102b2c] text-sm mt-1">{item.title}</h4>
                        <p className="text-xs text-[#526765] mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No timeline entries found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: OFFICIAL PRESCRIPTION PAD */}
        {activeSubTab === 'prescription' && (
          <div className="space-y-4">
            <PrescriptionPad
              patient={{
                full_name: displayName,
                abha_id: displayAbhaId,
                date_of_birth: patient?.date_of_birth || '1978-04-12',
                gender: patient?.gender || 'M',
                blood_group: patient?.blood_group || 'B+',
                emergency_contact_phone: patient?.emergency_contact_phone || '9000000011'
              }}
              medications={medicalRecords?.medications}
              allergies={medicalRecords?.allergies}
              diagnoses={medicalRecords?.diagnoses}
              observations={medicalRecords?.observations}
              aiSummaryText={`Patient Record Summary (${displayName}): Active diagnoses evaluated. Encrypted health records maintained.`}
            />
          </div>
        )}

        {/* SECTION 5: ACCESS HISTORY & LOGS */}
        {activeSubTab === 'history' && (
          <div className="bg-white p-6 rounded-3xl border border-[#dfe8e4] shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-[#102b2c]">Access History & Revocation Logs</h3>
              <p className="text-xs text-[#647774] mt-0.5">Complete recorded viewing history, grants, denials, and key destruction events.</p>
            </div>

            <div className="divide-y divide-[#eef3f1]">
              {pastConsents.length > 0 ? (
                pastConsents.map(c => (
                  <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#102b2c]">{c.provider_name}</span>
                        <span className="text-[#647774]">({c.purpose || 'Clinical Consultation'})</span>
                      </div>
                      <p className="text-[11px] text-[#8a9997] mt-0.5">
                        Requested: {c.requested_at ? new Date(c.requested_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] uppercase ${
                        c.status === 'revoked' ? 'bg-[#fff0ec] text-[#d95d45]' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {c.status === 'revoked' ? 'REVOKED (KEY SHREDDED)' : c.status.toUpperCase()}
                      </span>
                      <span className="text-[#8a9997] text-[11px]">
                        {new Date(c.decided_at || c.requested_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 py-4 italic text-center">No past access history recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Pre-Consent Data Preview Modal */}
        {previewOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-[#dfe8e4] shadow-2xl">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-base font-extrabold text-[#102b2c] flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#177e71]" /> Pre-Consent Data Preview
                </h3>
                <button onClick={() => setPreviewOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#647774]">
                Snapshot of health records that will be released to the doctor once approved:
              </p>

              <div className="max-h-64 overflow-y-auto space-y-3 pr-1 text-xs">
                {medicalRecords?.allergies?.map((a: any) => (
                  <div key={a.id} className="p-3 bg-[#fff0ec] rounded-xl border border-[#ffd5cc]">
                    <p className="font-bold text-[#cb4f3b]">Allergy: {a.allergen} ({a.severity})</p>
                  </div>
                ))}
                {medicalRecords?.medications?.map((m: any) => (
                  <div key={m.id} className="p-3 bg-[#f4fbf0] rounded-xl border border-[#c8dfbc]">
                    <p className="font-bold text-[#123d3b]">Prescription: {m.name} ({m.dosage})</p>
                  </div>
                ))}
                {medicalRecords?.diagnoses?.map((d: any) => (
                  <div key={d.id} className="p-3 bg-[#f7f4fc] rounded-xl border border-[#e3d7f7]">
                    <p className="font-bold text-[#5c3c92]">Diagnosis: {d.condition}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setPreviewOpen(false)}
                className="w-full py-3 bg-[#123d3b] text-white font-extrabold text-xs rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
