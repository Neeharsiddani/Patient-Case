import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Printer, 
  QrCode, 
  X, 
  Stethoscope, 
  Calendar,
  Clock
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';

export const PrintableOpdSlip = ({ patient, onClose }) => {
  const { t } = usePatient();
  if (!patient) return null;

  const notes = patient.doctorNotes || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-8 relative flex flex-col">
        {/* Top Floating Action Bar (hidden when printing) */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-cyan-400" />
            <span className="text-xs font-bold">Official ABDM OPD Consultation Slip Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              style={{ backgroundColor: '#088395' }}
              className="px-4 py-1.5 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Printer size={14} />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Hospital Document Body */}
        <div id="printable-opd-slip" className="p-8 space-y-6 text-slate-900 bg-white">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow">
                🏥
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                  Government of India • Ministry of Health & Family Welfare
                </p>
                <h1 className="text-xl font-extrabold text-slate-900">
                  {t.hospitalName}
                </h1>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  Ayushman Bharat Digital Mission (ABDM) • Outpatient Department (OPD)
                </p>
                <p className="text-[11px] text-slate-500">
                  {patient.department} • {patient.roomNumber}
                </p>
              </div>
            </div>

            {/* QR & Token # */}
            <div className="text-right space-y-1">
              <div className="bg-slate-100 border border-slate-300 px-3 py-1 rounded-xl text-center inline-block">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">OPD Token</span>
                <span className="text-lg font-black font-mono text-cyan-900">{patient.tokenNumber}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Date: {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          {/* Patient Info Strip */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Patient Name:</span>
              <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Age / Gender:</span>
              <span className="font-bold text-slate-900">{patient.age} Y / {patient.gender}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">14-Digit ABHA ID:</span>
              <span className="font-mono font-bold text-cyan-800">{patient.abhaId}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Mobile / Phone:</span>
              <span className="font-bold text-slate-900">{patient.phone}</span>
            </div>
          </div>

          {/* Vitals Recorded at Kiosk */}
          <div className="border border-slate-200 rounded-xl p-3 grid grid-cols-5 gap-2 text-center text-xs bg-slate-50/50">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">BP</span>
              <span className="font-bold text-slate-900">{patient.vitals.bpSystolic}/{patient.vitals.bpDiastolic} mmHg</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Pulse</span>
              <span className="font-bold text-slate-900">{patient.vitals.pulse} bpm</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">SpO2</span>
              <span className="font-bold text-slate-900">{patient.vitals.spo2}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Temp</span>
              <span className="font-bold text-slate-900">{patient.vitals.temp} °F</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Blood Sugar</span>
              <span className="font-bold text-slate-900">{patient.vitals.bloodSugar} mg/dL</span>
            </div>
          </div>

          {/* Chief Complaints & Clinical Findings */}
          <div className="space-y-1 text-xs">
            <span className="font-bold text-slate-700 block uppercase text-[11px]">Chief Complaints (HPI):</span>
            <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-medium">
              {patient.chiefComplaints?.join('; ') || 'General evaluation'} (Duration: {patient.duration || '2 Days'}, Pain: {patient.painScore || 5}/10).
            </p>
          </div>

          {/* Provisional Diagnosis & ICD-10 */}
          <div className="space-y-1 text-xs">
            <span className="font-bold text-slate-700 block uppercase text-[11px]">Diagnosis & ICD-10:</span>
            <div className="p-2.5 bg-cyan-50/60 rounded-lg border border-cyan-200 flex items-center justify-between">
              <span className="font-bold text-cyan-950 text-sm">
                {notes.provisionalDiagnosis || 'Clinical Assessment Recorded'}
              </span>
              {notes.icd10 && notes.icd10.length > 0 && (
                <div className="flex gap-1">
                  {notes.icd10.map((code) => (
                    <span key={code} className="bg-cyan-800 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                      ICD-10: {code}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prescription (Rx) Table */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span className="text-lg font-serif italic text-cyan-800 font-black">℞</span>
              <span>Prescription / Medications:</span>
            </span>

            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Medicine Name & Strength</th>
                  <th className="p-2.5">Dosage / Frequency</th>
                  <th className="p-2.5">Duration</th>
                  <th className="p-2.5">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notes.prescriptions && notes.prescriptions.length > 0 ? (
                  notes.prescriptions.map((p, idx) => (
                    <tr key={idx} className="font-medium">
                      <td className="p-2.5 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">{p.name} ({p.strength})</td>
                      <td className="p-2.5 font-mono text-cyan-900">{p.freq}</td>
                      <td className="p-2.5">{p.duration}</td>
                      <td className="p-2.5 text-slate-600">{p.instructions}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-slate-400">
                      Standard lifestyle advice and observation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Investigations Ordered */}
          {notes.investigations && notes.investigations.length > 0 && (
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-700 block uppercase text-[11px]">Lab & Diagnostic Investigations Ordered:</span>
              <div className="flex flex-wrap gap-1.5">
                {notes.investigations.map((test, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-800 font-semibold px-2.5 py-1 rounded-md border border-slate-200">
                    🔬 {test}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Doctor Advice & Follow-Up */}
          <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-200">
            <div>
              <span className="font-bold text-slate-700 block uppercase text-[10px]">Advice & Lifestyle:</span>
              <p className="text-slate-800 mt-0.5 font-medium">{notes.advice || 'Low salt diet, adequate hydration, avoid strenuous activity.'}</p>
            </div>
            <div>
              <span className="font-bold text-slate-700 block uppercase text-[10px]">Follow-Up Date:</span>
              <p className="text-slate-900 mt-0.5 font-bold">{notes.followUp || 'After 7 Days (OPD Review)'}</p>
            </div>
          </div>

          {/* Doctor Signature & OPD Stamp */}
          <div className="pt-6 flex items-end justify-between border-t-2 border-dashed border-slate-300">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-xl border border-slate-200">
                <QrCode size={42} className="text-slate-900" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                <span>ABDM-SIGNED-CONSULT-RECORD</span><br />
                <span>NHA-AUTH-ID: #99482910</span>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="font-script text-lg text-cyan-900 font-serif italic">
                Dr. R. Sharma
              </div>
              <p className="text-xs font-bold text-slate-900">{patient.assignedDoctor}</p>
              <p className="text-[10px] text-slate-500">Medical Council Reg: MCI/DMC-74892</p>
              <p className="text-[10px] text-slate-400">{patient.department}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
