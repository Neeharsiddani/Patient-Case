import React from 'react';
import { 
  Building2, 
  Activity, 
  Heart, 
  ShieldAlert, 
  UploadCloud, 
  History, 
  CheckCheck, 
  Ticket, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Lock,
  RotateCcw
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { Step1_HospitalSelect } from './Step1_HospitalSelect';
import { Step2_ReasonForVisit } from './Step2_ReasonForVisit';
import { Step4_ClinicalHistory } from './Step4_ClinicalHistory';
import { Step4_RedFlagAlert } from './Step4_RedFlagAlert';
import { Step5_DocUpload } from './Step5_DocUpload';
import { Step6_MedicalTimeline } from './Step6_MedicalTimeline';
import { Step7_ReviewInformation } from './Step7_ReviewInformation';
import { Step8_SecureSubmit } from './Step8_SecureSubmit';
import { KioskInactivityModal } from '../common/KioskInactivityModal';
import { MediMitraLogo } from '../common/MediMitraLogo';

import { getRouteUrl } from '../../utils/navigation';

export const PatientIntakeFlow = ({ onBackToWelcome }) => {
  const { kioskStep, setKioskStep, kioskForm, submitKioskCase } = usePatient();

  const steps = [
    { num: 1, title: 'Hospital', icon: Building2 },
    { num: 2, title: 'Reason for Visit', icon: Activity },
    { num: 3, title: 'Medical History', icon: Heart },
    { num: 4, title: 'Red Flags', icon: ShieldAlert },
    { num: 5, title: 'Documents', icon: UploadCloud },
    { num: 6, title: 'Timeline', icon: History },
    { num: 7, title: 'Review', icon: CheckCheck },
    { num: 8, title: 'Submit', icon: Ticket }
  ];

  const canProceed = () => {
    if (kioskStep === 1) {
      return Boolean(kioskForm.selectedHospitalId);
    }
    if (kioskStep === 2) {
      const hasName = Boolean(kioskForm.name && kioskForm.name.trim().length >= 2);
      const hasAge = Boolean(kioskForm.age && Number(kioskForm.age) >= 1 && Number(kioskForm.age) <= 125);
      const hasGender = Boolean(kioskForm.gender);
      const hasPhone = Boolean(kioskForm.phone && kioskForm.phone.replace(/\D/g, '').length >= 10);
      const hasReason = Boolean(kioskForm.reasonForVisit && kioskForm.reasonForVisit.trim());
      return hasName && hasAge && hasGender && hasPhone && hasReason;
    }
    return true;
  };

  const handleNext = async () => {
    if (!canProceed()) return;

    if (kioskStep === 7) {
      await submitKioskCase();
      setKioskStep(8);
      window.history.pushState({ screen: 'patient', step: 8 }, '', getRouteUrl('patient', 8));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (kioskStep < 8) {
      const nextStep = kioskStep + 1;
      setKioskStep(nextStep);
      window.history.pushState({ screen: 'patient', step: nextStep }, '', getRouteUrl('patient', nextStep));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (kioskStep > 1) {
      const prevStep = kioskStep - 1;
      setKioskStep(prevStep);
      window.history.pushState({ screen: 'patient', step: prevStep }, '', getRouteUrl('patient', prevStep));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (onBackToWelcome) {
        onBackToWelcome();
        window.history.pushState({ screen: 'welcome', step: 1 }, '', getRouteUrl('welcome', 1));
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Session Inactivity Protection */}
      <KioskInactivityModal idleTimeoutSec={90} countdownSec={15} />

      {/* Top Breadcrumb & Step Stepper */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={onBackToWelcome}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Change Role / Home</span>
          </button>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
              kioskForm.selectedHospitalName 
                ? 'text-cyan-900 bg-cyan-50 border-cyan-200' 
                : 'text-slate-600 bg-slate-100 border-slate-200'
            }`}>
              🏥 {kioskForm.selectedHospitalName || 'Select Healthcare Facility'}
            </span>
          </div>
        </div>

        {/* 8-Step Clean Stepper */}
        <div className="overflow-x-auto pb-1">
          <div className="flex items-center justify-between min-w-[700px] gap-2">
            {steps.map((s, idx) => {
              const isDone = kioskStep > s.num;
              const isCurrent = kioskStep === s.num;
              const IconComponent = s.icon;

              return (
                <React.Fragment key={s.num}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isDone) {
                        setKioskStep(s.num);
                        window.history.pushState({ screen: 'patient', step: s.num }, '', getRouteUrl('patient', s.num));
                      }
                    }}
                    disabled={!isDone && !isCurrent}
                    className={`flex flex-col items-center gap-1.5 transition-all ${
                      isDone ? 'cursor-pointer' : isCurrent ? 'cursor-default' : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div
                      style={{
                        backgroundColor: isCurrent ? '#088395' : isDone ? '#0f2b48' : '#f1f5f9',
                        color: isCurrent || isDone ? '#ffffff' : '#64748b',
                        borderColor: isCurrent ? '#088395' : isDone ? '#0f2b48' : '#cbd5e1'
                      }}
                      className="w-9 h-9 rounded-2xl border-2 flex items-center justify-center font-bold text-xs shadow-xs"
                    >
                      {isDone ? <Check size={16} strokeWidth={3} /> : <IconComponent size={16} />}
                    </div>
                    <span
                      style={{
                        color: isCurrent ? '#088395' : isDone ? '#0f172a' : '#94a3b8',
                        fontWeight: isCurrent ? '800' : '600'
                      }}
                      className="text-[11px] whitespace-nowrap text-center"
                    >
                      {s.title}
                    </span>
                  </button>

                  {idx < steps.length - 1 && (
                    <div
                      style={{
                        backgroundColor: kioskStep > s.num ? '#0f2b48' : '#e2e8f0'
                      }}
                      className="flex-1 h-1 rounded-full mx-1 transition-colors"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Step Body Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {kioskStep === 1 && <Step1_HospitalSelect />}
        {kioskStep === 2 && <Step2_ReasonForVisit />}
        {kioskStep === 3 && <Step4_ClinicalHistory />}
        {kioskStep === 4 && <Step4_RedFlagAlert />}
        {kioskStep === 5 && <Step5_DocUpload />}
        {kioskStep === 6 && <Step6_MedicalTimeline />}
        {kioskStep === 7 && <Step7_ReviewInformation onJumpToStep={(s) => {
          setKioskStep(s);
          window.history.pushState({ screen: 'patient', step: s }, '', getRouteUrl('patient', s));
        }} />}
        {kioskStep === 8 && <Step8_SecureSubmit onFinish={onBackToWelcome} />}

        {/* Wizard Bottom Navigation Buttons */}
        {kioskStep < 8 && (
          <div className="no-print flex items-center justify-between gap-4 pt-8 mt-8 border-t border-slate-200">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-all flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              <span>{kioskStep === 1 ? 'Cancel' : 'Previous Step'}</span>
            </button>

            {kioskStep < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                style={{
                  backgroundColor: canProceed() ? '#088395' : '#cbd5e1'
                }}
                className="px-8 py-3.5 text-white font-bold rounded-2xl text-sm transition-all flex items-center gap-2 hover:opacity-95 shadow-md cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Continue</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                style={{ backgroundColor: '#0f2b48' }}
                className="px-9 py-3.5 text-white font-bold rounded-2xl text-sm transition-all flex items-center gap-2 hover:opacity-90 shadow-md cursor-pointer"
              >
                <span>Submit to {kioskForm.selectedHospitalName || 'Hospital'}</span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
