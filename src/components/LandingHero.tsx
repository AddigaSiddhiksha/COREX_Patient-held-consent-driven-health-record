import React, { useState } from 'react';
import { ArrowRight, Check, Clock, Eye, FileText, Heart, Lock, Mic, QrCode, Scan, Shield, Sparkles, User, AlertTriangle, Stethoscope } from 'lucide-react';

interface LandingHeroProps {
  onOpenPatient: () => void;
  onOpenProvider: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onOpenPatient, onOpenProvider }) => {
  const [consentState, setConsentState] = useState<'pending' | 'approved' | 'revoked'>('pending');
  const [selectedRecords, setSelectedRecords] = useState([true, true, true, false]);

  const toggleRecord = (index: number) => {
    setSelectedRecords(prev => prev.map((val, i) => (i === index ? !val : val)));
    if (consentState !== 'pending') setConsentState('pending');
  };

  const recordItems = [
    { label: 'Allergies & alerts', detail: 'Penicillin allergy (Severe)', color: 'bg-[#ff795f]' },
    { label: 'Current medicines', detail: 'Metformin 500mg, Amlodipine 5mg', color: 'bg-[#5ab79f]' },
    { label: 'Recent lab reports', detail: 'HbA1c 7.9% (Updated 20 days ago)', color: 'bg-[#5a9ed6]' },
    { label: 'Medical history', detail: 'Visits, diagnoses & clinical notes', color: 'bg-[#9a7bcc]' }
  ];

  return (
    <div className="min-h-screen bg-[#f5f8f6] text-[#102b2c]">
      {/* Hero Section */}
      <section className="relative mx-auto max-w-[1360px] px-5 pb-20 pt-8 md:px-8 md:pb-28 md:pt-12">
        <div className="hero-glow" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-16 lg:grid-cols-[.95fr_1.05fr]">
          <div className="relative z-10">
            <div className="eyebrow mb-7">
              <span className="pulse-dot" /> Your health. Your permission.
            </div>
            <h1 className="max-w-[680px] text-[clamp(3.2rem,6.8vw,6.4rem)] font-extrabold leading-[.88] tracking-[-0.075em] text-[#102b2c]">
              One record.
              <br />
              <span className="relative inline-block text-[#177e71]">
                Your rules.
                <svg className="absolute -bottom-3 left-1 w-[94%]" viewBox="0 0 360 16" fill="none">
                  <path d="M3 11C95 1 216 4 357 7" stroke="#ff795f" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-9 max-w-[570px] text-lg leading-8 text-[#526765] md:text-xl">
              A patient-held health record that brings your medical history together—and puts you in control of who sees it, for how long.
            </p>
            
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <button onClick={onOpenPatient} className="button-primary font-extrabold flex items-center justify-center gap-2">
                Open Patient Portal <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={onOpenProvider} className="button-ghost font-bold flex items-center justify-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#177e71]" /> Open Doctor Portal
              </button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs font-bold uppercase tracking-[.13em] text-[#647774]">
              <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#177e71]" /> Encrypted</span>
              <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#177e71]" /> Time-bound</span>
              <span className="flex items-center gap-2"><User className="w-4 h-4 text-[#177e71]" /> Patient-controlled</span>
            </div>
          </div>

          {/* Interactive Live Consent Handshake Widget (Figma Design) */}
          <div id="demo" className="relative mx-auto w-full max-w-[610px]">
            <div className="absolute -left-12 top-20 h-36 w-36 rounded-full bg-[#ff826a]/25 blur-3xl" />
            <div className="absolute -right-6 bottom-12 h-48 w-48 rounded-full bg-[#bff46d]/30 blur-3xl" />
            
            <div className="dashboard-shell relative">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#bff46d] animate-pulse" />
                  <span className="text-xs font-bold tracking-[.12em] text-white/65">LIVE CONSENT HANDSHAKE</span>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/70">
                  SECURE SESSION
                </span>
              </div>

              <div className="grid md:grid-cols-[.86fr_1.14fr]">
                {/* Provider Card Info */}
                <div className="relative flex min-h-[240px] flex-col justify-between overflow-hidden bg-[#174945] p-6 text-white md:min-h-[460px]">
                  <div className="qr-grid absolute inset-0 opacity-[.07]" />
                  <div className="relative">
                    <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#bff46d] text-[#123d3b]">
                      <Scan className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-white/50">Request from</p>
                    <h3 className="mt-1 text-2xl font-bold tracking-[-.04em]">Dr. A. Reddy</h3>
                    <p className="mt-0.5 text-sm text-white/60">Shamirpet PHC (Medchal)</p>
                  </div>

                  <div className="relative mt-6 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                        <Clock className="w-4 h-4 text-[#bff46d]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">Access duration</p>
                        <p className="mt-0.5 text-xs font-semibold text-white">This visit only (2 hours)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Decision Box */}
                <div className="bg-white p-5 sm:p-7">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#8a9b98]">Sharing as</p>
                      <p className="mt-0.5 font-bold text-[#102b2c]">Ravi Kumar</p>
                      <p className="text-[10px] font-mono text-[#177e71]">ABHA: 91-1234-5678-9012</p>
                    </div>
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#fff0ec] font-bold text-[#d95d45]">
                      RK
                    </div>
                  </div>

                  {consentState === 'approved' ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                      <div className="success-ring mb-5">
                        <Check className="w-8 h-8 text-[#173f3c]" />
                      </div>
                      <h3 className="text-2xl font-extrabold tracking-[-.04em] text-[#102b2c]">Access Approved</h3>
                      <p className="mt-2 max-w-[250px] text-xs leading-5 text-[#6d7d7b]">
                        Dr. A. Reddy can now view the selected records for this visit.
                      </p>
                      <button
                        onClick={() => setConsentState('revoked')}
                        className="mt-6 rounded-xl border border-[#ef6b55]/25 bg-[#fff5f2] px-5 py-2.5 text-xs font-bold text-[#cb4f3b] transition hover:bg-[#ffe8e2]"
                      >
                        Revoke Access (Shred Key)
                      </button>
                    </div>
                  ) : consentState === 'revoked' ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                      <div className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-[#fff0ec] text-[#e05f48]">
                        <Lock className="w-7 h-7" />
                      </div>
                      <h3 className="text-2xl font-extrabold tracking-[-.04em] text-[#102b2c]">Access Revoked</h3>
                      <p className="mt-2 max-w-[260px] text-xs leading-5 text-[#6d7d7b]">
                        Session encryption key was destroyed. Records are immediately unreadable.
                      </p>
                      <button
                        onClick={() => setConsentState('pending')}
                        className="mt-6 text-xs font-bold text-[#177e71] underline underline-offset-4"
                      >
                        Review request again
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="mb-3 mt-5 text-xs font-extrabold text-[#102b2c]">Choose what to share:</p>
                      <div className="space-y-2">
                        {recordItems.map((item, index) => (
                          <button
                            key={item.label}
                            onClick={() => toggleRecord(index)}
                            className={`record-row w-full text-left transition ${selectedRecords[index] ? 'selected' : ''}`}
                          >
                            <span className={`record-dot ${item.color}`} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-bold">{item.label}</span>
                              <span className="block truncate text-[10px] text-[#8a9997]">{item.detail}</span>
                            </span>
                            <span className={`check-box ${selectedRecords[index] ? 'active' : ''}`}>
                              {selectedRecords[index] && <Check className="w-3 h-3 text-[#163f3b]" />}
                            </span>
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setConsentState('approved')}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#bff46d] py-3 text-xs font-extrabold text-[#163f3b] shadow-[0_8px_20px_rgba(127,176,54,.22)] transition hover:-translate-y-0.5 hover:bg-[#caff78]"
                      >
                        Approve Grant Access <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="floating-note -bottom-6 -left-3 md:-left-12">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8ffd0] text-[#28634f]">
                <Shield className="w-5 h-5" />
              </span>
              <div>
                <b>Tamper-Proof Audit Chain</b>
                <small>SHA-256 Hash Chained Logs</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities banner */}
      <section className="bg-[#102f2e] px-5 py-6 text-white md:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <p className="font-semibold text-white/70 text-sm">Built for every point of care across Telangana & India</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-bold text-white/90">
            {['Primary Health Centres', 'Private Clinics', 'Diagnostic Labs', 'District Hospitals'].map(item => (
              <span key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#bff46d]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid items-end gap-8 md:grid-cols-2">
            <div>
              <div className="eyebrow mb-4">One Simple Handshake</div>
              <h2 className="section-title text-[#102b2c]">
                Care moves fast.
                <br />
                <span>Consent should too.</span>
              </h2>
            </div>
            <p className="max-w-[500px] text-base leading-7 text-[#647774] md:justify-self-end">
              No complicated portals or forgotten passwords. COREX makes secure sharing effortless for patients and healthcare providers.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { n: '01', icon: QrCode, title: 'Scan Patient QR', text: 'Provider scans patient mock ABHA QR identity to trigger a live consent request.' },
              { n: '02', icon: Eye, title: 'Granular Approval', text: 'Patient previews request, selects exact record categories, and sets duration limit.' },
              { n: '03', icon: Heart, title: 'Care & Shred Key', text: 'Doctor receives mobile-first dashboard. On expiry or revocation, session key is shredded.' }
            ].map((step, idx) => (
              <div key={step.n} className={`step-card ${idx === 1 ? 'featured' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="step-number">{step.n}</span>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e9f1ed] text-[#177e71]">
                    <step.icon className="w-5 h-5" />
                  </span>
                </div>
                <h3 className="mt-10 text-xl font-extrabold tracking-tight text-[#102b2c]">{step.title}</h3>
                <p className="mt-2 text-xs leading-6 text-[#6b7d7a]">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Breakdown */}
      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[36px] bg-[#123d3b] text-white shadow-2xl">
          <div className="grid lg:grid-cols-[1.05fr_.95fr]">
            <div className="p-8 sm:p-12 lg:p-14">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-[#bff46d]">
                <Sparkles className="w-4 h-4" /> CRYPTO-SHREDDING ARCHITECTURE
              </span>
              <h2 className="mt-6 max-w-[560px] text-3xl font-extrabold leading-tight sm:text-5xl">
                When access ends, the key disappears.
              </h2>
              <p className="mt-5 max-w-[550px] text-sm leading-6 text-white/60">
                COREX generates session-specific encryption keys. Revoke access and the key is destroyed—making protected session data unreadable, not merely hidden.
              </p>
              <div className="mt-8 flex flex-wrap gap-2.5">
                {['AES-256 Encryption', 'Granular Scope Control', 'Auto-Expiry Timer', 'SHA-256 Audit Trail', 'Duplicate Test Alert'].map(item => (
                  <span key={item} className="rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-bold text-white/80 bg-white/5">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="security-visual relative min-h-[340px] overflow-hidden bg-[#0c302f] grid place-items-center">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="relative grid h-28 w-28 place-items-center rounded-3xl bg-[#bff46d] text-[#123d3b] shadow-2xl">
                <Lock className="w-10 h-10" />
                <span className="absolute -right-6 -top-4 rounded-full bg-[#ff795f] px-2.5 py-1 text-[9px] font-extrabold text-white shadow-md">
                  KEY SHREDDED
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 pb-8 md:px-8">
        <div className="mx-auto max-w-[1180px] rounded-[30px] bg-[#e6f0ea] px-7 py-8 text-xs text-[#607370] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#123d3b] text-[#bff46d]">
              <Heart className="w-4 h-4 fill-current" />
            </span>
            <span className="font-extrabold text-[#102b2c] text-base">COREX</span>
            <span className="ml-2">Patient-Held, Consent-Driven Health Record</span>
          </div>
          <p className="text-center md:text-right font-medium">
            Team COREX · Patient-Held Consent-Driven Health Record System
          </p>
        </div>
      </footer>
    </div>
  );
};

function StethoscopeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.8 2.3A.3.3 0 0 0 4.5 2.6V11a5 5 0 0 0 10 0V2.6a.3.3 0 0 0-.3-.3h-1.4a.3.3 0 0 0-.3.3V11a3 3 0 0 1-6 0V2.6a.3.3 0 0 0-.3-.3H4.8z" />
      <path d="M9.5 16v3a3 3 0 0 0 6 0v-1.5" />
      <circle cx="18" cy="16" r="2" />
    </svg>
  );
}
