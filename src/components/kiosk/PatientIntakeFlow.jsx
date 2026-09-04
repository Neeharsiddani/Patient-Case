import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Activity, 
  Heart, 
  Leaf, 
  UploadCloud, 
  CheckCheck, 
  Ticket, 
  ArrowLeft, 
  ArrowRight, 
  ChevronRight, 
  Check, 
  Lock, 
  Loader2 
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { Step1_HospitalSelect } from './Step1_HospitalSelect';
import { Step2_Registration } from './Step2_Registration';
import { Step3_ClinicalIntake } from './Step3_ClinicalIntake';
import { Step4_AyushHistory } from './Step4_AyushHistory';
import { Step_DocumentsUnified } from './Step_DocumentsUnified';
import { Step7_ReviewInformation } from './Step7_ReviewInformation';
import { Step8_SecureSubmit } from './Step8_SecureSubmit';
import { KioskInactivityModal } from '../common/KioskInactivityModal';
import { getRouteUrl } from '../../utils/navigation';

export const PatientIntakeFlow = ({ onBackToWelcome }) => {
  const { kioskStep, setKioskStep, kioskForm, setKioskForm, submitKioskCase, t } = usePatient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if case is directed towards AYUSH / Ayurveda
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

  // Streamlined 6 or 7 Visible Steps Sequence
  const steps = isAyush ? [
    { num: 1, title: t.step1 || 'Hospital', icon: Building2 },
    { num: 2, title: t.step2 || 'Registration', icon: User },
    { num: 3, title: t.step3 || 'Symptoms & History', icon: Heart },
    { num: 4, title: t.stepAyush || 'AYUSH Assessment', icon: Leaf },
    { num: 5, title: t.step4 || 'Documents', icon: UploadCloud },
    { num: 6, title: t.step5 || 'Review & Submit', icon: CheckCheck },
    { num: 7, title: t.step6 || 'Token Slip', icon: Ticket }
  ] : [
    { num: 1, title: t.step1 || 'Hospital', icon: Building2 },
    { num: 2, title: t.step2 || 'Registration', icon: User },
    { num: 3, title: t.step3 || 'Symptoms & History', icon: Heart },
    { num: 4, title: t.step4 || 'Documents', icon: UploadCloud },
    { num: 5, title: t.step5 || 'Review & Submit', icon: CheckCheck },
    { num: 6, title: t.step6 || 'Token Slip', icon: Ticket }
  ];

  const totalSteps = steps.length;
  const reviewStepNum = isAyush ? 6 : 5;
  const finishStepNum = isAyush ? 7 : 6;

  // Form Validation per Step
  const canProceed = () => {
    if (kioskStep === 1) {
      return Boolean(kioskForm.selectedHospitalId);
    }
    if (kioskStep === 2) {
      // Step 2 Registration: Requires valid Identification AND Explicit DPDP Consent
      const hasIdent = Boolean(
        (kioskForm.name && kioskForm.name.trim().length >= 2) ||
        (kioskForm.abhaId && kioskForm.abhaId.length >= 10) ||
        (kioskForm.phone && kioskForm.phone.replace(/\D/g, '').length >= 10) ||
        kioskForm.abhaStatus === 'WALKIN_NO_ABHA'
      );
      return hasIdent && Boolean(kioskForm.consentAgreed);
    }
    if (kioskStep === 3) {
      // Step 3 Clinical Intake: Requires chief complaint / reason for visit
      return Boolean(
        (kioskForm.reasonForVisit && kioskForm.reasonForVisit.trim()) ||
        (kioskForm.chiefComplaints && kioskForm.chiefComplaints.length > 0) ||
        (kioskForm.customComplaint && kioskForm.customComplaint.trim())
      );
    }
    return true;
  };

  const handleNext = async () => {
    if (!canProceed() || isSubmitting) return;

    // If at Step 3 and in an AYUSH department, continue to Step 4 AYUSH
    if (kioskStep === 3 && isAyushDepartment && !kioskForm.skipAyushAssessment) {
      setKioskForm((prev) => ({ ...prev, isAyushCase: true, skipAyushAssessment: false }));
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
    setKioskForm((prev) => ({ ...prev, skipAyushAssessment: true, isAyushCase: false }));
    // Skip AYUSH assessment and advance directly to Documents (Step 4 in standard flow)
    const nextStep = 4;
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

      {/* Top Header Card & Progress Stepper */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={onBackToWelcome}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{t.back || 'Home / Change Role'}</span>
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
                ? `🏥 ${kioskForm.selectedHospitalName} • ${kioskForm.assignedDepartment || kioskForm.selectedDepartmentName || 'General Medicine'}`
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

        {/* Desktop Horizontal Stepper (>=640px) */}
        <div className="hidden sm:block overflow-x-auto pb-1">
          <div className="flex items-center justify-between min-w-[650px] gap-2">
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

        {/* Step 2: Consolidated Registration (Identification + ABHA + Language + Consent) */}
        {kioskStep === 2 && <Step2_Registration />}

        {/* Step 3: Consolidated Clinical Intake (Reason for Visit + Clinical History + Inline Red Flags) */}
        {kioskStep === 3 && <Step3_ClinicalIntake />}

        {/* Step 4 (Conditional): AYUSH Assessment if AYUSH Mode */}
        {isAyush && kioskStep === 4 && <Step4_AyushHistory />}

        {/* Documents Step: Step 5 if AYUSH, else Step 4 */}
        {((isAyush && kioskStep === 5) || (!isAyush && kioskStep === 4)) && (
          <Step_DocumentsUnified />
        )}

        {/* Review Step: Step 6 if AYUSH, else Step 5 */}
        {((isAyush && kioskStep === 6) || (!isAyush && kioskStep === 5)) && (
          <Step7_ReviewInformation onJumpToStep={(targetId) => {
            let targetStep = 1;
            if (targetId === 1) targetStep = 1; // Hospital
            else if (targetId === 2) targetStep = 2; // Registration
            else if (targetId === 3) targetStep = 3; // Symptoms & History
            else if (targetId === 4) targetStep = isAyush ? 4 : 3; // AYUSH
            else if (targetId === 5 || targetId === 6) targetStep = isAyush ? 5 : 4; // Documents
            setKioskStep(targetStep);
            window.history.pushState({ screen: 'patient', step: targetStep }, '', getRouteUrl('patient', targetStep));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} />
        )}

        {/* Token Step: Step 7 if AYUSH, else Step 6 */}
        {((isAyush && kioskStep === 7) || (!isAyush && kioskStep === 6)) && (
          <Step8_SecureSubmit onFinish={onBackToWelcome} />
        )}

        {/* Wizard Bottom Navigation Buttons */}
        {kioskStep < finishStepNum && (
          <div className="no-print flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-slate-200">
            <button
              type="button"
              onClick={handleBack}
              className="w-full sm:w-auto px-6 py-3.5 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={18} />
              <span>{kioskStep === 1 ? (t.cancel || 'Cancel') : (t.back || 'Previous Step')}</span>
            </button>

            {kioskStep < reviewStepNum ? (
              // If at Step 3 and AYUSH department is selected, offer Continue to AYUSH or Skip AYUSH
              (kioskStep === 3 && isAyushDepartment && !kioskForm.skipAyushAssessment) ? (
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
                    <span>{t.continueToAyush || 'Continue to AYUSH'}</span>
                    <ArrowRight size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipAyush}
                    disabled={!canProceed()}
                    className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-900 font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{t.skipAyush || 'Skip AYUSH'}</span>
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
                    {kioskStep === 2 && !kioskForm.consentAgreed
                      ? (t.consentRequiredWarning || 'Consent Required to Proceed')
                      : kioskStep === 1 && !kioskForm.selectedHospitalId
                      ? (t.selectHospitalTitle || 'Select a Healthcare Facility')
                      : (t.next || 'Continue')}
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
                    <span>{t.submittingToHospital || `Submitting to ${kioskForm.selectedHospitalName || 'Hospital'}...`}</span>
                  </>
                ) : (
                  <>
                    <span>{t.submit || `Submit to ${kioskForm.selectedHospitalName || 'Hospital'}`}</span>
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
