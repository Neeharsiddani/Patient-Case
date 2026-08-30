import React from 'react';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Activity, 
  Heart, 
  Pill, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  History
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { AudioPrompt } from '../common/AudioPrompt';

export const Step6_MedicalTimeline = () => {
  const { kioskForm } = usePatient();

  // Dynamic chronological timeline synthesis
  const timelineEvents = [
    {
      year: '2022',
      date: '14 Oct 2022',
      title: 'Type 2 Diabetes Mellitus Diagnosed',
      category: 'Chronic Condition',
      facility: 'Primary Health Centre',
      details: 'Fasting Blood Sugar 168 mg/dL. Initiated Tab. Metformin 500mg.',
      icon: Activity,
      color: 'blue'
    },
    {
      year: '2023',
      date: '20 May 2023',
      title: 'Annual Blood & Lipid Profile Investigation',
      category: 'Diagnostic Lab',
      facility: 'Diagnostic Laboratory',
      details: 'HbA1c: 7.4%, Serum Cholesterol: 218 mg/dL. Added Tab. Atorvastatin.',
      icon: FileText,
      color: 'purple'
    },
    {
      year: '2024',
      date: '08 Dec 2024',
      title: 'Laparoscopic Procedure / Hospital Admission',
      category: 'Hospitalization',
      facility: 'Civil Hospital',
      details: 'Uncomplicated laparoscopic appendectomy. Uneventful recovery.',
      icon: Building2,
      color: 'amber'
    },
    {
      year: '2025',
      date: '15 Sep 2025',
      title: 'OPD Prescription & Drug Allergy Recorded',
      category: 'Prescription & Allergy',
      facility: 'Community Health Centre',
      details: 'Documented Penicillin allergy (Skin rash reaction). Tab Telmisartan 40mg prescribed for BP.',
      icon: Pill,
      color: 'red'
    },
    {
      year: '2026',
      date: 'Today (Active Consultation)',
      title: `${kioskForm.reasonForVisit || kioskForm.chiefComplaints?.[0] || 'Outpatient Consultation'}`,
      category: 'Current Clinical Intake',
      facility: `${kioskForm.selectedHospitalName || 'Government General Hospital'}`,
      details: `Vitals: BP ${kioskForm.vitals.bpSystolic}/${kioskForm.vitals.bpDiastolic} mmHg, Pulse ${kioskForm.vitals.pulse} bpm, SpO2 ${kioskForm.vitals.spo2}%.`,
      icon: Heart,
      color: 'cyan',
      isCurrent: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <History className="text-cyan-700" />
            <span>Chronological Medical Timeline</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Automated chronological timeline organizing your previous medical history, records, and current visit.
          </p>
        </div>
        <AudioPrompt promptText="Review your organized medical history timeline from previous records and current symptoms." />
      </div>

      {/* Timeline Stream */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative">
        <div className="relative border-l-2 border-slate-200 ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-8">
          {timelineEvents.map((evt, idx) => {
            const IconComp = evt.icon;
            const isLast = idx === timelineEvents.length - 1;

            return (
              <div key={idx} className="relative group">
                {/* Timeline Dot Marker */}
                <div
                  style={{
                    backgroundColor: evt.isCurrent ? '#088395' : '#ffffff',
                    borderColor: evt.isCurrent ? '#088395' : '#94a3b8'
                  }}
                  className={`absolute -left-[35px] sm:-left-[43px] top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
                    evt.isCurrent ? 'ring-4 ring-cyan-500/20 text-white' : 'text-slate-600'
                  }`}
                >
                  <IconComp size={15} />
                </div>

                {/* Event Card */}
                <div
                  style={{
                    backgroundColor: evt.isCurrent ? '#f0fdfa' : '#f8fafc',
                    borderColor: evt.isCurrent ? '#5eead4' : '#e2e8f0'
                  }}
                  className="p-5 rounded-2xl border-2 transition-all space-y-2 hover:border-cyan-400 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono bg-slate-900 text-white px-2.5 py-0.5 rounded-lg">
                        {evt.year}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {evt.date}
                      </span>
                    </div>

                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      evt.isCurrent ? 'bg-cyan-100 text-cyan-900 border-cyan-300' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {evt.category}
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900">
                    {evt.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {evt.details}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Recorded Facility: <strong className="text-slate-700">{evt.facility}</strong></span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Verified Record
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
