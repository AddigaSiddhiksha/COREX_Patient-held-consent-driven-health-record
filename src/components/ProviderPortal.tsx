import React, { useState, useEffect } from 'react';
import {
  QrCode, Stethoscope, Search, Clock, AlertTriangle, ShieldCheck,
  FileText, Plus, Sparkles, Lock, CheckCircle2, RefreshCw, AlertCircle,
  Calendar, Pill, ClipboardList, History, ShieldAlert, LogIn, LogOut,
  User, ChevronLeft, ArrowRight, Eye, Check, X, CheckSquare, Trash2, Zap,
  UserPlus, Building2, Award, Shield, Phone, Mail
} from 'lucide-react';
import { PrescriptionPad } from './PrescriptionPad';

interface ProviderPortalProps {
  onSwitchToPatient?: (patientId?: string) => void;
}

export const ProviderPortal: React.FC<ProviderPortalProps> = ({ onSwitchToPatient }) => {
  // Doctor Authentication & Facility State (Persisted in localStorage across tab switches)
  const [isDoctorAuthenticated, setIsDoctorAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('doctor_portal_authenticated') === 'true';
  });

  const [showDoctorLoginModal, setShowDoctorLoginModal] = useState<boolean>(false);
  const [docAuthMode, setDocAuthMode] = useState<'signin' | 'signup'>('signin');

  // Doctor Sign In Form State
  const [docLoginReg, setDocLoginReg] = useState('TS-PHC-0001');
  const [docLoginPassword, setDocLoginPassword] = useState('••••••••');
  const [docLoginLoading, setDocLoginLoading] = useState(false);
  const [docLoginError, setDocLoginError] = useState<string | null>(null);
  const [pendingDocVerification, setPendingDocVerification] = useState<any | null>(null);

  // Doctor Sign Up (New Doctor & Facility Registration) Form State
  const [docRegName, setDocRegName] = useState('');
  const [docRegNumber, setDocRegNumber] = useState('');
  const [docRegSpecialty, setDocRegSpecialty] = useState('General Medicine');
  const [docRegQualification, setDocRegQualification] = useState('MBBS, MD');
  const [docRegCouncil, setDocRegCouncil] = useState('National Medical Commission (NMC)');
  const [docRegFacilityName, setDocRegFacilityName] = useState('');
  const [docRegType, setDocRegType] = useState('clinic');
  const [docRegDistrict, setDocRegDistrict] = useState('Hyderabad');
  const [docRegPhone, setDocRegPhone] = useState('');
  const [docRegEmail, setDocRegEmail] = useState('');
  const [docRegPassword, setDocRegPassword] = useState('password123');
  const [docRegConfirmPassword, setDocRegConfirmPassword] = useState('password123');
  const [docRegAutoVerify, setDocRegAutoVerify] = useState(true);
  const [docRegLoading, setDocRegLoading] = useState(false);
  const [docRegError, setDocRegError] = useState<string | null>(null);

  // Dynamic Lists from Database
  const [allProviders, setAllProviders] = useState<any[]>([]);
  const [allPatients, setAllPatients] = useState<any[]>([]);

  const [selectedProviderId, setSelectedProviderId] = useState<string>(() => {
    return localStorage.getItem('doctor_portal_provider_id') || '20000000-0000-0000-0000-000000000001';
  });

  const [providerName, setProviderName] = useState<string>(() => {
    const pId = localStorage.getItem('doctor_portal_provider_id') || '20000000-0000-0000-0000-000000000001';
    return pId.endsWith('1') ? 'Shamirpet PHC (Dr. A. Reddy)' : 'Sai Care Clinic (Dr. Ananya Rao)';
  });

  // Consultations List State (Stored directly from database)
  const [providerConsents, setProviderConsents] = useState<any[]>([]);
  const [consultationsTab, setConsultationsTab] = useState<'active' | 'pending' | 'completed'>('active');

  // New Request Modal / Lookup State
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [identifierInput, setIdentifierInput] = useState('91-1234-5678-9012');
  const [patientLookup, setPatientLookup] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [requestedScopes, setRequestedScopes] = useState<string[]>([
    'allergies', 'medications', 'diagnoses', 'lab_results', 'imaging', 'reports', 'encounters'
  ]);
  const [requestedDuration, setRequestedDuration] = useState('15_mins');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Patient Identity Mismatch Security Modal (Shown only when in active workspace)
  const [mismatchModal, setMismatchModal] = useState<{
    activePatientName: string;
    requestedPatientName: string;
    requestedPatientId: string;
  } | null>(null);

  // Selected Active Consultation Workspace State
  const [activeConsent, setActiveConsent] = useState<any | null>(null);
  const [patientData, setPatientData] = useState<any | null>(null);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Sub-Tab inside Active Consultation: 'pad' | 'records' | 'summary' | 'timeline'
  const [workspaceTab, setWorkspaceTab] = useState<'pad' | 'records' | 'summary' | 'timeline'>('pad');

  // Editable Prescription Pad State
  const [editableNotes, setEditableNotes] = useState<string>(
    'Patient presented for routine consultation. BP and glycemic levels evaluated. Advised diabetic diet and prescribed medications.'
  );
  const [editableMedications, setEditableMedications] = useState<any[]>([
    { name: 'Metformin HCl 500mg', dosage: '500mg', frequency: 'Twice daily after meals', duration: '30 Days', instructions: 'Take after breakfast & dinner' },
    { name: 'Glimepiride 1mg', dosage: '1mg', frequency: 'Once daily before breakfast', duration: '30 Days', instructions: 'Take before breakfast' }
  ]);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [completingConsultation, setCompletingConsultation] = useState(false);

  // AI Visit Summary
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch all registered providers from SQLite database
  const fetchProvidersList = async () => {
    try {
      const res = await fetch('/api/providers');
      if (res.ok) {
        const data = await res.json();
        setAllProviders(data || []);
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  };

  // Fetch all registered patients from SQLite database
  const fetchPatientsList = async () => {
    try {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const data = await res.json();
        setAllPatients(data || []);
      }
    } catch (err) {
      console.error('Error fetching patients list:', err);
    }
  };

  useEffect(() => {
    fetchProvidersList();
    fetchPatientsList();
  }, []);

  // Persist doctor session state to localStorage
  useEffect(() => {
    localStorage.setItem('doctor_portal_provider_id', selectedProviderId);
    localStorage.setItem('doctor_portal_authenticated', isDoctorAuthenticated ? 'true' : 'false');
  }, [selectedProviderId, isDoctorAuthenticated]);

  // Display doctor details (Dynamic matching)
  const currentProviderObj = allProviders.find(p => p.id === selectedProviderId);
  const displayDoctorName = isDoctorAuthenticated
    ? providerName
    : (currentProviderObj?.name || (selectedProviderId.endsWith('1') ? 'Shamirpet PHC (Dr. A. Reddy)' : 'Sai Care Clinic (Dr. Ananya Rao)'));

  const displayRegNo = currentProviderObj?.registration_no || (selectedProviderId.endsWith('1') ? 'TS-PHC-0001' : 'TS-CLN-0457');

  const scopeLabels: Record<string, string> = {
    allergies: 'Allergies & Drug Warnings',
    medications: 'Current Prescriptions',
    diagnoses: 'Diagnoses & Conditions',
    lab_results: 'Lab Test Results',
    imaging: 'Imaging & X-Rays',
    reports: 'Diagnostic Reports',
    encounters: 'Past Encounters'
  };

  // Toast notification auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Fetch all consents for the currently selected provider from SQLite database
  const fetchProviderConsents = async () => {
    try {
      const res = await fetch(`/api/providers/${selectedProviderId}/consents`);
      if (res.ok) {
        const data = await res.json();
        setProviderConsents(data || []);
      }
    } catch (err) {
      console.error('Error fetching provider consents:', err);
    }
  };

  useEffect(() => {
    fetchProviderConsents();
  }, [selectedProviderId]);

  // Check URL parameters for QR scan token on phone scan
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scanParam = params.get('scan');
    if (scanParam) {
      setIdentifierInput(scanParam);
      setShowRequestForm(true);
      handleLookupPatient(scanParam.trim());
    }
  }, []);

  // Handle Dynamic Doctor Sign In
  const handleDoctorSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocLoginError(null);
    setPendingDocVerification(null);
    setDocLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: docLoginReg, password: docLoginPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.isPendingVerification) {
          setPendingDocVerification(data.provider);
          setDocLoginError('Medical Council credential verification pending.');
        } else {
          setDocLoginError(data.error || 'Failed to sign in as doctor.');
        }
        return;
      }

      const p = data.provider;
      setSelectedProviderId(p.id);
      setProviderName(`${p.name} (${p.specialty || p.type})`);
      setIsDoctorAuthenticated(true);
      setShowDoctorLoginModal(false);
      setActiveConsent(null);
      setPatientData(null);
      setToastMessage(`🩺 Welcome Dr. ${p.name}! Verified doctor session active.`);
      await fetchProvidersList();
    } catch (err: any) {
      setDocLoginError(err.message || 'Network error signing in as doctor.');
    } finally {
      setDocLoginLoading(false);
    }
  };

  // Handle Dynamic Doctor Registration (Sign Up)
  const handleDoctorRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocRegError(null);
    if (!docRegName.trim() || !docRegNumber.trim() || !docRegPassword) {
      setDocRegError('Doctor name, registration number, and password are required.');
      return;
    }
    if (docRegPassword !== docRegConfirmPassword) {
      setDocRegError('Passwords do not match. Please re-enter.');
      return;
    }

    setDocRegLoading(true);
    try {
      const res = await fetch('/api/auth/register-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docRegName.trim(),
          registrationNo: docRegNumber.trim(),
          specialty: docRegSpecialty,
          qualification: docRegQualification,
          councilName: docRegCouncil,
          type: docRegType,
          district: docRegDistrict,
          address: docRegFacilityName || `${docRegDistrict} Medical Centre`,
          phone: docRegPhone,
          email: docRegEmail,
          password: docRegPassword,
          autoVerify: docRegAutoVerify
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setDocRegError(data.error || 'Doctor registration failed.');
        return;
      }

      // If verified, activate session immediately
      if (data.is_verified) {
        setSelectedProviderId(data.providerId);
        setProviderName(`${docRegName.trim()} (${docRegSpecialty})`);
        setIsDoctorAuthenticated(true);
        setShowDoctorLoginModal(false);
        setActiveConsent(null);
        setPatientData(null);
        setToastMessage(`🩺 Doctor registration complete! Credentials verified with ${docRegCouncil}.`);
      } else {
        setToastMessage(`Doctor registration submitted. NMC Registry verification required.`);
        setShowDoctorLoginModal(false);
      }
      await fetchProvidersList();
    } catch (err: any) {
      setDocRegError(err.message || 'Error registering doctor.');
    } finally {
      setDocRegLoading(false);
    }
  };

  // Handle Instant Credential Verification simulation with NMC
  const handleVerifyDoctorCredentials = async (providerId: string) => {
    try {
      const res = await fetch(`/api/admin/doctors/${providerId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifiedBy: 'National Medical Commission (NMC Live Registry)' })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedProviderId(providerId);
        setProviderName(data.provider.name);
        setIsDoctorAuthenticated(true);
        setShowDoctorLoginModal(false);
        setPendingDocVerification(null);
        setDocLoginError(null);
        setToastMessage(`✅ Credentials verified with NMC! Dr. ${data.provider.name} is now approved.`);
        await fetchProvidersList();
      }
    } catch (err) {
      console.error('Error verifying doctor credentials:', err);
    }
  };

  // Real-Time SSE Listener for instant synchronization across devices/windows
  useEffect(() => {
    const es = new EventSource('/api/events');

    es.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        const { eventType, payload } = data;

        if (
          eventType === 'consent_requested' ||
          eventType === 'consent_approved' ||
          eventType === 'consent_denied' ||
          eventType === 'consent_revoked' ||
          eventType === 'consent_expired' ||
          eventType === 'consent_completed'
        ) {
          await fetchProviderConsents();

          // If current active consultation was revoked, completed, or expired, lock records immediately!
          if (activeConsent && payload?.consentId === activeConsent.id) {
            if (
              eventType === 'consent_revoked' ||
              eventType === 'consent_expired' ||
              eventType === 'consent_denied' ||
              eventType === 'consent_completed'
            ) {
              setActiveConsent(null);
              setPatientData(null);
              setAccessDeniedMessage("This patient's consultation session has ended or access expired.");
            }
          }

          if (eventType === 'consent_approved') {
            setToastMessage('🎉 Patient approved access! Consultation is now active in your dashboard.');
          }
        }
      } catch (err) {
        console.error('SSE event processing error:', err);
      }
    };

    return () => {
      es.close();
    };
  }, [selectedProviderId, activeConsent]);

  // Live countdown timer calculation for active consultation session
  useEffect(() => {
    if (!activeConsent?.expires_at || activeConsent?.status !== 'approved') {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const expiresAtTime = new Date(activeConsent.expires_at).getTime();
      const now = Date.now();
      const diff = expiresAtTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setActiveConsent(null);
        setPatientData(null);
        setAccessDeniedMessage("This active consultation has expired. Records moved to completed consultations.");
        fetchProviderConsents();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setTimeLeft(`${pad(hours)}:${pad(mins)}:${pad(secs)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeConsent]);

  // Patient search lookup with optional direct identifier
  const handleLookupPatient = async (overrideId?: string) => {
    const idToSearch = (overrideId || identifierInput).trim();
    if (!idToSearch) return;

    try {
      setLookupLoading(true);
      const res = await fetch(`/api/patients/by-identifier/${encodeURIComponent(idToSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setIdentifierInput(idToSearch);

        // Warn about mismatch ONLY if the doctor is currently in the middle of viewing an active workspace
        if (activeConsent && activeConsent.patient_id !== data.id) {
          setMismatchModal({
            activePatientName: activeConsent.patient_name || 'Current Patient',
            requestedPatientName: data.full_name,
            requestedPatientId: data.id
          });
        }

        setPatientLookup(data);
      } else {
        alert('Patient not found with that ABHA ID or QR token. Please check and try again.');
      }
    } catch (err) {
      console.error('Lookup error:', err);
      alert('Error searching for patient. Please verify backend is running.');
    } finally {
      setLookupLoading(false);
    }
  };

  // Submit consent request to patient with dynamic duration choice
  const handleSendConsentRequest = async () => {
    if (!patientLookup) return;

    // PATIENT MISMATCH CHECK BEFORE SENDING (Only if actively consulting another patient)
    if (activeConsent && activeConsent.patient_id !== patientLookup.id) {
      setMismatchModal({
        activePatientName: activeConsent.patient_name || 'Current Patient',
        requestedPatientName: patientLookup.full_name,
        requestedPatientId: patientLookup.id
      });
      return;
    }

    try {
      const res = await fetch('/api/consents/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientLookup.id,
          providerId: selectedProviderId,
          requesterName: displayDoctorName,
          purpose: 'Outpatient Consultation & Clinical Audit',
          requestedScopes,
          duration: requestedDuration
        })
      });

      if (res.ok) {
        const data = await res.json();
        const pName = patientLookup.full_name;
        setShowRequestForm(false);
        setPatientLookup(null);
        await fetchProviderConsents();
        setConsultationsTab('pending');
        setToastMessage(`✅ Access request successfully sent to ${pName}'s Patient Portal! Awaiting patient approval.`);
      } else {
        const errData = await res.json();
        alert(`Failed to send request: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error requesting consent:', err);
      alert('Network error while sending consent request.');
    }
  };

  // Fast-Approve action for seamless demo/testing without leaving the doctor portal
  const handleFastApprove = async (consentId: string, scopes: string[] = requestedScopes, duration: string = '15_mins') => {
    try {
      const res = await fetch(`/api/consents/${consentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantedScopes: scopes && scopes.length > 0 ? scopes : requestedScopes,
          duration: duration || '15_mins',
          channel: 'app'
        })
      });

      if (res.ok) {
        await fetchProviderConsents();
        setConsultationsTab('active');
        setToastMessage('⚡ Consent Approved! Active consultation session is ready to launch.');
      }
    } catch (err) {
      console.error('Error fast-approving consent:', err);
    }
  };

  // Open an active consultation (Strict patient-specific session link)
  const handleOpenConsultation = async (consent: any) => {
    try {
      const pId = consent.patient_id;
      const cId = consent.id;

      const rRes = await fetch(`/api/patient-records/${pId}?consentId=${cId}&isSelfView=true`);
      if (rRes.ok) {
        const rData = await rRes.json();
        setActiveConsent(consent);
        setPatientData(rData);
        setAccessDeniedMessage(null);

        if (rData.medications && rData.medications.length > 0) {
          setEditableMedications(
            rData.medications.map((m: any) => ({
              name: m.name,
              dosage: m.dosage || '500mg',
              frequency: m.frequency || 'Once daily',
              duration: m.duration || '30 Days',
              instructions: m.instructions || 'Take after meals'
            }))
          );
        }
      } else {
        const errData = await rRes.json();
        setActiveConsent(null);
        setPatientData(null);
        setAccessDeniedMessage(errData.message || 'Access denied: Patient consent is required or has expired.');
      }
    } catch (err) {
      console.error('Error opening consultation:', err);
    }
  };

  // Complete consultation: updates SQLite database so consultation moves to completed permanently
  const handleCompleteConsultation = async (consentId: string) => {
    try {
      setCompletingConsultation(true);
      const res = await fetch(`/api/consents/${consentId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorName: displayDoctorName })
      });

      if (res.ok) {
        if (activeConsent?.id === consentId) {
          setActiveConsent(null);
          setPatientData(null);
        }
        await fetchProviderConsents();
        setConsultationsTab('completed');
        setToastMessage('✅ Consultation marked as COMPLETED. Records locked and moved to Completed history.');
      } else {
        alert('Failed to complete consultation on server.');
      }
    } catch (err) {
      console.error('Error completing consultation:', err);
    } finally {
      setCompletingConsultation(false);
    }
  };

  // Add medication to editable prescription pad
  const handleAddMedicationToPad = (newMed: any) => {
    setEditableMedications(prev => [...prev, newMed]);
  };

  // Remove medication from editable prescription pad
  const handleRemoveMedicationFromPad = (index: number) => {
    setEditableMedications(prev => prev.filter((_, i) => i !== index));
  };

  // Save & Issue Prescription
  const handleSavePrescription = async () => {
    if (!activeConsent || !patientData) return;
    try {
      setSavingPrescription(true);

      // Save clinical notes
      await fetch('/api/clinical-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientData.patient.id,
          providerId: selectedProviderId,
          consentId: activeConsent.id,
          doctorName: displayDoctorName,
          chiefComplaint: 'Outpatient Consultation Follow-Up',
          notes: editableNotes
        })
      });

      // Save medications
      for (const med of editableMedications) {
        await fetch('/api/prescriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: patientData.patient.id,
            providerId: selectedProviderId,
            consentId: activeConsent.id,
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            startDate: new Date().toISOString().split('T')[0]
          })
        });
      }

      setToastMessage('Prescription issued and added to patient medical records!');
      await handleOpenConsultation(activeConsent);
    } catch (err) {
      console.error('Save prescription error:', err);
      alert('Failed to save prescription');
    } finally {
      setSavingPrescription(false);
    }
  };

  // Clear completed consultations history from database
  const handleClearCompletedHistory = async () => {
    if (confirm('Clear all completed consultation records from history?')) {
      try {
        await fetch(`/api/providers/${selectedProviderId}/consents/clear-completed`, {
          method: 'POST'
        });
        await fetchProviderConsents();
        setToastMessage('Completed consultation history cleared.');
      } catch (err) {
        console.error('Error clearing completed history:', err);
      }
    }
  };

  // Switch consultation session when patient mismatch occurs
  const handleResolveMismatchSwitch = async () => {
    if (activeConsent) {
      await handleCompleteConsultation(activeConsent.id);
    }
    setMismatchModal(null);
    setShowRequestForm(true);
  };

  // Generate AI visit summary
  const handleGenerateAiSummary = async () => {
    if (!activeConsent || !patientData) return;
    try {
      setAiLoading(true);
      const res = await fetch('/api/ai/visit-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientData.patient.id,
          consentId: activeConsent.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data);
      }
    } catch (err) {
      console.error('AI summary error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Filter consultations strictly from the database
  const now = new Date();
  const activeConsultations = providerConsents.filter(
    c => c.status === 'approved' && c.expires_at && new Date(c.expires_at) > now
  );
  const pendingRequests = providerConsents.filter(
    c => c.status === 'pending'
  );
  const completedConsultations = providerConsents.filter(
    c => c.status === 'completed' || c.status === 'expired' || c.status === 'revoked' || c.status === 'denied' || (c.status === 'approved' && c.expires_at && new Date(c.expires_at) <= now)
  );

  return (
    <div className="min-h-screen bg-[#f5f8f6] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="bg-[#102f2e] text-[#bff46d] px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-bold border border-[#bff46d]/30 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#bff46d]" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Doctor Header Banner */}
        <div className="bg-[#102f2e] text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#bff46d] text-[#123d3b]">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold">{displayDoctorName}</h2>
                {isDoctorAuthenticated ? (
                  <span className="bg-[#bff46d] text-[#123d3b] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Verified Doctor Session
                  </span>
                ) : (
                  <span className="bg-white/20 text-[#bff46d] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Doctor Session Active
                  </span>
                )}
              </div>
              <p className="text-xs text-white/70 mt-0.5">Clinical Consultation Center · Reg: {displayRegNo}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70">Facility:</span>
              <select
                value={selectedProviderId}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedProviderId(val);
                  const found = allProviders.find(p => p.id === val);
                  if (found) {
                    setProviderName(`${found.name} (${found.specialty || found.type})`);
                  }
                  setActiveConsent(null);
                  setPatientData(null);
                }}
                className="bg-[#174945] border border-white/20 text-xs font-bold text-white rounded-xl px-3 py-2 focus:outline-none cursor-pointer max-w-[210px] truncate"
              >
                {allProviders.map(pr => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name} ({pr.specialty || pr.type})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setDocAuthMode('signup');
                setShowDoctorLoginModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#bff46d] text-xs font-bold transition border border-white/10"
              title="Register a new doctor account or clinic"
            >
              <UserPlus className="w-3.5 h-3.5" /> + New Doctor
            </button>

            {isDoctorAuthenticated ? (
              <button
                onClick={() => {
                  setIsDoctorAuthenticated(false);
                  setActiveConsent(null);
                  setPatientData(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                title="Log out of Doctor Portal"
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            ) : (
              <button
                onClick={() => {
                  setDocAuthMode('signin');
                  setShowDoctorLoginModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#bff46d] hover:bg-[#caff78] text-[#123d3b] text-xs font-extrabold transition shadow"
              >
                <LogIn className="w-3.5 h-3.5" /> Doctor Log In
              </button>
            )}
          </div>
        </div>

        {/* PATIENT IDENTITY MISMATCH WARNING MODAL */}
        {mismatchModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-7 border-2 border-[#ff795f] shadow-2xl space-y-5">
              <div className="flex items-center gap-3 text-[#cb4f3b]">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0ec]">
                  <ShieldAlert className="w-7 h-7 text-[#ff795f]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold uppercase tracking-wider">Patient Identity Mismatch Detected</h3>
                  <p className="text-xs text-[#526765]">Session Safety Security Protection</p>
                </div>
              </div>

              <div className="p-4 bg-[#fff0ec] rounded-2xl border border-[#ff795f]/30 space-y-2 text-xs text-[#102b2c]">
                <p className="font-semibold leading-5">
                  You are currently in an active consultation session with <strong>{mismatchModal.activePatientName}</strong>. You are attempting to access records / request consent for <strong>{mismatchModal.requestedPatientName}</strong>.
                </p>
                <p className="text-[11px] text-[#cb4f3b] font-bold">
                  🔒 System Enforcement: Every access request is locked to a single patient session. Cross-patient data exposure is blocked.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  onClick={() => setMismatchModal(null)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition"
                >
                  🛑 Cancel Request (Keep {mismatchModal.activePatientName})
                </button>

                <button
                  onClick={handleResolveMismatchSwitch}
                  className="flex-1 py-3 px-4 bg-[#123d3b] hover:bg-[#0c302f] text-white font-extrabold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
                >
                  <CheckSquare className="w-4 h-4 text-[#bff46d]" /> Complete Current Visit & Switch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Access Denied Warning Banner if consent was revoked/expired */}
        {accessDeniedMessage && !activeConsent && (
          <div className="bg-[#fff0ec] border-2 border-[#ff795f] p-5 rounded-3xl flex items-center justify-between gap-4 text-[#cb4f3b]">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 flex-shrink-0 text-[#ff795f]" />
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider">Consultation Session Closed</h4>
                <p className="text-xs font-semibold mt-0.5">{accessDeniedMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setAccessDeniedMessage(null)}
              className="text-xs font-extrabold text-[#d95d45] underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* VIEW A: IF AN ACTIVE CONSULTATION IS OPEN IN WORKSPACE */}
        {activeConsent && patientData?.patient ? (
          <div className="space-y-6">
            {/* Active Consultation Top Bar */}
            <div className="bg-[#123d3b] text-white p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveConsent(null);
                    setPatientData(null);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition"
                  title="Back to Consultations List"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#bff46d] animate-ping" />
                    <h3 className="text-lg font-extrabold">{patientData.patient.full_name}</h3>
                    <span className="bg-[#bff46d] text-[#123d3b] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      IN CONSULTATION
                    </span>
                  </div>
                  <p className="text-xs text-white/70 mt-0.5 font-mono">
                    ABHA: {patientData.patient.abha_id} · DOB: {patientData.patient.date_of_birth} · Blood: {patientData.patient.blood_group || 'B+'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {timeLeft && (
                  <div className="bg-[#bff46d] text-[#123d3b] px-3.5 py-1.5 rounded-xl font-mono font-extrabold text-xs flex items-center gap-1.5 shadow animate-pulse">
                    <Clock className="w-4 h-4" />
                    <span>{timeLeft}</span>
                  </div>
                )}

                <button
                  onClick={() => handleCompleteConsultation(activeConsent.id)}
                  disabled={completingConsultation}
                  className="bg-[#bff46d] hover:bg-[#caff78] text-[#123d3b] text-xs font-extrabold px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5"
                  title="Mark consultation completed and lock records"
                >
                  <CheckSquare className="w-4 h-4" />
                  {completingConsultation ? 'Completing...' : 'Complete Consultation & Proceed to Next Patient'}
                </button>
              </div>
            </div>

            {/* High Severity Allergy Warning Banner */}
            {patientData.allergies?.some((a: any) => a.severity === 'severe') && (
              <div className="bg-[#fff0ec] border-2 border-[#ff795f] p-4 rounded-2xl flex items-center gap-3 text-[#cb4f3b]">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 text-[#ff795f]" />
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">CRITICAL DRUG ALLERGY WARNING</h4>
                  <p className="text-xs font-semibold mt-0.5">
                    Patient has severe allergy to: <span className="underline font-extrabold">{patientData.allergies.map((a: any) => a.allergen).join(', ')}</span>. Do not prescribe penicillin/sulfa antibiotics!
                  </p>
                </div>
              </div>
            )}

            {/* Workspace Sub-Tabs Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-[#dfe8e4] pb-2">
              <button
                onClick={() => setWorkspaceTab('pad')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
                  workspaceTab === 'pad' ? 'bg-[#123d3b] text-white shadow-md' : 'bg-white text-[#526765] hover:bg-[#e4ece8]'
                }`}
              >
                <FileText className="w-4 h-4 text-[#bff46d]" /> 📜 Official Prescription Pad (Editable)
              </button>

              <button
                onClick={() => setWorkspaceTab('records')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
                  workspaceTab === 'records' ? 'bg-[#123d3b] text-white shadow-md' : 'bg-white text-[#526765] hover:bg-[#e4ece8]'
                }`}
              >
                <Pill className="w-4 h-4" /> 📁 Health Records & Lab Investigations
              </button>

              <button
                onClick={() => setWorkspaceTab('summary')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
                  workspaceTab === 'summary' ? 'bg-[#123d3b] text-white shadow-md' : 'bg-white text-[#526765] hover:bg-[#e4ece8]'
                }`}
              >
                <Sparkles className="w-4 h-4" /> ✨ AI Visit Summary
              </button>

              <button
                onClick={() => setWorkspaceTab('timeline')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
                  workspaceTab === 'timeline' ? 'bg-[#123d3b] text-white shadow-md' : 'bg-white text-[#526765] hover:bg-[#e4ece8]'
                }`}
              >
                <History className="w-4 h-4" /> ⏳ Medical Timeline
              </button>
            </div>

            {/* SUB-TAB 1: EDITABLE OFFICIAL PRESCRIPTION PAD */}
            {workspaceTab === 'pad' && (
              <div className="space-y-4">
                <PrescriptionPad
                  patient={patientData.patient}
                  doctor={{
                    name: displayDoctorName,
                    registration_no: displayRegNo,
                    hospital_name: providerName.includes('Reddy') ? 'Shamirpet Primary Health Centre' : 'Sai Care Specialist Clinic',
                    address: selectedProviderId.endsWith('1') ? 'Main Road, Shamirpet, Medchal-Malkajgiri District, Telangana' : 'Road No. 12, Banjara Hills, Hyderabad, Telangana',
                    phone: selectedProviderId.endsWith('1') ? '+91 90000 00101' : '+91 90000 00102'
                  }}
                  medications={editableMedications}
                  allergies={patientData.allergies || []}
                  diagnoses={patientData.diagnoses || []}
                  observations={patientData.observations || []}
                  aiSummaryText={aiSummary?.summaryText || `Patient Summary (${patientData.patient.full_name}): Active diagnoses include Type 2 Diabetes Mellitus.`}
                  clinicalNotes={editableNotes}
                  isEditable={true}
                  onAddMedication={handleAddMedicationToPad}
                  onRemoveMedication={handleRemoveMedicationFromPad}
                  onUpdateNotes={setEditableNotes}
                  onSavePrescription={handleSavePrescription}
                  saving={savingPrescription}
                />
              </div>
            )}

            {/* SUB-TAB 2: PATIENT HEALTH RECORDS & LAB RESULTS */}
            {workspaceTab === 'records' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Active Medications */}
                  <div className="bg-white p-6 rounded-3xl border border-[#dfe8e4] space-y-4">
                    <h4 className="font-extrabold text-[#102b2c] text-sm flex items-center gap-2">
                      <Pill className="w-4 h-4 text-[#177e71]" /> Authorized Active Medications
                    </h4>
                    <div className="space-y-2">
                      {patientData.medications && patientData.medications.length > 0 ? patientData.medications.map((m: any) => (
                        <div key={m.id} className="p-3.5 bg-[#f8faf9] rounded-2xl border border-[#e4ece8] flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-[#102b2c]">{m.name}</p>
                            <p className="text-[11px] text-[#647774]">{m.dosage} · {m.frequency}</p>
                          </div>
                          <span className="text-[10px] text-[#177e71] font-bold">Start: {m.start_date}</span>
                        </div>
                      )) : (
                        <p className="text-xs text-gray-400 italic">No medications recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* Lab Results */}
                  <div className="bg-white p-6 rounded-3xl border border-[#dfe8e4] space-y-4">
                    <h4 className="font-extrabold text-[#102b2c] text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#5ab79f]" /> Lab Results & Investigations
                    </h4>
                    <div className="space-y-2">
                      {patientData.observations && patientData.observations.length > 0 ? patientData.observations.map((o: any) => (
                        <div key={o.id} className="p-3.5 bg-[#f8faf9] rounded-2xl border border-[#e4ece8] flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-[#102b2c]">{o.name}</p>
                            <p className="text-[11px] text-[#647774]">Source: {o.source?.toUpperCase()}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${o.is_abnormal ? 'text-[#cb4f3b]' : 'text-[#123d3b]'}`}>
                              {o.value_numeric || o.value_text} {o.unit}
                            </p>
                            {o.ref_high && <span className="text-[10px] text-[#8a9997]">Ref: {o.ref_low}-{o.ref_high}</span>}
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs text-gray-400 italic">No lab results recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: AI VISIT SUMMARY */}
            {workspaceTab === 'summary' && (
              <div className="bg-white p-6 rounded-3xl border border-[#dfe8e4] space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-[#102b2c] text-base flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#9a7bcc]" /> Grounded AI Clinical Visit Summary
                    </h4>
                    <p className="text-xs text-[#647774] mt-0.5">Automated grounded summary compiled from active diagnoses, allergies, and recent labs.</p>
                  </div>
                  <button
                    onClick={handleGenerateAiSummary}
                    disabled={aiLoading}
                    className="bg-[#9a7bcc] hover:bg-[#8565b8] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> {aiLoading ? 'Generating...' : 'Generate Grounded Summary'}
                  </button>
                </div>

                {aiSummary ? (
                  <div className="bg-[#f7f4fc] p-5 rounded-2xl border border-[#e3d7f7] space-y-2">
                    <pre className="whitespace-pre-wrap font-sans text-xs text-[#102b2c] leading-6 bg-white p-4 rounded-xl border border-[#e3d7f7]">
                      {aiSummary.summaryText}
                    </pre>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#f8faf9] rounded-2xl border border-dashed border-gray-300">
                    <Sparkles className="w-8 h-8 text-[#9a7bcc] mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#102b2c]">Click 'Generate Grounded Summary' to synthesize history and alerts.</p>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 4: MEDICAL TIMELINE */}
            {workspaceTab === 'timeline' && (
              <div className="bg-white p-6 rounded-3xl border border-[#dfe8e4] space-y-4">
                <h4 className="font-extrabold text-[#102b2c] text-base">Longitudinal Medical Timeline</h4>
                <div className="relative border-l-2 border-[#177e71]/20 ml-3 space-y-6 pl-6 py-2">
                  {patientData.timeline && patientData.timeline.length > 0 ? (
                    patientData.timeline.map((item: any, idx: number) => (
                      <div key={idx} className="relative group">
                        <span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#177e71]" />
                        <div className="bg-[#f8faf9] p-4 rounded-2xl border border-[#e4ece8]">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-[#177e71] uppercase tracking-wider">{item.type}</span>
                            <span className="text-[#8a9997] font-semibold">{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                          <h5 className="font-extrabold text-[#102b2c] text-sm mt-1">{item.title}</h5>
                          <p className="text-xs text-[#526765] mt-0.5">{item.detail}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No timeline entries available.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* VIEW B: CLINICAL CONSULTATIONS DASHBOARD LIST (ACTIVE, PENDING, COMPLETED) */
          <div className="space-y-6">
            {/* Quick Actions & Header */}
            <div className="bg-white p-6 rounded-3xl border border-[#dfe8e4] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#102b2c]">Doctor Consultation Center</h3>
                <p className="text-xs text-[#647774] mt-0.5">Manage live active patient consultations, request consents, and issue prescriptions.</p>
              </div>

              <button
                onClick={() => {
                  setPatientLookup(null);
                  setShowRequestForm(true);
                }}
                className="bg-[#123d3b] hover:bg-[#0c302f] text-white px-5 py-3 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition shadow-md"
              >
                <QrCode className="w-4 h-4 text-[#bff46d]" /> Scan Patient QR / New Consultation Request
              </button>
            </div>

            {/* QR Scan / New Request Modal / Form Container */}
            {showRequestForm && (
              <div className="bg-white p-6 rounded-3xl border-2 border-[#177e71] shadow-xl space-y-5 animate-in fade-in">
                <div className="flex justify-between items-center border-b border-[#eef3f1] pb-3">
                  <h4 className="font-extrabold text-[#102b2c] text-base flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#177e71]" /> Scan QR or Enter ABHA ID
                  </h4>
                  <button
                    onClick={() => {
                      setShowRequestForm(false);
                      setPatientLookup(null);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                  >
                    Close
                  </button>
                </div>

                {!patientLookup ? (
                  <div className="space-y-4">
                    <p className="text-xs text-[#647774]">Enter patient's ABHA ID or QR Token to initiate real-time consent handshake:</p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleLookupPatient();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={identifierInput}
                        onChange={e => setIdentifierInput(e.target.value)}
                        placeholder="e.g. 91-1234-5678-9012 or 91-2345-6789-0123"
                        className="flex-1 bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                      />
                      <button
                        type="submit"
                        disabled={lookupLoading}
                        className="bg-[#177e71] hover:bg-[#12645a] text-white font-extrabold text-xs px-5 rounded-xl transition flex items-center gap-1.5"
                      >
                        <Search className="w-4 h-4" /> {lookupLoading ? 'Searching...' : 'Search Patient'}
                      </button>
                    </form>

                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-extrabold text-[#526765] uppercase tracking-wider block">
                        Quick Select from Registered Patients ({allPatients.length} in Database):
                      </span>
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                        {allPatients.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setIdentifierInput(p.abha_id);
                              handleLookupPatient(p.abha_id);
                            }}
                            className="px-3 py-1.5 bg-[#f0f5f2] hover:bg-[#e4ece8] text-[#123d3b] rounded-xl text-xs font-bold border border-[#c8dfbc] transition flex items-center gap-1.5 group shadow-sm"
                          >
                            <span className="w-2 h-2 rounded-full bg-[#177e71] group-hover:scale-125 transition-transform" />
                            <span>{p.full_name}</span>
                            <span className="text-[10px] text-[#647774] font-mono">({p.abha_id})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#f4fbf0] rounded-2xl border border-[#c8dfbc] flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-[#177e71]">Patient Verified</span>
                        <h5 className="font-extrabold text-[#102b2c] text-sm">{patientLookup.full_name}</h5>
                        <p className="text-[#526765]">ABHA ID: {patientLookup.abha_id} · DOB: {patientLookup.date_of_birth} · Blood: {patientLookup.blood_group || 'N/A'}</p>
                      </div>
                      <button onClick={() => setPatientLookup(null)} className="text-[#177e71] font-bold underline text-xs">
                        Change Patient
                      </button>
                    </div>

                    <div>
                      <p className="text-xs font-extrabold text-[#102b2c] mb-2">Requested Scopes:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['allergies', 'medications', 'diagnoses', 'lab_results', 'imaging', 'reports', 'encounters'].map(s => (
                          <label key={s} className="flex items-center gap-2 bg-[#f8faf9] p-2.5 rounded-xl border text-xs font-bold cursor-pointer hover:bg-[#eef5f2] transition">
                            <input
                              type="checkbox"
                              checked={requestedScopes.includes(s)}
                              onChange={e => {
                                if (e.target.checked) setRequestedScopes([...requestedScopes, s]);
                                else setRequestedScopes(requestedScopes.filter(i => i !== s));
                              }}
                              className="accent-[#177e71]"
                            />
                            <span>{scopeLabels[s] || s}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-extrabold text-[#102b2c] mb-1">Set Consultation Duration (Dynamic):</p>
                      <select
                        value={requestedDuration}
                        onChange={e => setRequestedDuration(e.target.value)}
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                      >
                        <option value="15_mins">15 Minutes (Quick Consultation)</option>
                        <option value="30_mins">30 Minutes (Standard Consultation)</option>
                        <option value="1_hour">1 Hour (Detailed Audit & Exam)</option>
                        <option value="this_visit">2 Hours (Extended Visit)</option>
                        <option value="4_hours">4 Hours (Half-Day Access)</option>
                        <option value="24_hours">24 Hours (Full-Day Follow Up)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleSendConsentRequest}
                      className="w-full py-3.5 bg-[#bff46d] hover:bg-[#caff78] text-[#163f3b] font-extrabold text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-4 h-4" /> Send Real-Time Access Request to Patient App
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Consultations Main Tabs: Active, Pending, Completed */}
            <div className="flex justify-between items-center border-b border-[#dfe8e4] pb-2 flex-wrap gap-3">
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                <button
                  onClick={() => setConsultationsTab('active')}
                  className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
                    consultationsTab === 'active'
                      ? 'bg-[#123d3b] text-white shadow-md'
                      : 'bg-white text-[#526765] hover:bg-[#e4ece8]'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[#bff46d] animate-ping" />
                  <span>Active Consultations</span>
                  <span className="bg-[#bff46d] text-[#123d3b] text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                    {activeConsultations.length}
                  </span>
                </button>

                <button
                  onClick={() => setConsultationsTab('pending')}
                  className={`relative px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
                    consultationsTab === 'pending'
                      ? 'bg-[#123d3b] text-white shadow-md'
                      : 'bg-white text-[#526765] hover:bg-[#e4ece8]'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Pending Requests</span>
                  {pendingRequests.length > 0 && (
                    <span className="bg-[#ff795f] text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setConsultationsTab('completed')}
                  className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
                    consultationsTab === 'completed'
                      ? 'bg-[#123d3b] text-white shadow-md'
                      : 'bg-white text-[#526765] hover:bg-[#e4ece8]'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Completed Consultations</span>
                  <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                    {completedConsultations.length}
                  </span>
                </button>
              </div>

              {consultationsTab === 'completed' && completedConsultations.length > 0 && (
                <button
                  onClick={handleClearCompletedHistory}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fff0ec] hover:bg-[#ffe2db] text-[#cb4f3b] text-xs font-extrabold transition shadow-sm"
                  title="Clear all completed consultation records"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear History
                </button>
              )}
            </div>

            {/* TAB 1: ACTIVE CONSULTATIONS LIST */}
            {consultationsTab === 'active' && (
              <div className="space-y-4">
                {activeConsultations.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {activeConsultations.map(c => {
                      const expiresAt = c.expires_at ? new Date(c.expires_at) : new Date();
                      const nowTime = new Date().getTime();
                      const diffMins = Math.max(0, Math.floor((expiresAt.getTime() - nowTime) / (1000 * 60)));

                      return (
                        <div
                          key={c.id}
                          className="bg-white p-6 rounded-3xl border-2 border-[#123d3b] shadow-lg flex flex-col justify-between space-y-4 hover:shadow-xl transition"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg font-extrabold text-[#102b2c]">{c.patient_name || 'Patient'}</h4>
                                <span className="bg-[#e8ffd0] text-[#28634f] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                                  ACTIVE
                                </span>
                              </div>
                              <p className="text-xs font-mono text-[#177e71] mt-0.5 font-bold">ABHA: {c.abha_id}</p>
                              <p className="text-xs text-[#647774] mt-1">
                                Purpose: <span className="font-semibold text-[#102b2c]">{c.purpose}</span>
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="bg-[#bff46d] text-[#123d3b] text-xs font-mono font-extrabold px-3 py-1 rounded-xl shadow-sm inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> ~{diffMins} mins left
                              </span>
                              <span className="block text-[10px] text-[#8a9997] mt-1">
                                Duration: {c.duration ? c.duration.replace('_', ' ') : 'Standard'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#eef3f1] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                            <span className="text-[11px] text-[#647774] font-semibold">
                              🔑 Authorized Scopes: {c.granted_scopes?.length || 7} areas released
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCompleteConsultation(c.id)}
                                className="bg-[#fff0ec] hover:bg-[#ffe2db] text-[#cb4f3b] text-xs font-extrabold px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
                                title="Mark consultation completed immediately"
                              >
                                <CheckSquare className="w-3.5 h-3.5" /> Complete
                              </button>

                              <button
                                onClick={() => handleOpenConsultation(c)}
                                className="bg-[#123d3b] hover:bg-[#0c302f] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition"
                              >
                                <Stethoscope className="w-4 h-4 text-[#bff46d]" /> Open Records <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white p-10 rounded-3xl border border-[#dfe8e4] text-center space-y-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f0f5f2] text-[#177e71] mx-auto">
                      <Stethoscope className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-extrabold text-[#102b2c]">No Active Consultations Right Now</h4>
                    <p className="text-xs text-[#647774] max-w-md mx-auto">
                      Scan a patient's physical card QR or enter their ABHA ID using the button below to request consent and start an active consultation.
                    </p>
                    <button
                      onClick={() => {
                        setPatientLookup(null);
                        setShowRequestForm(true);
                      }}
                      className="bg-[#123d3b] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow inline-flex items-center gap-1.5 hover:bg-[#0c302f] transition"
                    >
                      <Plus className="w-4 h-4 text-[#bff46d]" /> Start New Consultation
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PENDING REQUESTS LIST */}
            {consultationsTab === 'pending' && (
              <div className="space-y-4">
                {pendingRequests.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {pendingRequests.map(c => (
                      <div
                        key={c.id}
                        className="bg-white p-6 rounded-3xl border-2 border-[#177e71] shadow-lg flex flex-col justify-between space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-extrabold text-[#102b2c]">{c.patient_name || 'Patient'}</h4>
                              <span className="bg-[#ffeedb] text-[#c96c00] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase animate-pulse">
                                WAITING APPROVAL
                              </span>
                            </div>
                            <p className="text-xs font-mono text-[#177e71] mt-0.5 font-bold">ABHA: {c.abha_id}</p>
                            <p className="text-xs text-[#647774] mt-1">
                              Purpose: <span className="font-semibold text-[#102b2c]">{c.purpose}</span>
                            </p>
                            <p className="text-[11px] text-[#8a9997] mt-0.5">
                              Requested: {c.requested_at ? new Date(c.requested_at).toLocaleTimeString() : 'Just now'} · Duration: {c.duration?.replace('_', ' ')}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-[#f8faf9] rounded-2xl border border-[#dfe8e4] text-xs">
                          <p className="text-[11px] font-bold text-[#526765] mb-1.5">Requested Scopes:</p>
                          <div className="flex flex-wrap gap-1">
                            {(c.requested_scopes || []).map((s: string) => (
                              <span key={s} className="bg-white border text-[10px] font-bold px-2 py-0.5 rounded-md text-[#177e71]">
                                {scopeLabels[s] || s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#eef3f1] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                          {onSwitchToPatient && (
                            <button
                              onClick={() => onSwitchToPatient(c.patient_id)}
                              className="text-xs font-extrabold text-[#177e71] hover:underline flex items-center gap-1.5 bg-[#f0f5f2] hover:bg-[#e4ede8] px-3.5 py-2 rounded-xl transition"
                            >
                              <User className="w-3.5 h-3.5" /> Open Patient Portal ({c.patient_name || 'Patient'}) to Approve →
                            </button>
                          )}

                          <button
                            onClick={() => handleFastApprove(c.id, c.requested_scopes, c.duration)}
                            className="bg-[#bff46d] hover:bg-[#caff78] text-[#123d3b] text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow transition"
                            title={`Patient verification sign-off for ${c.patient_name || 'Patient'}`}
                          >
                            <Check className="w-4 h-4 text-[#123d3b]" /> Patient Quick-Approve ({c.patient_name?.split(' ')[0] || 'Patient'})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-10 rounded-3xl border border-[#dfe8e4] text-center space-y-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f0f5f2] text-[#177e71] mx-auto">
                      <Clock className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-extrabold text-[#102b2c]">No Pending Access Requests</h4>
                    <p className="text-xs text-[#647774] max-w-md mx-auto">
                      You do not have any pending patient consent requests waiting for approval.
                    </p>
                    <button
                      onClick={() => {
                        setPatientLookup(null);
                        setShowRequestForm(true);
                      }}
                      className="bg-[#123d3b] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow inline-flex items-center gap-1.5 hover:bg-[#0c302f] transition"
                    >
                      <Plus className="w-4 h-4 text-[#bff46d]" /> Request New Patient Access
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: COMPLETED CONSULTATIONS LIST */}
            {consultationsTab === 'completed' && (
              <div className="bg-white p-6 rounded-3xl border border-[#dfe8e4] shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-[#102b2c] text-base">Completed & Expired Consultations History</h4>
                    <p className="text-xs text-[#647774] mt-0.5">
                      Records and prescription pads for completed visits are locked once the consultation is completed or duration ends.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-[#eef3f1]">
                  {completedConsultations.length > 0 ? (
                    completedConsultations.map(c => (
                      <div key={c.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-extrabold text-[#102b2c] text-sm">{c.patient_name || 'Patient'}</h5>
                            <span className="font-mono text-[11px] text-[#177e71]">ABHA: {c.abha_id}</span>
                            <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] uppercase ${
                              c.status === 'revoked' ? 'bg-[#fff0ec] text-[#d95d45]' : 'bg-[#eef6f4] text-[#123d3b]'
                            }`}>
                              {c.status === 'revoked' ? 'REVOKED (KEY SHREDDED)' : 'COMPLETED'}
                            </span>
                          </div>
                          <p className="text-xs text-[#647774] mt-0.5">
                            Purpose: {c.purpose} · Requested: {c.requested_at ? new Date(c.requested_at).toLocaleString() : 'N/A'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-[#8a9997] font-semibold flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-gray-400" /> Records Locked
                          </span>
                          <button
                            onClick={() => {
                              setIdentifierInput(c.abha_id);
                              setShowRequestForm(true);
                              handleLookupPatient(c.abha_id);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#f0f5f2] hover:bg-[#e2ece7] text-[#123d3b] text-xs font-extrabold transition"
                          >
                            Re-request Access
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic py-4 text-center">No past completed consultations recorded yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Doctor Dynamic Authentication & Registration Modal */}
        {showDoctorLoginModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#dfe8e4] shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setShowDoctorLoginModal(false);
                  setDocLoginError(null);
                  setDocRegError(null);
                  setPendingDocVerification(null);
                }}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#102f2e] text-[#bff46d] mx-auto shadow-md">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#102b2c]">Doctor & Clinical Portal</h2>
                <p className="text-xs text-[#647774] max-w-sm mx-auto">
                  Sign in to your verified physician session or register a new doctor profile and medical facility.
                </p>
              </div>

              {/* Tab Selector: Sign In vs Sign Up */}
              <div className="flex p-1.5 bg-[#f0f5f2] rounded-2xl border border-[#dfe8e4]">
                <button
                  type="button"
                  onClick={() => { setDocAuthMode('signin'); setDocLoginError(null); setDocRegError(null); }}
                  className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 ${
                    docAuthMode === 'signin'
                      ? 'bg-[#123d3b] text-white shadow-md'
                      : 'text-[#526765] hover:text-[#102b2c]'
                  }`}
                >
                  <LogIn className="w-4 h-4" /> Doctor Sign In
                </button>

                <button
                  type="button"
                  onClick={() => { setDocAuthMode('signup'); setDocLoginError(null); setDocRegError(null); }}
                  className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 ${
                    docAuthMode === 'signup'
                      ? 'bg-[#123d3b] text-white shadow-md'
                      : 'text-[#526765] hover:text-[#102b2c]'
                  }`}
                >
                  <UserPlus className="w-4 h-4 text-[#bff46d]" /> Register New Doctor
                </button>
              </div>

              {/* TAB 1: DOCTOR SIGN IN */}
              {docAuthMode === 'signin' && (
                <div className="space-y-5">
                  {docLoginError && (
                    <div className="p-3.5 bg-[#fff0ec] rounded-2xl border border-[#ff795f] text-xs font-bold text-[#cb4f3b] space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>{docLoginError}</span>
                      </div>
                      {pendingDocVerification && (
                        <div className="pt-2 border-t border-[#ff795f]/30 flex flex-col gap-2">
                          <p className="text-[11px] text-[#102b2c] font-normal">
                            License <strong>{pendingDocVerification.registration_no}</strong> requires National Medical Commission verification.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleVerifyDoctorCredentials(pendingDocVerification.id)}
                            className="w-full py-2 bg-[#123d3b] hover:bg-[#0c302f] text-[#bff46d] font-extrabold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
                          >
                            <ShieldCheck className="w-4 h-4" /> Verify License with NMC Registry Live Check
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleDoctorSignIn} className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Medical Reg No / Doctor Email / Phone:</label>
                      <input
                        type="text"
                        value={docLoginReg}
                        onChange={e => setDocLoginReg(e.target.value)}
                        placeholder="e.g. TS-PHC-0001 or NMC-2024-..."
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Password:</label>
                      <input
                        type="password"
                        value={docLoginPassword}
                        onChange={e => setDocLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={docLoginLoading}
                      className="w-full py-3.5 bg-[#123d3b] hover:bg-[#0c302f] text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      {docLoginLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-[#bff46d]" />
                      ) : (
                        <LogIn className="w-4 h-4 text-[#bff46d]" />
                      )}
                      Sign In as Verified Doctor
                    </button>
                  </form>

                  {/* Dynamic Quick Select from all registered doctors */}
                  <div className="pt-3 border-t border-[#eef3f1] space-y-2.5 text-left">
                    <span className="text-[11px] font-extrabold text-[#647774] uppercase tracking-wider block">
                      Quick Sign In as Registered Doctor ({allProviders.length} in Database):
                    </span>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {allProviders.map(pr => (
                        <button
                          key={pr.id}
                          type="button"
                          onClick={() => {
                            setSelectedProviderId(pr.id);
                            setProviderName(`${pr.name} (${pr.specialty || pr.type})`);
                            setIsDoctorAuthenticated(true);
                            setShowDoctorLoginModal(false);
                            setActiveConsent(null);
                            setPatientData(null);
                            setToastMessage(`🩺 Logged in as Dr. ${pr.name}!`);
                          }}
                          className="w-full py-2.5 px-3.5 bg-[#f8faf9] hover:bg-[#f4fbf0] border border-[#d2e0da] hover:border-[#177e71] text-[#123d3b] text-xs font-extrabold rounded-xl transition text-left flex justify-between items-center group shadow-sm"
                        >
                          <div className="min-w-0 truncate">
                            <span className="block truncate group-hover:text-[#177e71] transition">🩺 {pr.name}</span>
                            <span className="text-[10px] text-[#647774] font-normal block truncate">
                              {pr.specialty || 'General'} · {pr.district || 'Healthcare Center'}
                            </span>
                          </div>
                          <span className="text-[10px] bg-[#123d3b] text-[#bff46d] px-2 py-0.5 rounded font-mono flex-shrink-0 ml-2">
                            {pr.registration_no}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DOCTOR & FACILITY REGISTRATION (SIGN UP) */}
              {docAuthMode === 'signup' && (
                <div className="space-y-4 text-left">
                  {docRegError && (
                    <div className="p-3 bg-[#fff0ec] rounded-xl border border-[#ff795f] text-xs font-bold text-[#cb4f3b] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{docRegError}</span>
                    </div>
                  )}

                  <form onSubmit={handleDoctorRegister} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Doctor Full Name: *</label>
                        <input
                          type="text"
                          value={docRegName}
                          onChange={e => setDocRegName(e.target.value)}
                          placeholder="e.g. Dr. Sneha Roy"
                          className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Medical Reg No (NMC/State): *</label>
                        <input
                          type="text"
                          value={docRegNumber}
                          onChange={e => setDocRegNumber(e.target.value)}
                          placeholder="e.g. NMC-2024-88412"
                          className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Specialty: *</label>
                        <select
                          value={docRegSpecialty}
                          onChange={e => setDocRegSpecialty(e.target.value)}
                          className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                        >
                          <option value="General Medicine">General Medicine</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Pediatrics">Pediatrics</option>
                          <option value="Orthopedics">Orthopedics</option>
                          <option value="Dermatology">Dermatology</option>
                          <option value="Neurology">Neurology</option>
                          <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                          <option value="General Surgery">General Surgery</option>
                          <option value="Psychiatry">Psychiatry</option>
                          <option value="Endocrinology">Endocrinology</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Qualification: *</label>
                        <input
                          type="text"
                          value={docRegQualification}
                          onChange={e => setDocRegQualification(e.target.value)}
                          placeholder="e.g. MBBS, MD (Medicine)"
                          className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Facility / Clinic Name: *</label>
                        <input
                          type="text"
                          value={docRegFacilityName}
                          onChange={e => setDocRegFacilityName(e.target.value)}
                          placeholder="e.g. Roy Heart & Health Clinic"
                          className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#177e71]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Facility Type: *</label>
                        <select
                          value={docRegType}
                          onChange={e => setDocRegType(e.target.value)}
                          className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-2.5 focus:outline-none"
                        >
                          <option value="clinic">Private Clinic</option>
                          <option value="phc">Primary Health Centre (PHC)</option>
                          <option value="district_hospital">District Hospital</option>
                          <option value="private_hospital">Multi-Specialty Hospital</option>
                          <option value="laboratory">Diagnostic Laboratory</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-extrabold text-[#102b2c] mb-1">City / District: *</label>
                        <input
                          type="text"
                          value={docRegDistrict}
                          onChange={e => setDocRegDistrict(e.target.value)}
                          placeholder="e.g. Hyderabad"
                          className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-2.5 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Medical Council: *</label>
                        <input
                          type="text"
                          value={docRegCouncil}
                          onChange={e => setDocRegCouncil(e.target.value)}
                          placeholder="e.g. National Medical Commission (NMC)"
                          className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-2.5 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Phone Number:</label>
                        <input
                          type="tel"
                          value={docRegPhone}
                          onChange={e => setDocRegPhone(e.target.value)}
                          placeholder="e.g. 9849012345"
                          className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-2.5 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Doctor Email:</label>
                        <input
                          type="email"
                          value={docRegEmail}
                          onChange={e => setDocRegEmail(e.target.value)}
                          placeholder="e.g. dr.sneha@example.com"
                          className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-2.5 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Password: *</label>
                        <input
                          type="password"
                          value={docRegPassword}
                          onChange={e => setDocRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-2.5 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#102b2c] mb-1">Confirm Password: *</label>
                        <input
                          type="password"
                          value={docRegConfirmPassword}
                          onChange={e => setDocRegConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#f8faf9] border border-[#c5d6cf] text-xs font-bold text-[#102b2c] rounded-xl p-2.5 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 p-2.5 bg-[#f4fbf0] rounded-xl border border-[#c8dfbc] cursor-pointer text-xs font-bold text-[#123d3b]">
                      <input
                        type="checkbox"
                        checked={docRegAutoVerify}
                        onChange={e => setDocRegAutoVerify(e.target.checked)}
                        className="accent-[#177e71] h-4 w-4 rounded"
                      />
                      <span>⚡ Instant Medical Council Credential Verification (NMC Registry Live Check)</span>
                    </label>

                    <button
                      type="submit"
                      disabled={docRegLoading}
                      className="w-full py-3.5 bg-[#123d3b] hover:bg-[#0c302f] text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      {docRegLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-[#bff46d]" />
                      ) : (
                        <UserPlus className="w-4 h-4 text-[#bff46d]" />
                      )}
                      Register Doctor & Enable Clinical Portal
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
