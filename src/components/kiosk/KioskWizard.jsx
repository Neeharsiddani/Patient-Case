import React from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  User, 
  Globe, 
  ShieldCheck, 
  Building2,
  Layers,
  Activity, 
  UploadCloud, 
  Cpu, 
  CheckCheck, 
  Sparkles, 
  Ticket,
  Lock
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { Step1_Identification } from './Step1_Identification';
import { Step2_Language } from './Step2_Language';
import { Step3_Consent } from './Step3_Consent';
import { Step4_HospitalSelect } from './Step4_HospitalSelect';
import { Step5_DepartmentSelect } from './Step5_DepartmentSelect';
import { Step4_ClinicalHistory } from './Step4_ClinicalHistory';
import { Step5_DocUpload } from './Step5_DocUpload';
import { Step6_OcrExtraction } from './Step6_OcrExtraction';
import { Step7_Review } from './Step7_Review';
import { Step8_SummaryGen } from './Step8_SummaryGen';
import { Step9_TokenReceipt } from './Step9_TokenReceipt';
import { KioskInactivityModal } from '../common/KioskInactivityModal';

export const KioskWizard = () => {
  const { kioskStep, setKioskStep, kioskForm, t, submitKioskCase } = usePatient();

  const steps = [
    { num: 1, title: t.step1 || 'ID', icon: User },
    { num: 2, title: t.step2 || 'Language', icon: Globe },
    { num: 3, title: t.step3 || 'Consent', icon: ShieldCheck },
    { num: 4, title: t.step4 || 'Facility', icon: Building2 },
    { num: 5, title: t.step5 || 'Department', icon: Layers },
    { num: 6, title: t.step6 || 'History', icon: Activity },
    { num: 7, title: t.step7 || 'Upload', icon: UploadCloud },
    { num: 8, title: t.step8 || 'Extraction', icon: Cpu },
    { num: 9, title: t.step9 || 'Review', icon: Sparkles },
    { num: 10, title: t.step10 || 'Token Slip', icon: Ticket }
  ];

  // Validation check for advancing
  const canProceed = () => {
    if (kioskStep === 1) {
      return (kioskForm.name && kioskForm.name.length > 0) || (kioskForm.abhaId && kioskForm.abhaId.length > 0) || (kioskForm.phone && kioskForm.phone.length > 0);
    }
    if (kioskStep === 3) {
      // Step 3 is Consent - STRICTLY require consentAgreed to advance
      return Boolean(kioskForm.consentAgreed);
    }
    if (kioskStep === 4) {
      return Boolean(kioskForm.selectedHospitalId);
    }
    if (kioskStep === 5) {
      return Boolean(kioskForm.selectedDepartmentId);
    }
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) return;

    if (kioskStep === 9) {
      submitKioskCase();
      setKioskStep(10);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (kioskStep < 10) {
      setKioskStep(kioskStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (kioskStep > 1) {
      setKioskStep(kioskStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (targetNum) => {
    // If trying to jump to Step 4 or beyond without consent, block it
    if (targetNum >= 4 && !kioskForm.consentAgreed) {
      return;
    }
    setKioskStep(targetNum);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 kiosk-mode">
      {/* Session Inactivity & Privacy Timeout Protection */}
      <KioskInactivityModal idleTimeoutSec={90} countdownSec={15} />

      {/* 10-Step Progress Stepper (Touch-Optimized) */}
      <div className="no-print bg-white p-4 rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[780px] gap-2">
          {steps.map((s, idx) => {
            const isDone = kioskStep > s.num;
            const isCurrent = kioskStep === s.num;
            const IconComponent = s.icon;
            const isBlockedByConsent = s.num >= 4 && !kioskForm.consentAgreed;

            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => !isBlockedByConsent && isDone && handleStepClick(s.num)}
                  disabled={isBlockedByConsent || (!isDone && !isCurrent)}
                  className={`flex flex-col items-center gap-1.5 transition-all relative group ${
                    isDone && !isBlockedByConsent ? 'cursor-pointer' : isCurrent ? 'cursor-default' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div
                    style={{
                      backgroundColor: isCurrent ? '#088395' : isDone ? '#10b981' : '#f1f5f9',
                      color: isCurrent || isDone ? '#ffffff' : '#64748b',
                      borderColor: isCurrent ? '#088395' : isDone ? '#10b981' : '#cbd5e1'
                    }}
                    className="w-10 h-10 rounded-2xl border-2 flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-105"
                  >
                    {isDone ? <Check size={18} strokeWidth={3} /> : <IconComponent size={18} />}
                  </div>
                  <span
                    style={{
                      color: isCurrent ? '#088395' : isDone ? '#0f172a' : '#94a3b8',
                      fontWeight: isCurrent ? '700' : '500'
                    }}
                    className="text-[11px] whitespace-nowrap text-center max-w-[72px] truncate"
                  >
                    {s.title}
                  </span>
                </button>

                {idx < steps.length - 1 && (
                  <div
                    style={{
                      backgroundColor: kioskStep > s.num ? '#10b981' : '#e2e8f0'
                    }}
                    className="flex-1 h-1 rounded-full mx-1 transition-colors"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Step Body Card */}
      <div className="bg-white/95 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-kiosk">
        {kioskStep === 1 && <Step1_Identification />}
        {kioskStep === 2 && <Step2_Language />}
        {kioskStep === 3 && <Step3_Consent />}
        {kioskStep === 4 && <Step4_HospitalSelect />}
        {kioskStep === 5 && <Step5_DepartmentSelect />}
        {kioskStep === 6 && <Step4_ClinicalHistory />}
        {kioskStep === 7 && <Step5_DocUpload />}
        {kioskStep === 8 && <Step6_OcrExtraction />}
        {kioskStep === 9 && <Step8_SummaryGen />}
        {kioskStep === 10 && <Step9_TokenReceipt />}

        {/* Wizard Bottom Navigation Buttons */}
        {kioskStep < 10 && (
          <div className="no-print flex items-center justify-between gap-4 pt-8 mt-8 border-t border-slate-200">
            {kioskStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-all flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                <span>{t.back}</span>
              </button>
            ) : (
              <div />
            )}

            {kioskStep < 9 ? (
              <div className="flex items-center gap-3">
                {kioskStep === 3 && !kioskForm.consentAgreed && (
                  <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                    <Lock size={14} />
                    <span>Consent required to proceed</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  style={{
                    backgroundColor: canProceed() ? '#088395' : '#cbd5e1',
                    boxShadow: canProceed() ? '0 10px 25px -5px rgba(8, 131, 149, 0.3)' : 'none'
                  }}
                  className="px-8 py-3.5 text-white font-bold rounded-2xl text-base transition-all flex items-center gap-2 hover:opacity-95"
                >
                  <span>{t.next}</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  backgroundColor: '#088395',
                  boxShadow: '0 10px 25px -5px rgba(8, 131, 149, 0.3)'
                }}
                className="px-8 py-3.5 text-white font-bold rounded-2xl text-base transition-all flex items-center gap-2 hover:opacity-95"
              >
                <span>{t.submit}</span>
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Global Privacy & DPDP Act Indicator Ribbon */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-100 px-5 py-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
          <span>
            <strong>Healthcare Facility Routing:</strong> Scoped under DPDP Act 2023 • Facility: <strong className="text-slate-800">{kioskForm.selectedHospitalName || 'Government General Hospital'}</strong> ({kioskForm.selectedDepartmentName || 'General Medicine'})
          </span>
        </div>
        <span className="text-cyan-800 font-extrabold text-[11px] uppercase tracking-wider">
          ABDM / FHIR Architecture
        </span>
      </div>
    </div>
  );
};
