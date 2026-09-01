import React from 'react';
import { 
  CheckCheck, 
  User, 
  Activity, 
  Heart, 
  AlertTriangle, 
  FileText, 
  Volume2, 
  Edit2, 
  ShieldCheck,
  CheckCircle2,
  Building2,
  Pill,
  History,
  Lock
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { AudioPrompt } from '../common/AudioPrompt';
import { TriageBadge } from '../common/TriageBadge';

export const Step7_ReviewInformation = ({ onJumpToStep }) => {
  const { kioskForm, speakText, calculateTriage } = usePatient();
  const { triageLevel, triageCategory, triageColor, redFlags } = calculateTriage(kioskForm);

  const handleReadBackSummary = () => {
    const speech = `Reviewing intake for ${kioskForm.name || 'Patient'}. Hospital: ${kioskForm.selectedHospitalName}. Reason for visit: ${kioskForm.reasonForVisit || 'General intake'}. Blood pressure: ${kioskForm.vitals.bpSystolic} over ${kioskForm.vitals.bpDiastolic}. Pulse: ${kioskForm.vitals.pulse}.`;
    speakText(speech);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <CheckCheck className="text-cyan-700" />
            <span>Review your information</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Please verify all recorded details before final submission to your hospital care team.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReadBackSummary}
          className="px-4 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
        >
          <Volume2 size={16} />
          <span>🔊 Listen to Summary</span>
        </button>
      </div>

      {/* Structured Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 1. Hospital Facility */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={16} className="text-cyan-700" />
              <span>Selected Healthcare Facility</span>
            </h3>
            <button
              type="button"
              onClick={() => onJumpToStep(1)}
              className="text-xs text-cyan-700 hover:underline flex items-center gap-1 font-bold"
            >
              <Edit2 size={12} /> Edit
            </button>
          </div>

          <div className="space-y-1 text-xs">
            <h4 className="text-sm font-extrabold text-slate-900">
              {kioskForm.selectedHospitalName || 'Selected Healthcare Facility'}
            </h4>
            <p className="text-slate-500">
              Assigned Department: <strong className="text-slate-800">{kioskForm.assignedDepartment || 'General Medicine'}</strong>
            </p>
          </div>
        </div>

        {/* 2. Patient Profile */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-cyan-700" />
              <span>Patient Profile</span>
            </h3>
            <button
              type="button"
              onClick={() => onJumpToStep(2)}
              className="text-xs text-cyan-700 hover:underline flex items-center gap-1 font-bold"
            >
              <Edit2 size={12} /> Edit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block">Name:</span>
              <span className="font-bold text-slate-900">{kioskForm.name || 'Walk-in Patient'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Age / Gender:</span>
              <span className="font-bold text-slate-900">{kioskForm.age ? `${kioskForm.age} Y` : 'Not provided'} / {kioskForm.gender || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Phone:</span>
              <span className="font-bold text-slate-900">{kioskForm.phone || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">ABHA ID:</span>
              <span className="font-mono font-bold text-cyan-900">{kioskForm.abhaId || 'None (Walk-in Registration)'}</span>
            </div>
          </div>
        </div>

        {/* 3. Reason for Visit & Symptoms */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-cyan-700" />
              <span>Reason for Visit & Symptoms</span>
            </h3>
            <button
              type="button"
              onClick={() => onJumpToStep(2)}
              className="text-xs text-cyan-700 hover:underline flex items-center gap-1 font-bold"
            >
              <Edit2 size={12} /> Edit
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
              {kioskForm.reasonForVisit || kioskForm.chiefComplaints?.[0] || 'Outpatient Consultation'}
            </div>

            <div className="flex items-center gap-4 text-slate-600 font-medium">
              <span>Duration: <strong>{kioskForm.duration || 'Not specified'}</strong></span>
              <span>Pain Rating: <strong className="text-cyan-900">{kioskForm.painScore ? `${kioskForm.painScore}/10` : 'Not reported'}</strong></span>
            </div>
          </div>
        </div>

        {/* 4. Vitals & Priority Level */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Heart size={16} className="text-cyan-700" />
              <span>Measured Vitals & Triage</span>
            </h3>
            <TriageBadge level={triageLevel} category={triageCategory} color={triageColor} size="sm" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block">BP</span>
              <span className="font-bold text-slate-900">{kioskForm.vitals.bpSystolic}/{kioskForm.vitals.bpDiastolic}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block">Pulse</span>
              <span className="font-bold text-cyan-900">{kioskForm.vitals.pulse} bpm</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block">SpO2</span>
              <span className="font-bold text-emerald-700">{kioskForm.vitals.spo2}%</span>
            </div>
          </div>
        </div>

        {/* 5. Medical History & Current Medications */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Pill size={16} className="text-cyan-700" />
              <span>Medications & Medical History</span>
            </h3>
            <button
              type="button"
              onClick={() => onJumpToStep(3)}
              className="text-xs text-cyan-700 hover:underline flex items-center gap-1 font-bold"
            >
              <Edit2 size={12} /> Edit
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">Past Conditions:</span>
              <span className="font-semibold text-slate-800">
                {kioskForm.pastConditions.length > 0 ? kioskForm.pastConditions.join(', ') : 'None reported'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-bold">Current Medications:</span>
              <span className="font-semibold text-slate-800">
                {kioskForm.currentMedications.length > 0 ? kioskForm.currentMedications.join(', ') : 'None reported'}
              </span>
            </div>
          </div>
        </div>

        {/* 6. Drug Allergies & Documents */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              <span>Allergies & Attached Documents</span>
            </h3>
            <button
              type="button"
              onClick={() => onJumpToStep(5)}
              className="text-xs text-cyan-700 hover:underline flex items-center gap-1 font-bold"
            >
              <Edit2 size={12} /> Edit
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">Known Allergies:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {kioskForm.allergies.length > 0 ? (
                  kioskForm.allergies.map((a, i) => (
                    <span key={i} className="bg-red-50 text-red-800 font-bold px-2 py-0.5 rounded border border-red-200">
                      ⚠️ {a}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-600">No Known Drug Allergies (NKDA)</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-bold">Attached Medical Records:</span>
              <span className="font-semibold text-slate-700">
                {kioskForm.uploadedDocs.length > 0
                  ? `${kioskForm.uploadedDocs.length} Digital medical record(s) attached`
                  : 'No documents attached'}
              </span>
            </div>
          </div>
        </div>

        {/* 7. AYUSH & Dashavidha Pariksha Summary (When AYUSH department is selected) */}
        {(kioskForm.assignedDepartment?.includes('AYUSH') || kioskForm.assignedDepartment?.includes('Ayurveda') || kioskForm.isAyushCase) && (
          <div className="bg-emerald-50/80 p-5 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-3 md:col-span-2">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                <span>🌿</span>
                <span>Patient-Reported AYUSH & Dashavidha Pariksha Summary</span>
              </h3>
              <button
                type="button"
                onClick={() => onJumpToStep(4)}
                className="text-xs text-emerald-800 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <Edit2 size={12} /> Edit AYUSH Details
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-slate-500 font-bold block">Physical Frame (Prakriti):</span>
                <span className="font-bold text-emerald-950">
                  {kioskForm.ayushHistory?.dashavidhaPariksha?.prakriti?.bodyFrame || 'Not assessed'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-slate-500 font-bold block">Thermal Preference:</span>
                <span className="font-bold text-emerald-950">
                  {kioskForm.ayushHistory?.dashavidhaPariksha?.prakriti?.thermalPreference || 'Not assessed'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-slate-500 font-bold block">Digestive Fire (Agni):</span>
                <span className="font-bold text-emerald-950">
                  {kioskForm.ayushHistory?.additionalHistory?.agni || 'Not assessed'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-slate-500 font-bold block">Bowel Habit (Koshtha):</span>
                <span className="font-bold text-emerald-950">
                  {kioskForm.ayushHistory?.additionalHistory?.koshtha || 'Not assessed'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-slate-500 font-bold block">Tissue Vitality (Sara):</span>
                <span className="font-bold text-emerald-950">
                  {kioskForm.ayushHistory?.dashavidhaPariksha?.sara?.overallVitality || 'Not assessed'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-slate-500 font-bold block">Mental Resilience (Sattva):</span>
                <span className="font-bold text-emerald-950">
                  {kioskForm.ayushHistory?.dashavidhaPariksha?.sattva?.mentalResilience || 'Not assessed'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-200 md:col-span-2">
                <span className="text-[10px] text-slate-500 font-bold block">Active Imbalances & Symptoms (Vikriti):</span>
                <span className="font-semibold text-emerald-950">
                  {kioskForm.ayushHistory?.dashavidhaPariksha?.vikriti?.primaryImbalanceSymptoms?.length > 0
                    ? kioskForm.ayushHistory.dashavidhaPariksha.vikriti.primaryImbalanceSymptoms.join(', ')
                    : 'None reported'}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
