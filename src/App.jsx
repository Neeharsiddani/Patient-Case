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
import { getRouteUrl, parseRouteFromHash } from './utils/navigation';

const AppContent = () => {
  const { 
    role, 
    setRole, 
    authenticatedUser, 
    handleUserLogout, 
    hospitals, 
    activeHospitalId,
    kioskStep,
    setKioskStep
  } = usePatient();

  // Initialize initial screen & step directly from browser URL hash
  const initialRoute = parseRouteFromHash(window.location.hash);
  const [currentScreen, setCurrentScreen] = useState(initialRoute.screen);

  useEffect(() => {
    document.title = 'MediMitra | Your Health, Ready for Care';
    
    // Sync initial route with context & URL bar
    if (initialRoute.screen === 'patient') {
      setRole('kiosk');
      setKioskStep(initialRoute.step);
    }
    window.history.replaceState(
      { screen: initialRoute.screen, step: initialRoute.step }, 
      '', 
      getRouteUrl(initialRoute.screen, initialRoute.step)
    );
  }, []);

  // Handle Browser History & URL Navigation (Back/Forward buttons & hash changes)
  useEffect(() => {
    const handleNavigationEvent = (event) => {
      const state = event.state;
      if (state && state.screen) {
        setCurrentScreen(state.screen);
        if (state.screen === 'patient' && state.step) {
          setKioskStep(state.step);
        }
      } else {
        const parsed = parseRouteFromHash(window.location.hash);
        setCurrentScreen(parsed.screen);
        if (parsed.screen === 'patient') {
          setKioskStep(parsed.step);
        }
      }
    };

    window.addEventListener('popstate', handleNavigationEvent);
    window.addEventListener('hashchange', handleNavigationEvent);
    return () => {
      window.removeEventListener('popstate', handleNavigationEvent);
      window.removeEventListener('hashchange', handleNavigationEvent);
    };
  }, [setKioskStep]);

  // Handle Keyboard Backspace Key Navigation with Real-Time URL Updates
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Backspace') {
        const target = e.target;
        const isEditable = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable || 
          (target.tagName === 'SELECT' && target.multiple);

        // If user is actively typing in a form input, let native Backspace work (deleting characters)
        if (isEditable) {
          return;
        }

        // If user is NOT typing in an input, prevent browser from exiting page and navigate back in-app
        e.preventDefault();

        if (currentScreen === 'patient') {
          if (kioskStep > 1) {
            const prevStep = kioskStep - 1;
            setKioskStep(prevStep);
            window.history.pushState({ screen: 'patient', step: prevStep }, '', getRouteUrl('patient', prevStep));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setCurrentScreen('welcome');
            window.history.pushState({ screen: 'welcome', step: 1 }, '', getRouteUrl('welcome', 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else if (currentScreen === 'doctor_login') {
          setCurrentScreen('welcome');
          window.history.pushState({ screen: 'welcome', step: 1 }, '', getRouteUrl('welcome', 1));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, kioskStep, setKioskStep]);

  const handleSelectPatient = () => {
    setRole('kiosk');
    setCurrentScreen('patient');
    const step = kioskStep || 1;
    window.history.pushState({ screen: 'patient', step }, '', getRouteUrl('patient', step));
  };

  const handleSelectDoctor = () => {
    if (authenticatedUser?.role === 'DOCTOR' && ApiService.getAuthToken()) {
      setRole('doctor');
      setCurrentScreen('doctor_dashboard');
      window.history.pushState({ screen: 'doctor_dashboard', step: 1 }, '', getRouteUrl('doctor_dashboard', 1));
    } else if (authenticatedUser?.role === 'HOSPITAL_ADMIN' && ApiService.getAuthToken()) {
      setRole('hospital_admin');
      setCurrentScreen('hospital_admin');
      window.history.pushState({ screen: 'hospital_admin', step: 1 }, '', getRouteUrl('hospital_admin', 1));
    } else {
      setCurrentScreen('doctor_login');
      window.history.pushState({ screen: 'doctor_login', step: 1 }, '', getRouteUrl('doctor_login', 1));
    }
  };

  const handleDoctorLoginSuccess = (user) => {
    if (user.role === 'HOSPITAL_ADMIN') {
      setRole('hospital_admin');
      setCurrentScreen('hospital_admin');
      window.history.pushState({ screen: 'hospital_admin', step: 1 }, '', getRouteUrl('hospital_admin', 1));
    } else {
      setRole('doctor');
      setCurrentScreen('doctor_dashboard');
      window.history.pushState({ screen: 'doctor_dashboard', step: 1 }, '', getRouteUrl('doctor_dashboard', 1));
    }
  };

  const handleLogout = () => {
    handleUserLogout();
    setCurrentScreen('welcome');
    window.history.pushState({ screen: 'welcome', step: 1 }, '', getRouteUrl('welcome', 1));
  };

  const currentHospital = hospitals.find(h => h.id === (authenticatedUser?.hospitalId || activeHospitalId)) || hospitals[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      <div>
        {/* Top Header - Shown on Dashboard & Intake */}
        {currentScreen !== 'welcome' && (
          <header className="no-print sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
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

      {/* Clean Professional Healthcare Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-5 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MediMitraLogo size="sm" showText={true} showTagline={true} />
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-500 font-medium">
            <span>Privacy</span>
            <span className="text-slate-300">•</span>
            <span>Security</span>
            <span className="text-slate-300">•</span>
            <span>Terms</span>
            {currentScreen !== 'welcome' && (
              <>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('welcome')}
                  className="text-cyan-700 hover:underline font-bold cursor-pointer"
                >
                  Change Role
                </button>
              </>
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
