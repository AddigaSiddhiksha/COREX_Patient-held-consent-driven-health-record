import React from 'react';
import { Heart, Shield, User, Stethoscope, FileText, RefreshCw, Activity } from 'lucide-react';

interface NavbarProps {
  activeTab: 'landing' | 'patient' | 'doctor' | 'audit';
  setActiveTab: (tab: 'landing' | 'patient' | 'doctor' | 'audit') => void;
  onResetDemo: () => void;
  pendingCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onResetDemo,
  pendingCount = 0
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#102f2e]/90 backdrop-blur-md border-b border-white/10 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <button 
          onClick={() => setActiveTab('landing')} 
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#123d3b] text-[#bff46d] shadow-md group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 fill-current" />
          </span>
          <div>
            <span className="text-xl font-extrabold tracking-tight">COREX</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-widest text-[#bff46d] bg-white/10 px-2 py-0.5 rounded-full">
              Consent Health
            </span>
          </div>
        </button>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('landing')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'landing'
                ? 'bg-[#bff46d] text-[#123d3b] shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="hidden md:inline">Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('patient')}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'patient'
                ? 'bg-[#bff46d] text-[#123d3b] shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Patient Portal</span>
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-extrabold bg-[#ff795f] text-white rounded-full animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('doctor')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'doctor'
                ? 'bg-[#bff46d] text-[#123d3b] shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'audit'
                ? 'bg-[#bff46d] text-[#123d3b] shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="hidden lg:inline">Audit Log</span>
          </button>

          <button
            onClick={onResetDemo}
            title="Reset synthetic demo database"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Reset Demo</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
