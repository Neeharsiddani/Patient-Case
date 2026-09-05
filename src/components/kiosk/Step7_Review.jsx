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
  CheckCircle2
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { AudioPrompt } from '../common/AudioPrompt';

export const Step7_Review = () => {
  const { kioskForm, setKioskStep, t, language } = usePatient();

  const summarySpeech = `Patient ${kioskForm.name || 'Walk in'}, age ${kioskForm.age || 45}. Chief complaint: ${(kioskForm.chiefComplaints || []).join(', ')}. Duration: ${kioskForm.duration || 'Not specified'}. Blood pressure ${kioskForm.vitals?.bpSystolic || 120} over ${kioskForm.vitals?.bpDiastolic || 80}. Pulse ${kioskForm.vitals?.pulse || 72} beats per minute.`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCheck className="text-cyan-600" />
            <span>{t.reviewTitle}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">{t.reviewSub}</p>
        </div>
        <AudioPrompt promptText={summarySpeech} label={t.listenVoice || 'Listen to Summary'} />
      </div>

      {/* Structured Review Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1: Demographics & ABHA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <User size={16} className="text-cyan-600" />
              <span>Patient Profile & ABHA</span>
            </h3>
            <button
              type="button"
              onClick={() => setKioskStep(1)}
              className="text-xs text-cyan-700 hover:underline flex items-center gap-1 font-semibold"
            >
              <Edit2 size={12} /> Edit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block">Name:</span>
              <span className="font-bold text-slate-800">{kioskForm.name || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Age / Gender:</span>
              <span className="font-bold text-slate-800">{kioskForm.age ? `${kioskForm.age} Y` : 'Not provided'} / {kioskForm.gender || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">ABHA ID:</span>
              <span className="font-mono font-bold text-cyan-800">{kioskForm.abhaId || 'None'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Phone:</span>
              <span className="font-bold text-slate-800">{kioskForm.phone || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Chief Complaints & Symptoms */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity size={16} className="text-cyan-600" />
              <span>Chief Complaints</span>
            </h3>
            <button
              type="button"
              onClick={() => setKioskStep(4)}
              className="text-xs text-cyan-700 hover:underline flex items-center gap-1 font-semibold"
            >
              <Edit2 size={12} /> Edit
            </button>
          </div>

          <div className="space-y-1.5">
            {kioskForm.chiefComplaints.length > 0 ? (
              kioskForm.chiefComplaints.map((c, i) => (
                <div key={i} className="text-xs font-semibold text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  • {c}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No specific complaint selected</p>
            )}
            <div className="flex items-center gap-3 pt-1 text-xs">
              <span className="text-slate-500 font-medium">Duration: <strong>{kioskForm.duration}</strong></span>
              <span className="text-slate-500 font-medium">Pain Score: <strong className="text-cyan-700">{kioskForm.painScore}/10</strong></span>
            </div>
          </div>
        </div>

        {/* Section 3: Vitals Measured */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Heart size={16} className="text-cyan-600" />
              <span>Recorded Vital Signs</span>
            </h3>
            <button
              type="button"
              onClick={() => setKioskStep(4)}
              className="text-xs text-cyan-700 hover:underline flex items-center gap-1 font-semibold"
            >
              <Edit2 size={12} /> Re-measure
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Blood Pressure</span>
              <span className="font-black text-slate-800 text-sm">{kioskForm.vitals.bpSystolic}/{kioskForm.vitals.bpDiastolic}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Heart Rate</span>
              <span className="font-black text-cyan-800 text-sm">{kioskForm.vitals.pulse} bpm</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Oxygen (SpO2)</span>
              <span className="font-black text-emerald-700 text-sm">{kioskForm.vitals.spo2}%</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Temperature</span>
              <span className="font-black text-amber-700 text-sm">{kioskForm.vitals.temp} °F</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Blood Sugar</span>
              <span className="font-black text-purple-800 text-sm">{kioskForm.vitals.bloodSugar} mg/dL</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">BMI</span>
              <span className="font-black text-slate-800 text-sm">{kioskForm.vitals.bmi}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Allergies & Documents */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              <span>Allergies & Medical Records</span>
            </h3>
            <button
              type="button"
              onClick={() => setKioskStep(5)}
              className="text-xs text-cyan-700 hover:underline flex items-center gap-1 font-semibold"
            >
              <Edit2 size={12} /> Edit
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block">Drug Allergies:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {kioskForm.allergies.length > 0 ? (
                  kioskForm.allergies.map((a, i) => (
                    <span key={i} className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200">
                      ⚠️ {a}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 italic text-[11px]">None reported during intake (Clinician verification required)</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block">Uploaded Records:</span>
              <span className="font-semibold text-slate-700">
                {kioskForm.uploadedDocs.length > 0
                  ? `${kioskForm.uploadedDocs.length} Document(s) attached with AI OCR data`
                  : 'No previous physical records attached'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
