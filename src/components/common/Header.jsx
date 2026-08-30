import React, { useState } from 'react';
import { 
  Building2, 
  UserCheck, 
  Stethoscope, 
  Globe2, 
  RotateCcw, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Users, 
  CreditCard,
  Lock,
  KeyRound
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { languages } from '../../data/translations';
import { initialPatients } from '../../data/initialPatients';
import { AbhaProfileModal } from './AbhaProfileModal';
import { MediMitraLogo } from './MediMitraLogo';
import { DoctorAuthModal } from '../doctor/DoctorAuthModal';
import { ApiService } from '../../services/api';

export const Header = () => {
  const { 
    role, 
    setRole, 
    language, 
    setLanguage, 
    t, 
    patients, 
    setPatients,
    selectedPatient,
    resetKiosk,
    serverOnline
  } = usePatient();

  const [showAbhaModal, setShowAbhaModal] = useState(false);
  const [showDoctorAuth, setShowDoctorAuth] = useState(false);
  const [authenticatedDoctor, setAuthenticatedDoctor] = useState(() => {
    return ApiService.getAuthToken() ? { fullName: 'Dr. Rajesh Sharma, MD', role: 'DOCTOR' } : null;
  });

  const handleDoctorClick = () => {
    if (role === 'doctor') return;
    if (authenticatedDoctor || ApiService.getAuthToken()) {
      setRole('doctor');
    } else {
      setShowDoctorAuth(true);
    }
  };

  const handleDoctorAuthenticated = (doctorUser) => {
    setAuthenticatedDoctor(doctorUser);
    setRole('doctor');
  };

  const handleResetSession = () => {
    if (window.confirm('Clear current session data and refresh patient records?')) {
      setPatients(initialPatients);
      localStorage.removeItem('medimitra_patients_v2');
      localStorage.removeItem('medikiosk_patients_v2');
      resetKiosk();
    }
  };

  const waitingCount = patients.filter(p => p.status === 'Waiting').length;
  const redFlagCount = patients.filter(p => p.triageLevel <= 2 && p.status !== 'Completed').length;

  return (
    <header className="no-print sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top ABDM / Hospital Header Ribbon */}
      <div style={{ backgroundColor: '#051923', color: '#ecfeff' }} className="px-4 py-1.5 text-xs font-medium flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-cyan-400" />
          <span>Ayushman Bharat Digital Mission (ABDM) • National Health Authority (NHA)</span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="bg-cyan-950 text-cyan-300 border border-cyan-700 text-[10px] uppercase font-bold px-2 py-0.2 rounded-full">
            ABDM Gateway Connected
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${serverOnline ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-amber-950 text-amber-300 border border-amber-700'}`}>
            {serverOnline ? '● Live Backend Connected' : '○ Standalone / Local Resilient'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-300 text-[11px]">
            <Lock size={11} className="text-emerald-400" />
            <span>256-Bit Encrypted Data</span>
          </div>
          <button
            onClick={handleResetSession}
            title="Refresh patient records"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw size={12} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* MediMitra Brand Logo & Hospital Name */}
        <div className="flex items-center gap-3">
          <MediMitraLogo size="md" showText={true} />
          <div className="hidden sm:block border-l border-slate-200 pl-3">
            <span className="bg-cyan-100 text-cyan-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-cyan-300">
              ABDM Clinical Intake
            </span>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {t.hospitalName}
            </p>
          </div>
        </div>

        {/* Center: Live Role Switcher */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => setRole('kiosk')}
            style={{
              backgroundColor: role === 'kiosk' ? '#088395' : 'transparent',
              color: role === 'kiosk' ? '#ffffff' : '#475569',
              boxShadow: role === 'kiosk' ? '0 4px 12px rgba(8, 131, 149, 0.35)' : 'none'
            }}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
          >
            <UserCheck size={18} />
            <span>🏥 {t.patientKiosk}</span>
          </button>
          
          <button
            onClick={handleDoctorClick}
            style={{
              backgroundColor: role === 'doctor' ? '#0A4D68' : 'transparent',
              color: role === 'doctor' ? '#ffffff' : '#475569',
              boxShadow: role === 'doctor' ? '0 4px 12px rgba(10, 77, 104, 0.35)' : 'none'
            }}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 relative"
          >
            <Stethoscope size={18} />
            <span>👨‍⚕️ {t.doctorWorkstation}</span>
            {redFlagCount > 0 && (
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping absolute top-1 right-1" />
            )}
          </button>
        </div>

        {/* Right Side: ABHA Profile View, Language Switcher & Queue */}
        <div className="flex items-center gap-2.5">
          {/* Quick ABHA Profile Button */}
          <button
            type="button"
            onClick={() => setShowAbhaModal(true)}
            className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Inspect ABDM Health Card & Profile"
          >
            <CreditCard size={15} />
            <span className="hidden sm:inline">ABHA Card</span>
          </button>

          {/* Live Queue Indicator */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Users size={15} className="text-slate-600" />
            <span className="font-bold text-slate-800">{waitingCount} Waiting</span>
            {redFlagCount > 0 && (
              <span className="bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded text-[10px] border border-red-200">
                {redFlagCount} Red Flags
              </span>
            )}
          </div>

          {/* Regional Language Dropdown */}
          <div className="relative flex items-center">
            <Globe2 size={16} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 shadow-sm cursor-pointer"
              aria-label="Select Application Language"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.native} ({lang.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Doctor Authentication Modal */}
      {showDoctorAuth && (
        <DoctorAuthModal
          isOpen={showDoctorAuth}
          onClose={() => setShowDoctorAuth(false)}
          onAuthenticated={handleDoctorAuthenticated}
        />
      )}

      {/* ABHA Profile Modal */}
      {showAbhaModal && (
        <AbhaProfileModal 
          patient={selectedPatient} 
          onClose={() => setShowAbhaModal(false)} 
        />
      )}
    </header>
  );
};
