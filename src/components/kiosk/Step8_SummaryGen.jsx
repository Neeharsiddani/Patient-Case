import React from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  Clock, 
  Building2, 
  Stethoscope, 
  CheckCircle, 
  Send,
  AlertCircle
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { TriageBadge } from '../common/TriageBadge';
import { AudioPrompt } from '../common/AudioPrompt';

export const Step8_SummaryGen = () => {
  const { kioskForm, calculateTriage, t, submitKioskCase, setKioskStep } = usePatient();
  
  const { triageLevel, triageCategory, triageColor, redFlags } = calculateTriage(kioskForm);

  const handleSubmit = () => {
    submitKioskCase();
    setKioskStep(9);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-cyan-600" />
            <span>{t.triageTitle}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">{t.triageSub}</p>
        </div>
        <AudioPrompt promptText="Your clinical summary and triage severity have been computed. Please click submit to enter the doctor consultation queue." />
      </div>

      {/* Triage & Priority Allocation Banner */}
      <div 
        style={{
          borderColor: triageColor === 'red' ? '#fca5a5' : triageColor === 'yellow' ? '#fde68a' : '#bbf7d0',
          backgroundColor: triageColor === 'red' ? '#fef2f2' : triageColor === 'yellow' ? '#fffbeb' : '#f0fdf4'
        }}
        className="p-6 rounded-2xl border-2 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.triageLevel}
            </span>
            <div>
              <TriageBadge level={triageLevel} category={triageCategory} color={triageColor} size="lg" />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-xs">
            <Clock size={16} className="text-cyan-700" />
            <span className="text-slate-500">Est. Wait Time:</span>
            <span className="font-bold text-slate-900">
              {triageLevel === 2 ? '0 - 5 Mins (Priority)' : triageLevel === 3 ? '15 - 20 Mins' : '30 - 45 Mins'}
            </span>
          </div>
        </div>

        {/* Red Flags Listing */}
        {redFlags.length > 0 && (
          <div className="bg-red-100/80 border border-red-300 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
              <ShieldAlert size={16} className="text-red-700" />
              <span>{t.redFlagDetected} ({redFlags.length}):</span>
            </div>
            <ul className="space-y-1 text-xs font-semibold text-red-800">
              {redFlags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span>•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* OPD Allocation Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Destination OPD Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="text-cyan-600" size={16} />
            <span>Assigned OPD Department & Doctor</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Specialty / OPD Unit</span>
              <span className="font-bold text-slate-900 text-sm">{kioskForm.assignedDepartment}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Assigned Doctor</span>
                <span className="font-bold text-slate-900">{kioskForm.assignedDoctor}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Consultation Room</span>
                <span className="font-bold text-cyan-800 text-sm">{kioskForm.roomNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SOAP Intake Structured Preview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="text-cyan-600" size={16} />
            <span>Structured SOAP Intake Header</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-cyan-900 block text-[11px]">S (Subjective):</span>
              <p className="text-slate-700 mt-0.5 font-medium">
                {kioskForm.chiefComplaints?.join('; ') || kioskForm.reasonForVisit || 'Not reported'} (Duration: {kioskForm.duration || 'Not reported'}, Pain: {kioskForm.painScore || 0}/10).
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-emerald-900 block text-[11px]">O (Objective):</span>
              <p className="text-slate-700 mt-0.5 font-medium">
                BP: {kioskForm.vitals.bpSystolic}/{kioskForm.vitals.bpDiastolic} mmHg, HR: {kioskForm.vitals.pulse} bpm, SpO2: {kioskForm.vitals.spo2}%, RBS: {kioskForm.vitals.bloodSugar} mg/dL.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submission CTA */}
      <div className="bg-gradient-to-r from-slate-900 to-cyan-950 p-6 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <h4 className="text-lg font-bold">Ready to Generate OPD Slip?</h4>
          <p className="text-xs text-cyan-200 mt-0.5">
            Your electronic case record will be instantly transmitted to the Doctor's Workstation in {kioskForm.roomNumber}.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          style={{ backgroundColor: '#088395' }}
          className="w-full sm:w-auto px-8 py-3.5 text-white font-black text-sm rounded-xl hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Send size={18} />
          <span>{t.submit}</span>
        </button>
      </div>
    </div>
  );
};
