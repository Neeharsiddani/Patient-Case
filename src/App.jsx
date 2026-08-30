import React from 'react';
import { PatientProvider, usePatient } from './context/PatientContext';
import { Header } from './components/common/Header';
import { KioskWizard } from './components/kiosk/KioskWizard';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { ShieldCheck, HeartHandshake, Building2, HelpCircle } from 'lucide-react';
import { MediMitraLogo } from './components/common/MediMitraLogo';

const AppContent = () => {
  const { role, setRole, t } = usePatient();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      <div>
        <Header />
        <main className="pb-12">
          {role === 'kiosk' ? <KioskWizard /> : <DoctorDashboard />}
        </main>
      </div>

      {/* Modern Healthcare Footer with MediMitra Branding */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MediMitraLogo size="sm" showText={true} showTagline={true} />
            <div className="hidden md:block border-l border-slate-200 pl-3">
              <p className="text-[11px] text-slate-400">
                Smart India Hackathon (SIH 2026) Problem Statement: Patient Case-Taking Software
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
            <div className="flex items-center gap-1">
              <ShieldCheck size={15} className="text-cyan-700" />
              <span>ABDM FHIR R4 Ready</span>
            </div>
            <div className="flex items-center gap-1">
              <HeartHandshake size={15} className="text-emerald-700" />
              <span>DPDP Act 2023 Compliant</span>
            </div>
            <button
              type="button"
              onClick={() => setRole(role === 'kiosk' ? 'doctor' : 'kiosk')}
              className="text-cyan-700 hover:underline font-bold"
            >
              Switch to {role === 'kiosk' ? 'Doctor Workstation' : 'Patient Kiosk'}
            </button>
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
