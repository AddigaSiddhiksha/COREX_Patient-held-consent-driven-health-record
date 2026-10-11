import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { PatientPortal } from './components/PatientPortal';
import { ProviderPortal } from './components/ProviderPortal';
import { AuditLogView } from './components/AuditLogView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'patient' | 'doctor' | 'audit'>('landing');
  const [targetPatientId, setTargetPatientId] = useState<string>(() => {
    return localStorage.getItem('selected_patient_id') || '10000000-0000-0000-0000-000000000001';
  });
  const [pendingCount, setPendingCount] = useState(0);

  // Check URL parameters for QR scan redirect (e.g., ?portal=doctor&scan=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const portalParam = params.get('portal');
    const scanParam = params.get('scan');
    if (portalParam === 'doctor' || portalParam === 'provider' || scanParam) {
      setActiveTab('doctor');
    }
  }, []);

  // Poll pending consents count dynamically from database across all patients
  const fetchPendingCount = async () => {
    try {
      const res = await fetch('/api/consents/pending-count');
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.count || 0);
      }
    } catch (err) {
      // Backend off or loading
    }
  };

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 4000);

    const es = new EventSource('/api/events');
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.eventType?.startsWith('consent_')) {
          fetchPendingCount();
        }
      } catch (err) {
        // ignore parse error
      }
    };

    return () => {
      clearInterval(interval);
      es.close();
    };
  }, []);

  const handleResetDemo = async () => {
    if (confirm('Reset synthetic database to clean initial seed state?')) {
      try {
        const res = await fetch('/api/demo/reset', { method: 'POST' });
        if (res.ok) {
          alert('Database reset successful!');
          fetchPendingCount();
          window.location.reload();
        }
      } catch (err) {
        console.error('Reset failed:', err);
      }
    }
  };

  const handleSwitchToPatient = (patientId?: string) => {
    if (patientId) {
      setTargetPatientId(patientId);
      localStorage.setItem('selected_patient_id', patientId);
      localStorage.setItem('patient_auth', 'true');
    }
    setActiveTab('patient');
  };

  return (
    <div className="min-h-screen bg-[#f5f8f6] font-sans text-[#102b2c] antialiased">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetDemo={handleResetDemo}
        pendingCount={pendingCount}
      />

      <main>
        {activeTab === 'landing' && (
          <LandingHero
            onOpenPatient={() => setActiveTab('patient')}
            onOpenProvider={() => setActiveTab('doctor')}
          />
        )}

        {activeTab === 'patient' && (
          <PatientPortal
            targetPatientId={targetPatientId}
            onPatientChange={(pId) => {
              setTargetPatientId(pId);
              localStorage.setItem('selected_patient_id', pId);
            }}
            onRefreshTrigger={fetchPendingCount}
          />
        )}

        {activeTab === 'doctor' && (
          <ProviderPortal
            onSwitchToPatient={handleSwitchToPatient}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogView />
        )}
      </main>
    </div>
  );
}
