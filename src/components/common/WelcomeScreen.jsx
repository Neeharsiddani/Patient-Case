import React from 'react';
import { 
  User, 
  Stethoscope, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  Lock, 
  CheckCircle2,
  HeartPulse
} from 'lucide-react';
import { MediMitraLogo } from './MediMitraLogo';

export const WelcomeScreen = ({ onSelectPatient, onSelectDoctor }) => {
  return (
    <div className="min-h-[85vh] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Professional Center Header */}
      <div className="max-w-4xl mx-auto w-full text-center space-y-4 pt-4">
        <div className="flex justify-center">
          <MediMitraLogo size="xl" showText={true} showTagline={true} />
        </div>

        <div className="pt-6 space-y-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-heading tracking-tight">
            How would you like to continue?
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-medium">
            Please select your role to proceed with clinical intake or access hospital records.
          </p>
        </div>
      </div>

      {/* Main 2 Large Accessible Cards */}
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        {/* PATIENT OPTION */}
        <button
          type="button"
          onClick={onSelectPatient}
          style={{ borderColor: '#cbd5e1' }}
          className="bg-white p-8 sm:p-10 rounded-3xl border-2 text-left transition-all hover:border-cyan-600 hover:shadow-xl group flex flex-col justify-between min-h-[300px] relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-cyan-500/20"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div 
                style={{ backgroundColor: '#ecfeff', color: '#088395' }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-sm"
              >
                <User size={36} strokeWidth={2.2} />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
                Patient Intake
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-cyan-900 transition-colors font-heading">
                PATIENT
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                Share your health information before your consultation
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-cyan-700 group-hover:text-cyan-900">
            <span>Start Intake Workflow</span>
            <div className="w-8 h-8 rounded-full bg-cyan-50 group-hover:bg-cyan-700 group-hover:text-white flex items-center justify-center transition-colors">
              <ArrowRight size={18} />
            </div>
          </div>
        </button>

        {/* DOCTOR OPTION */}
        <button
          type="button"
          onClick={onSelectDoctor}
          style={{ borderColor: '#cbd5e1' }}
          className="bg-white p-8 sm:p-10 rounded-3xl border-2 text-left transition-all hover:border-slate-800 hover:shadow-xl group flex flex-col justify-between min-h-[300px] relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-slate-500/20"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div 
                style={{ backgroundColor: '#f1f5f9', color: '#0A4D68' }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"
              >
                <Stethoscope size={36} strokeWidth={2.2} />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                Clinical Workstation
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-slate-800 transition-colors font-heading">
                DOCTOR
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                Access your hospital's clinical dashboard
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-slate-700 group-hover:text-slate-900">
            <span>Hospital Staff Login</span>
            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors">
              <ArrowRight size={18} />
            </div>
          </div>
        </button>
      </div>

      {/* Bottom Subtle Trust Badges */}
      <div className="max-w-2xl mx-auto w-full pt-4">
        <div className="bg-slate-100/80 border border-slate-200 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-semibold">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-emerald-700" />
            <span>Digital Personal Data Protection (DPDP) Act 2023</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock size={14} className="text-cyan-700" />
            <span>256-Bit Encrypted Healthcare Architecture</span>
          </div>
        </div>
      </div>
    </div>
  );
};
