import React from 'react';
import { 
  User, 
  Stethoscope, 
  ArrowRight, 
  FileText,
  CheckCircle2,
  Activity,
  ClipboardList,
  Building2,
  ShieldCheck,
  Lock,
  FileCheck,
  Sparkles,
  HeartPulse,
  Clock,
  Check,
  ChevronRight
} from 'lucide-react';
import { MediMitraLogo } from './MediMitraLogo';

export const WelcomeScreen = ({ onSelectPatient, onSelectDoctor }) => {
  const clinicalPipelineSteps = [
    {
      step: '1',
      badge: 'Patient Intake',
      title: 'Share Reason for Visit',
      desc: 'Patient shares symptoms and primary reason for visit.',
      icon: User
    },
    {
      step: '2',
      badge: 'Clinical History',
      title: 'Collect Health Details',
      desc: 'MediMitra collects structured clinical information & history.',
      icon: Activity
    },
    {
      step: '3',
      badge: 'Medical Records',
      title: 'Organize Documents',
      desc: 'Previous prescriptions, reports and documents are organized.',
      icon: FileText
    },
    {
      step: '4',
      badge: 'Structured Case',
      title: 'Prepare Case File',
      desc: 'MediMitra prepares the information for clinical review.',
      icon: ClipboardList
    },
    {
      step: '5',
      badge: 'Doctor Review',
      title: 'Verify & Consult',
      desc: 'Authorized healthcare professionals review, edit and verify.',
      icon: Stethoscope
    }
  ];

  return (
    <div className="min-h-[85vh] flex flex-col justify-between py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
      {/* 1. Hero Section: Brand & Clear Clinical Purpose */}
      <div className="text-center space-y-3.5 pt-2">
        <div className="flex justify-center">
          <MediMitraLogo size="xl" showText={true} showTagline={true} />
        </div>

        <div className="pt-2 max-w-2xl mx-auto space-y-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
            Prepare for Care Before the Consultation
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            MediMitra helps patients record their symptoms, clinical history and relevant medical records before consultation. It organizes this information into a structured case for authorized healthcare professionals to review before seeing the patient.
          </p>
        </div>
      </div>

      {/* 2. Role Selection: Patient and Doctor */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
            How would you like to continue?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Please select your role to proceed with clinical intake or access hospital records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-1">
          {/* PATIENT OPTION */}
          <button
            type="button"
            onClick={onSelectPatient}
            style={{ borderColor: '#cbd5e1' }}
            className="bg-white p-7 sm:p-8 rounded-3xl border-2 text-left transition-all hover:border-cyan-600 hover:shadow-xl group flex flex-col justify-between min-h-[270px] relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-cyan-500/20 cursor-pointer"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div 
                  style={{ backgroundColor: '#ecfeff', color: '#088395' }}
                  className="w-13 h-13 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-2xs"
                >
                  <User size={28} strokeWidth={2.2} />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
                  Patient Intake
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-cyan-900 transition-colors font-heading">
                  PATIENT
                </h3>
                <p className="text-sm font-semibold text-slate-700 leading-snug">
                  Complete your health history before your consultation
                </p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed pt-0.5">
                  Select hospital → Share symptoms → Complete clinical history → Provide medical records → Review & submit
                </p>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-cyan-700 group-hover:text-cyan-900">
              <span>Start Patient Intake →</span>
              <div className="w-8 h-8 rounded-full bg-cyan-50 group-hover:bg-cyan-700 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                <ArrowRight size={16} />
              </div>
            </div>
          </button>

          {/* DOCTOR OPTION */}
          <button
            type="button"
            onClick={onSelectDoctor}
            style={{ borderColor: '#cbd5e1' }}
            className="bg-white p-7 sm:p-8 rounded-3xl border-2 text-left transition-all hover:border-slate-800 hover:shadow-xl group flex flex-col justify-between min-h-[270px] relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-slate-500/20 cursor-pointer"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div 
                  style={{ backgroundColor: '#f1f5f9', color: '#0f2b48' }}
                  className="w-13 h-13 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-2xs"
                >
                  <Stethoscope size={28} strokeWidth={2.2} />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Hospital Workstation
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-slate-800 transition-colors font-heading">
                  DOCTOR
                </h3>
                <p className="text-sm font-semibold text-slate-700 leading-snug">
                  Access your hospital's clinical dashboard
                </p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed pt-0.5">
                  Select hospital → Secure login → View authorized cases → Review & verify
                </p>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-slate-700 group-hover:text-slate-900">
              <span>Hospital Doctor Login →</span>
              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                <ArrowRight size={16} />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. The Core Visual Workflow: From Patient Intake to Clinical Review */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div className="text-center sm:text-left">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
            End-to-End Clinical Flow
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 font-heading mt-1.5">
            From Patient Intake to Clinical Review
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            How clinical case information moves from initial patient intake to doctor verification
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {clinicalPipelineSteps.map((step, idx) => {
            const IconComp = step.icon;
            return (
              <div 
                key={step.step}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3 relative group hover:border-cyan-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-cyan-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {step.step}
                  </div>
                  <span className="text-[10px] font-bold text-cyan-900 uppercase">
                    {step.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {idx < clinicalPipelineSteps.length - 1 && (
                  <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-400">
                    <ChevronRight size={14} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Compact For Patients / For Clinicians & Clear Value Statement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-200/60 flex-shrink-0">
            <User size={18} />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-800">
              For Patients
            </span>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Share your symptoms, medical history and relevant records before your consultation.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex-shrink-0">
            <Stethoscope size={18} />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
              For Clinicians
            </span>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Review structured patient information and relevant records before seeing the patient.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Clear Clinical Value Statement */}
      <div className="text-center bg-slate-100/80 border border-slate-200 rounded-2xl p-4 max-w-2xl mx-auto w-full">
        <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
          Before the consultation, the information is prepared.
          <br className="hidden sm:inline" />
          {' '}During the consultation, the doctor focuses on the patient.
        </p>
      </div>

      {/* 6. Privacy & Security Trust Indicator */}
      <div className="max-w-2xl mx-auto w-full pt-1">
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-slate-600 font-semibold shadow-2xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-cyan-800" />
            <span>Privacy & Security Focused</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock size={14} className="text-slate-700" />
            <span>Secure Healthcare Data Architecture</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileCheck size={14} className="text-emerald-700" />
            <span>FHIR-ready integration</span>
          </div>
        </div>
      </div>
    </div>
  );
};
