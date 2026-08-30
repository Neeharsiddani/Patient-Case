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
  KeyRound,
  LogOut,
  Hospital
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
    serverOnline,
    authenticatedUser,
    handleUserLogin,
    handleUserLogout,
    activeHospitalId,
    hospitals
  } = usePatient();

  const [showAbhaModal, setShowAbhaModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const currentHospital = hospitals.find(h => h.id === (authenticatedUser?.hospitalId || activeHospitalId)) || hospitals[0];

  const handleRoleSelect = (targetRole) => {
    if (targetRole === 'kiosk') {
      setRole('kiosk');
    } else if (targetRole === 'doctor') {
      if (authenticatedUser?.role === 'DOCTOR' && ApiService.getAuthToken()) {
        setRole('doctor');
      } else {
        setShowAuthModal(true);
      }
    } else if (targetRole === 'hospital_admin') {
      if (authenticatedUser?.role === 'HOSPITAL_ADMIN' && ApiService.getAuthToken()) {
        setRole('hospital_admin');
      } else {
        setShowAuthModal(true);
      }
    }
  };

  const handleAuthenticated = (user) => {
    handleUserLogin(user, ApiService.getAuthToken());
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
          {authenticatedUser && (
            <div className="flex items-center gap-2 text-cyan-200 text-xs">
              <span className="font-bold">{authenticatedUser.fullName}</span>
              <span className="text-slate-400">({authenticatedUser.hospitalName})</span>
              <button
                type="button"
                onClick={handleUserLogout}
                className="text-red-400 hover:text-red-300 ml-1 flex items-center gap-0.5 text-[11px]"
                title="Sign out of staff session"
              >
                <LogOut size={12} />
                <span>Logout</span>
              </button>
            </div>
          )}
          <div className="flex items-center gap-1 text-slate-300 text-[11px]">
            <Lock size={11} className="text-emerald-400" />
            <span>256-Bit TLS</span>
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
            <p className="text-xs text-slate-600 font-bold mt-0.5">
              {currentHospital?.name || t.hospitalName}
            </p>
          </div>
        </div>

        {/* Center: 3-Role Switcher (Patient Kiosk | Doctor Workstation | Hospital Admin) */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => handleRoleSelect('kiosk')}
            style={{
              backgroundColor: role === 'kiosk' ? '#088395' : 'transparent',
              color: role === 'kiosk' ? '#ffffff' : '#475569',
              boxShadow: role === 'kiosk' ? '0 4px 12px rgba(8, 131, 149, 0.35)' : 'none'
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200"
          >
            <UserCheck size={16} />
            <span>🏥 {t.patientKiosk}</span>
          </button>
          
          <button
            onClick={() => handleRoleSelect('doctor')}
            style={{
              backgroundColor: role === 'doctor' ? '#0A4D68' : 'transparent',
              color: role === 'doctor' ? '#ffffff' : '#475569',
              boxShadow: role === 'doctor' ? '0 4px 12px rgba(10, 77, 104, 0.35)' : 'none'
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 relative"
          >
            <Stethoscope size={16} />
            <span>👨‍⚕️ {t.doctorWorkstation}</span>
            {redFlagCount > 0 && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping absolute top-1 right-1" />
            )}
          </button>

          <button
            onClick={() => handleRoleSelect('hospital_admin')}
            style={{
              backgroundColor: role === 'hospital_admin' ? '#4c1d95' : 'transparent',
              color: role === 'hospital_admin' ? '#ffffff' : '#475569',
              boxShadow: role === 'hospital_admin' ? '0 4px 12px rgba(76, 29, 149, 0.35)' : 'none'
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200"
          >
            <Building2 size={16} />
            <span>🏢 Hospital Admin</span>
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

          {/* Switch Doctor Profile Shortcut */}
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
            title="Switch Staff Account / Doctor"
          >
            <KeyRound size={13} />
            <span className="hidden md:inline">Switch Staff</span>
          </button>

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

      {/* Staff & Doctor Authentication Modal */}
      {showAuthModal && (
        <DoctorAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthenticated={handleAuthenticated}
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
