import React, { useState } from 'react';
import { 
  Building2, 
  User,
  Globe,
  ShieldCheck,
  Activity, 
  Heart, 
  Leaf,
  ShieldAlert, 
  UploadCloud, 
  Cpu,
  History, 
  CheckCheck, 
  Ticket, 
  ArrowLeft, 
  ArrowRight, 
  ChevronRight,
  Check, 
  Lock, 
  RotateCcw,
  Loader2
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { Step1_HospitalSelect } from './Step1_HospitalSelect';
import { Step1_Identification } from './Step1_Identification';
import { Step2_Language } from './Step2_Language';
import { Step3_Consent } from './Step3_Consent';
import { Step2_ReasonForVisit } from './Step2_ReasonForVisit';
import { Step4_ClinicalHistory } from './Step4_ClinicalHistory';
import { Step4_AyushHistory } from './Step4_AyushHistory';
import { Step4_RedFlagAlert } from './Step4_RedFlagAlert';
import { Step5_DocUpload } from './Step5_DocUpload';
import { Step6_OcrExtraction } from './Step6_OcrExtraction';
import { Step6_MedicalTimeline } from './Step6_MedicalTimeline';
import { Step7_ReviewInformation } from './Step7_ReviewInformation';
import { Step8_SecureSubmit } from './Step8_SecureSubmit';
import { KioskInactivityModal } from '../common/KioskInactivityModal';
import { MediMitraLogo } from '../common/MediMitraLogo';

import { getRouteUrl } from '../../utils/navigation';

export const PatientIntakeFlow = ({ onBackToWelcome }) => {
  const { kioskStep, setKioskStep, kioskForm, setKioskForm, submitKioskCase } = usePatient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAyushDepartment = Boolean(
    kioskForm.assignedDepartment?.toLowerCase().includes('ayush') ||
    kioskForm.assignedDepartment?.toLowerCase().includes('ayurveda') ||
    kioskForm.selectedDepartmentName?.toLowerCase().includes('ayush') ||
    kioskForm.selectedDepartmentName?.toLowerCase().includes('ayurveda') ||
    kioskForm.selectedDepartmentId?.toLowerCase().includes('ayush') ||
    kioskForm.department_id?.toLowerCase().includes('ayush') ||
    kioskForm.isAyushCase
  );

  const isAyush = isAyushDepartment && !kioskForm.skipAyushAssessment;

  // Complete patient journey step sequence
  const steps = isAyush ? [
    { num: 1, title: 'Hospital', icon: Building2 },
    { num: 2, title: 'Identification', icon: User },
    { num: 3, title: 'Language', icon: Globe },
    { num: 4, title: 'Consent', icon: ShieldCheck },
    { num: 5, title: 'Reason for Visit', icon: Activity },
    { num: 6, title: 'Clinical History', icon: Heart },
    { num: 7, title: 'AYUSH Assessment', icon: Leaf },
    { num: 8, title: 'Red Flags', icon: ShieldAlert },
    { num: 9, title: 'Documents', icon: UploadCloud },
    { num: 10, title: 'Extraction', icon: Cpu },
    { num: 11, title: 'Timeline', icon: History },
    { num: 12, title: 'Review', icon: CheckCheck },
    { num: 13, title: 'Token', icon: Ticket }
  ] : [
    { num: 1, title: 'Hospital', icon: Building2 },
    { num: 2, title: 'Identification', icon: User },
    { num: 3, title: 'Language', icon: Globe },
    { num: 4, title: 'Consent', icon: ShieldCheck },
    { num: 5, title: 'Reason for Visit', icon: Activity },
    { num: 6, title: 'Clinical History', icon: Heart },
    { num: 7, title: 'Red Flags', icon: ShieldAlert },
    { num: 8, title: 'Documents', icon: UploadCloud },
    { num: 9, title: 'Extraction', icon: Cpu },
    { num: 10, title: 'Timeline', icon: History },
    { num: 11, title: 'Review', icon: CheckCheck },
    { num: 12, title: 'Token', icon: Ticket }
  ];

  const totalSteps = steps.length;
  const reviewStepNum = totalSteps - 1;
  const finishStepNum = totalSteps;

  const canProceed = () => {
    if (kioskStep === 1) {
      return Boolean(kioskForm.selectedHospitalId);
    }
    if (kioskStep === 2) {
      // Step 2: Patient Identification - ABHA, phone, or name provided, or walkin
      return Boolean(
        (kioskForm.name && kioskForm.name.trim().length >= 2) ||
        (kioskForm.abhaId && kioskForm.abhaId.length >= 10) ||
        (kioskForm.phone && kioskForm.phone.replace(/\D/g, '').length >= 10) ||
        kioskForm.abhaStatus === 'WALKIN_NO_ABHA'
      );
    }
    if (kioskStep === 3) {
      // Step 3: Language
      return true;
    }
    if (kioskStep === 4) {
      // Step 4: Consent - Explicit consent required under DPDP Act 2023
      return Boolean(kioskForm.consentAgreed);
    }
    if (kioskStep === 5) {
      // Step 5: Reason for visit - Demographics & Reason
      const hasName = Boolean(kioskForm.name && kioskForm.name.trim().length >= 2);
      const hasAge = Boolean(kioskForm.age && Number(kioskForm.age) >= 1 && Number(kioskForm.age) <= 125);
      const hasGender = Boolean(kioskForm.gender);
      const hasPhone = Boolean(kioskForm.phone && kioskForm.phone.replace(/\D/g, '').length >= 10);
      const hasReason = Boolean((kioskForm.reasonForVisit && kioskForm.reasonForVisit.trim()) || kioskForm.chiefComplaints?.length > 0);
      return hasName && hasAge && hasGender && hasPhone && hasReason;
    }
    return true;
  };

  const handleNext = async () => {
    if (!canProceed() || isSubmitting) return;

    if (kioskStep === 6 && isAyushDepartment) {
      setKioskForm((prev) => ({ ...prev, skipAyushAssessment: false }));
    }

    if (kioskStep === reviewStepNum) {
      setIsSubmitting(true);
      try {
        await submitKioskCase();
        setKioskStep(finishStepNum);
        window.history.pushState({ screen: 'patient', step: finishStepNum }, '', getRouteUrl('patient', finishStepNum));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } finally {
        setIsSubmitting(false);
      }
    } else if (kioskStep < finishStepNum) {
      const nextStep = kioskStep + 1;
      setKioskStep(nextStep);
      window.history.pushState({ screen: 'patient', step: nextStep }, '', getRouteUrl('patient', nextStep));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSkipAyush = () => {
    if (!canProceed() || isSubmitting) return;
    setKioskForm((prev) => ({ ...prev, skipAyushAssessment: true }));
    const nextStep = 7;
    setKioskStep(nextStep);
    window.history.pushState({ screen: 'patient', step: nextStep }, '', getRouteUrl('patient', nextStep));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Change Role / Home</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {isAyush && (
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                🌿 AYUSH / Ayurveda OPD Mode
              </span>
            )}
            <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
              kioskForm.selectedHospitalName 
                ? 'text-cyan-900 bg-cyan-50 border-cyan-200' 
                : 'text-slate-600 bg-slate-100 border-slate-200'
            }`}>
              {kioskForm.selectedHospitalName 
                ? `🏥 ${kioskForm.selectedHospitalName} • ${kioskForm.assignedDepartment || 'General Medicine'}`
                : '🏥 Select Hospital'}
            </span>
          </div>
        </div>

        {/* Mobile Step Progress Card (<640px) */}
        <div className="block sm:hidden space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                style={{ backgroundColor: isAyush && steps[kioskStep - 1]?.title.includes('AYUSH') ? '#047857' : '#088395' }}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs"
              >
                {kioskStep}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Step {kioskStep} of {totalSteps}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {steps[kioskStep - 1]?.title || 'Clinical Intake'}
                </h4>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-800 font-mono bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
              {Math.round((kioskStep / totalSteps) * 100)}%
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
            <div 
              style={{ 
                width: `${(kioskStep / totalSteps) * 100}%`,
                backgroundColor: isAyush && steps[kioskStep - 1]?.title.includes('AYUSH') ? '#047857' : '#088395'
              }}
              className="h-full transition-all duration-300"
            />
          </div>
        </div>

        {/* Desktop Dynamic Horizontal Stepper (>=640px - 100% Preserved) */}
        <div className="hidden sm:block overflow-x-auto pb-1">
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
                        backgroundColor: isCurrent ? (isAyush && s.title.includes('AYUSH') ? '#047857' : '#088395') : isDone ? '#0f2b48' : '#f1f5f9',
                        color: isCurrent || isDone ? '#ffffff' : '#64748b',
                        borderColor: isCurrent ? (isAyush && s.title.includes('AYUSH') ? '#047857' : '#088395') : isDone ? '#0f2b48' : '#cbd5e1'
                      }}
                      className="w-9 h-9 rounded-2xl border-2 flex items-center justify-center font-bold text-xs shadow-xs"
                    >
                      {isDone ? <Check size={16} strokeWidth={3} /> : <IconComponent size={16} />}
                    </div>
                    <span
                      style={{
                        color: isCurrent ? (isAyush && s.title.includes('AYUSH') ? '#047857' : '#088395') : isDone ? '#0f172a' : '#94a3b8',
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
      <div className="bg-white rounded-3xl p-4 sm:p-8 border border-slate-200 shadow-sm">
        {/* Step 1: Hospital Select */}
        {kioskStep === 1 && <Step1_HospitalSelect />}

        {/* Step 2: Patient Identification */}
        {kioskStep === 2 && <Step1_Identification />}

        {/* Step 3: Language Selection */}
        {kioskStep === 3 && <Step2_Language />}

        {/* Step 4: Informed Consent */}
        {kioskStep === 4 && <Step3_Consent />}

        {/* Step 5: Reason for Visit */}
        {kioskStep === 5 && <Step2_ReasonForVisit />}

        {/* Step 6: Clinical History */}
        {kioskStep === 6 && <Step4_ClinicalHistory />}

        {/* AYUSH Branch: Step 7 is AYUSH History if AYUSH mode */}
        {isAyush && kioskStep === 7 && <Step4_AyushHistory />}

        {/* Red Flags: Step 8 if AYUSH, else Step 7 */}
        {((isAyush && kioskStep === 8) || (!isAyush && kioskStep === 7)) && <Step4_RedFlagAlert />}

        {/* Documents: Step 9 if AYUSH, else Step 8 */}
        {((isAyush && kioskStep === 9) || (!isAyush && kioskStep === 8)) && <Step5_DocUpload />}

        {/* OCR Extraction: Step 10 if AYUSH, else Step 9 */}
        {((isAyush && kioskStep === 10) || (!isAyush && kioskStep === 9)) && <Step6_OcrExtraction />}

        {/* Medical Timeline: Step 11 if AYUSH, else Step 10 */}
        {((isAyush && kioskStep === 11) || (!isAyush && kioskStep === 10)) && <Step6_MedicalTimeline />}

        {/* Review: Step 12 if AYUSH, else Step 11 */}
        {((isAyush && kioskStep === 12) || (!isAyush && kioskStep === 11)) && (
          <Step7_ReviewInformation onJumpToStep={(s) => {
            const mappedStep = s === 1 ? 1 : s === 2 ? 2 : s === 3 ? 6 : s === 4 ? (isAyush ? 7 : 6) : (isAyush ? 9 : 8);
            setKioskStep(mappedStep);
            window.history.pushState({ screen: 'patient', step: mappedStep }, '', getRouteUrl('patient', mappedStep));
          }} />
        )}

        {/* Final Token Receipt: Step 13 if AYUSH, else Step 12 */}
        {((isAyush && kioskStep === 13) || (!isAyush && kioskStep === 12)) && (
          <Step8_SecureSubmit onFinish={onBackToWelcome} />
        )}

        {/* Wizard Bottom Navigation Buttons (Responsive Touch Targets) */}
        {kioskStep < finishStepNum && (
          <div className="no-print flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-slate-200">
            <button
              type="button"
              onClick={handleBack}
              className="w-full sm:w-auto px-6 py-3.5 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={18} />
              <span>{kioskStep === 1 ? 'Cancel' : 'Previous Step'}</span>
            </button>

            {kioskStep < reviewStepNum ? (
              isAyushDepartment && kioskStep === 6 ? (
                <div className="flex flex-col items-stretch sm:items-end gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    style={{
                      backgroundColor: canProceed() ? '#047857' : '#cbd5e1'
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 min-h-[48px] text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 hover:opacity-95 shadow-md cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>Continue to AYUSH</span>
                    <ArrowRight size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipAyush}
                    disabled={!canProceed()}
                    className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-900 font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Skip AYUSH</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  style={{
                    backgroundColor: canProceed() ? '#088395' : '#cbd5e1'
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 min-h-[48px] text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 hover:opacity-95 shadow-md cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>
                    {kioskStep === 4 && !kioskForm.consentAgreed
                      ? 'Consent Required to Proceed'
                      : kioskStep === 1 && !kioskForm.selectedHospitalId
                      ? 'Select a Healthcare Facility'
                      : 'Continue'}
                  </span>
                  <ArrowRight size={18} />
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                style={{ backgroundColor: '#0f2b48' }}
                className="w-full sm:w-auto px-8 py-3.5 min-h-[48px] text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 hover:opacity-90 shadow-md cursor-pointer text-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span>Submitting to {kioskForm.selectedHospitalName || 'Hospital'}...</span>
                  </>
                ) : (
                  <>
                    <span>Submit to {kioskForm.selectedHospitalName || 'Hospital'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
