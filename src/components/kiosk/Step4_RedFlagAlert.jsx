import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Heart, 
  Wind, 
  Thermometer, 
  CheckCircle2, 
  AlertCircle,
  Volume2
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { AudioPrompt } from '../common/AudioPrompt';
import { TriageBadge } from '../common/TriageBadge';

export const Step4_RedFlagAlert = () => {
  const { kioskForm, setKioskForm, calculateTriage } = usePatient();

  const triage = calculateTriage(kioskForm);
  const combinedFlags = Array.from(new Set([
    ...(Array.isArray(kioskForm.redFlags) ? kioskForm.redFlags : []),
    ...(Array.isArray(triage.redFlags) ? triage.redFlags : [])
  ])).map(f => typeof f === 'string' ? f : (f.titleEn || f.title || String(f)));

  const effectiveTriageLevel = (combinedFlags.length > 0 || (kioskForm.triageLevel && kioskForm.triageLevel <= 2)) 
    ? Math.min(triage.triageLevel, kioskForm.triageLevel || 2) 
    : triage.triageLevel;

  const isHighPriority = effectiveTriageLevel <= 2 || combinedFlags.length > 0;
  const redFlags = combinedFlags;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <ShieldAlert className={isHighPriority ? 'text-red-600' : 'text-cyan-700'} />
            <span>Clinical Risk & Red-Flag Assessment</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Automated priority triage based on your reported symptoms and measured vitals.
          </p>
        </div>
        <AudioPrompt promptText="Please review the clinical priority assessment based on your symptoms." />
      </div>

      {/* Prominent Alert Banner if Red-Flag Detected */}
      {isHighPriority ? (
        <div className="bg-red-50 border-2 border-red-400 p-6 rounded-3xl space-y-3 shadow-md">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-red-600 text-white rounded-2xl flex-shrink-0 mt-0.5">
              <ShieldAlert size={26} />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-red-900 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300">
                High Clinical Priority
              </span>
              <h3 className="text-xl font-extrabold text-red-950 font-heading">
                Urgent attention may be required
              </h3>
              <p className="text-sm text-red-900 font-bold leading-relaxed">
                Please inform hospital staff immediately.
              </p>
              <p className="text-xs text-red-800 leading-relaxed pt-1">
                Your reported symptoms indicate clinical risk factors. Your case has been flagged as <strong>High Priority</strong> in the doctor's queue.
              </p>
            </div>
          </div>

          {/* Red Flag List */}
          <div className="pt-3 border-t border-red-200 space-y-2">
            <span className="text-xs font-bold text-red-950 uppercase tracking-wider block">
              Identified Priority Risk Factors:
            </span>
            <div className="space-y-1.5">
              {redFlags.map((flag, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-red-200 text-xs font-bold text-red-900 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-red-600 flex-shrink-0" />
                  <span>{flag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border-2 border-emerald-300 p-6 rounded-3xl space-y-2 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl flex-shrink-0">
              <ShieldCheck size={26} />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Standard Outpatient Triage
              </span>
              <h3 className="text-lg font-extrabold text-emerald-950 font-heading mt-1">
                No immediate red-flag indicators detected
              </h3>
              <p className="text-xs text-emerald-800 font-medium">
                Your reported complaints are routed as standard outpatient consultation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vital Signs Grid */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Activity size={16} className="text-cyan-700" />
          <span>Recorded Vital Signs</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">BP Systolic</span>
            <span className="text-base font-extrabold text-slate-900">{kioskForm.vitals.bpSystolic} mmHg</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">BP Diastolic</span>
            <span className="text-base font-extrabold text-slate-900">{kioskForm.vitals.bpDiastolic} mmHg</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Heart Rate</span>
            <span className="text-base font-extrabold text-cyan-800">{kioskForm.vitals.pulse} bpm</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">SpO2 Oxygen</span>
            <span className="text-base font-extrabold text-emerald-700">{kioskForm.vitals.spo2}%</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Temperature</span>
            <span className="text-base font-extrabold text-amber-700">{kioskForm.vitals.temp} °F</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Blood Sugar</span>
            <span className="text-base font-extrabold text-purple-800">{kioskForm.vitals.bloodSugar} mg/dL</span>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-slate-400 italic text-center pt-2">
          Note: This risk assessment is for hospital prioritization and triage only. Final medical evaluation is performed by your consulting clinician.
        </p>
      </div>
    </div>
  );
};
