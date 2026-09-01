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

  // Dynamic chronological timeline synthesized strictly from patient data & genuine uploaded records
  const timelineEvents = React.useMemo(() => {
    const events = [];

    // 1. Current Active Consultation (Top Event)
    events.push({
      year: '2026',
      date: 'Today (Active Consultation)',
      title: `${kioskForm.reasonForVisit || kioskForm.chiefComplaints?.[0] || 'Outpatient Consultation'}`,
      category: 'Current Clinical Intake',
      facility: `${kioskForm.selectedHospitalName || 'Selected Healthcare Facility'}`,
      details: `Vitals: BP ${kioskForm.vitals.bpSystolic}/${kioskForm.vitals.bpDiastolic} mmHg, Pulse ${kioskForm.vitals.pulse} bpm, SpO2 ${kioskForm.vitals.spo2}%.`,
      icon: Heart,
      color: 'cyan',
      isCurrent: true,
      verified: false
    });

    // 2. Genuine Uploaded Medical Documents
    if (kioskForm.uploadedDocs && kioskForm.uploadedDocs.length > 0) {
      kioskForm.uploadedDocs.forEach((doc) => {
        events.push({
          year: doc.year || (doc.date ? doc.date.split(/[\/\-\.]/)[2] : 'Recent'),
          date: doc.date || 'Digitized Document',
          title: doc.title,
          category: doc.typeName || doc.type || 'Medical Record',
          facility: doc.hospital || doc.hospitalName || 'Healthcare Facility',
          details: doc.diagnosis ? `Impression/Diagnosis: ${doc.diagnosis}` : (doc.rawOcrText ? doc.rawOcrText.slice(0, 120) + '...' : 'Digitized clinical record.'),
          icon: doc.type === 'prescription' ? Pill : doc.type === 'lab_report' ? FileText : Building2,
          color: doc.type === 'prescription' ? 'blue' : 'amber',
          isCurrent: false,
          verified: doc.verificationStatus === 'VERIFIED_BY_CLINICIAN'
        });
      });
    }

    // 3. Patient-Reported Past Conditions
    if (kioskForm.pastConditions && kioskForm.pastConditions.length > 0) {
      kioskForm.pastConditions.forEach((cond) => {
        events.push({
          year: 'History',
          date: 'Patient Reported',
          title: `Pre-existing Condition: ${cond}`,
          category: 'Medical History',
          facility: 'Patient Reported at Intake',
          details: `Patient noted ongoing or previous diagnosis of ${cond}.`,
          icon: Activity,
          color: 'purple',
          isCurrent: false,
          verified: false
        });
      });
    }

    // 4. Patient-Reported Known Allergies
    if (kioskForm.allergies && kioskForm.allergies.length > 0) {
      events.push({
        year: 'Allergy',
        date: 'Patient Reported',
        title: `Documented Allergies: ${kioskForm.allergies.join(', ')}`,
        category: 'Allergy Record',
        facility: 'Patient Reported at Intake',
        details: 'Adverse reactions noted for clinical care team safety.',
        icon: Pill,
        color: 'red',
        isCurrent: false,
        verified: false
      });
    }

    return events;
  }, [kioskForm]);

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
      <div className="bg-white p-4 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative">
        <div className="relative border-l-2 border-slate-200 ml-3 sm:ml-6 pl-4 sm:pl-8 space-y-6 sm:space-y-8">
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
                  className={`absolute -left-[29px] sm:-left-[43px] top-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
                    evt.isCurrent ? 'ring-4 ring-cyan-500/20 text-white' : 'text-slate-600'
                  }`}
                >
                  <IconComp size={14} />
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
                    <span>
                      {evt.isCurrent ? (
                        <span className="text-cyan-700 font-bold flex items-center gap-1">
                          <Clock size={12} /> Active Case
                        </span>
                      ) : evt.verified ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Verified Record
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> Unverified Intake Record
                        </span>
                      )}
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
