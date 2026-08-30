import React, { useState, useEffect } from 'react';
import { PatientProvider, usePatient } from './context/PatientContext';
import { Header } from './components/common/Header';
import { WelcomeScreen } from './components/common/WelcomeScreen';
import { PatientIntakeFlow } from './components/kiosk/PatientIntakeFlow';
import { DoctorLoginScreen } from './components/doctor/DoctorLoginScreen';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { HospitalDashboard } from './components/hospital/HospitalDashboard';
import { ShieldCheck, HeartHandshake, Building2, Lock, ArrowLeft } from 'lucide-react';
import { MediMitraLogo } from './components/common/MediMitraLogo';
import { ApiService } from './services/api';

const AppContent = () => {
  const { 
    role, 
    setRole, 
    authenticatedUser, 
    handleUserLogout, 
    hospitals, 
    activeHospitalId 
  } = usePatient();

  // Screen routing state: 'welcome' | 'patient' | 'doctor_login' | 'doctor_dashboard' | 'hospital_admin'
  const [currentScreen, setCurrentScreen] = useState('welcome');

  useEffect(() => {
    document.title = 'MediMitra | Your Health, Ready for Care';
  }, []);

  const handleSelectPatient = () => {
    setRole('kiosk');
    setCurrentScreen('patient');
  };

  const handleSelectDoctor = () => {
    if (authenticatedUser?.role === 'DOCTOR' && ApiService.getAuthToken()) {
      setRole('doctor');
      setCurrentScreen('doctor_dashboard');
    } else if (authenticatedUser?.role === 'HOSPITAL_ADMIN' && ApiService.getAuthToken()) {
      setRole('hospital_admin');
      setCurrentScreen('hospital_admin');
    } else {
      setCurrentScreen('doctor_login');
    }
  };

  const handleDoctorLoginSuccess = (user) => {
    if (user.role === 'HOSPITAL_ADMIN') {
      setRole('hospital_admin');
      setCurrentScreen('hospital_admin');
    } else {
      setRole('doctor');
      setCurrentScreen('doctor_dashboard');
    }
  };

  const handleLogout = () => {
    handleUserLogout();
    setCurrentScreen('welcome');
  };

  const currentHospital = hospitals.find(h => h.id === (authenticatedUser?.hospitalId || activeHospitalId)) || hospitals[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      <div>
        {/* Top Header - Shown on Dashboard & Intake */}
        {currentScreen !== 'welcome' && (
          <header className="no-print sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
            {/* Top Official National Health Ribbon */}
            <div style={{ backgroundColor: '#051923', color: '#ecfeff' }} className="px-4 py-1.5 text-xs font-medium flex flex-wrap items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-cyan-400" />
                <span>Ayushman Bharat Digital Mission (ABDM) • National Health Authority (NHA)</span>
                <span className="hidden md:inline text-slate-400">|</span>
                <span className="bg-cyan-950 text-cyan-300 border border-cyan-700 text-[10px] uppercase font-bold px-2 py-0.2 rounded-full">
                  ABDM Gateway Ready
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-slate-300 text-[11px]">
                  <Lock size={11} className="text-emerald-400" />
                  <span>256-Bit TLS Healthcare Architecture</span>
                </div>
              </div>
            </div>

            {/* Main Header Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('welcome')}
                  className="hover:opacity-85 transition-opacity"
                  title="Return to Welcome Screen"
                >
                  <MediMitraLogo size="md" showText={true} />
                </button>

                <div className="hidden sm:block border-l border-slate-200 pl-3">
                  <span className="bg-cyan-100 text-cyan-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-cyan-300">
                    {currentScreen === 'patient' ? 'Patient Intake' : currentScreen === 'doctor_login' ? 'Hospital Authentication' : 'Hospital Clinical Workstation'}
                  </span>
                  <p className="text-xs text-slate-700 font-extrabold mt-0.5">
                    {currentHospital?.name}
                  </p>
                </div>
              </div>

              {/* Right Side Controls */}
              <div className="flex items-center gap-3">
                {currentScreen === 'patient' && (
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('welcome')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Home</span>
                  </button>
                )}

                {(currentScreen === 'doctor_dashboard' || currentScreen === 'hospital_admin') && (
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col text-right">
                      <span className="text-xs font-bold text-slate-900">{authenticatedUser?.fullName || 'Dr. Rajesh Sharma, MD'}</span>
                      <span className="text-[10px] text-slate-500">{authenticatedUser?.department || 'Cardiology'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                      title="Secure Logout"
                    >
                      <Lock size={13} />
                      <span>Secure Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Dynamic Main Body Content */}
        <main className="pb-12">
          {currentScreen === 'welcome' && (
            <WelcomeScreen
              onSelectPatient={handleSelectPatient}
              onSelectDoctor={handleSelectDoctor}
            />
          )}

          {currentScreen === 'patient' && (
            <PatientIntakeFlow
              onBackToWelcome={() => setCurrentScreen('welcome')}
            />
          )}

          {currentScreen === 'doctor_login' && (
            <DoctorLoginScreen
              onBack={() => setCurrentScreen('welcome')}
              onLoginSuccess={handleDoctorLoginSuccess}
            />
          )}

          {currentScreen === 'doctor_dashboard' && (
            <DoctorDashboard />
          )}

          {currentScreen === 'hospital_admin' && (
            <HospitalDashboard />
          )}
        </main>
      </div>

      {/* Official Clean Hospital Information System Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MediMitraLogo size="sm" showText={true} showTagline={true} />
            <div className="hidden md:block border-l border-slate-200 pl-3">
              <p className="text-[11px] text-slate-500 font-medium">
                Clinical Case Intake & Medical Verification Software System
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
            <div className="flex items-center gap-1">
              <ShieldCheck size={15} className="text-cyan-700" />
              <span>FHIR R4 Standard</span>
            </div>
            <div className="flex items-center gap-1">
              <HeartHandshake size={15} className="text-emerald-700" />
              <span>DPDP Act 2023 Compliant</span>
            </div>
            {currentScreen !== 'welcome' && (
              <button
                type="button"
                onClick={() => setCurrentScreen('welcome')}
                className="text-cyan-700 hover:underline font-bold"
              >
                Change Role
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <PatientProvider>
      <AppContent />
    </PatientProvider>
  );
}
