import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Plus, 
  Trash2, 
  FileCheck, 
  Sparkles, 
  CheckCircle2, 
  FlaskConical, 
  Calendar, 
  Printer, 
  Stethoscope, 
  Tag,
  AlertTriangle
} from 'lucide-react';
import { 
  icd10Suggestions, 
  commonHospitalDrugs, 
  commonDiagnosticTests 
} from '../../data/symptomsData';
import { usePatient } from '../../context/PatientContext';

export const PrescriptionEditor = ({ patient, onSaveAndPrint }) => {
  const { updateDoctorNotes } = usePatient();

  const [diagnosis, setDiagnosis] = useState('');
  const [selectedIcd, setSelectedIcd] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [doctorAdvice, setDoctorAdvice] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [allergyNotice, setAllergyNotice] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Drug entry fields
  const [selectedDrug, setSelectedDrug] = useState(commonHospitalDrugs[0].name);
  const [strength, setStrength] = useState(commonHospitalDrugs[0].strength);
  const [freq, setFreq] = useState(commonHospitalDrugs[0].freq);
  const [duration, setDuration] = useState(commonHospitalDrugs[0].duration);
  const [instructions, setInstructions] = useState(commonHospitalDrugs[0].instructions);

  useEffect(() => {
    if (!patient) return;

    // Load persisted clinician-created notes if present; otherwise, start completely empty.
    const existingNotes = patient.doctorNotes || {};
    const existingPrescriptions = Array.isArray(existingNotes.prescriptions) && existingNotes.prescriptions.length > 0
      ? existingNotes.prescriptions
      : (Array.isArray(patient.prescriptions) && patient.prescriptions.length > 0 ? patient.prescriptions : []);

    const existingIcd = Array.isArray(existingNotes.icd10) && existingNotes.icd10.length > 0
      ? existingNotes.icd10
      : (Array.isArray(patient.icd10) ? patient.icd10 : []);

    const existingTests = Array.isArray(existingNotes.investigations) && existingNotes.investigations.length > 0
      ? existingNotes.investigations
      : (Array.isArray(patient.investigations) ? patient.investigations : []);

    setDiagnosis(existingNotes.provisionalDiagnosis || patient.provisionalDiagnosis || '');
    setSelectedIcd(existingIcd);
    setPrescriptions(existingPrescriptions);
    setSelectedTests(existingTests);
    setDoctorAdvice(existingNotes.advice || patient.doctorAdvice || '');
    setFollowUp(existingNotes.followUp || patient.followUp || '');
  }, [patient?.id]);

  const handleToggleIcd = (code) => {
    setSelectedIcd((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleToggleTest = (test) => {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  const handleDrugDropdownChange = (e) => {
    const drugName = e.target.value;
    setSelectedDrug(drugName);
    const found = commonHospitalDrugs.find((d) => d.name === drugName);
    if (found) {
      setStrength(found.strength);
      setFreq(found.freq);
      setDuration(found.duration);
      setInstructions(found.instructions);
    }
  };

  const handleAddDrug = (medication = null) => {
    const drugToAdd = (medication && medication.name) ? {
      name: medication.name,
      strength: medication.strength || '',
      freq: medication.freq || '1-0-1 (After Food)',
      duration: medication.duration || '5 days',
      instructions: medication.instructions || ''
    } : {
      name: selectedDrug?.trim() || '',
      strength: strength?.trim() || '',
      freq: freq?.trim() || '',
      duration: duration?.trim() || '',
      instructions: instructions?.trim() || ''
    };

    if (!drugToAdd.name) return;

    // Check allergy contraindication!
    const isPenicillinAllergic = patient?.allergies?.some((a) =>
      a.toLowerCase().includes('penicillin') || a.toLowerCase().includes('amoxicillin')
    );
    if (isPenicillinAllergic && drugToAdd.name.toLowerCase().includes('amoxicillin')) {
      setAllergyNotice('⚠️ CONTRAINDICATION ALERT: Patient has a recorded severe allergy to Penicillin / Amoxicillin!');
      return;
    }

    setAllergyNotice(null);
    setPrescriptions((prev) => [...prev, drugToAdd]);
  };

  const handleRemoveDrug = (index) => {
    setPrescriptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveConsultation = (andPrint = false) => {
    const updatedNotes = {
      provisionalDiagnosis: diagnosis.trim(),
      icd10: selectedIcd,
      prescriptions,
      investigations: selectedTests,
      advice: doctorAdvice.trim(),
      followUp: followUp.trim()
    };

    updateDoctorNotes(patient.id, updatedNotes, true);

    if (andPrint && onSaveAndPrint) {
      onSaveAndPrint();
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Provisional Diagnosis & ICD-10 Suggestions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Stethoscope size={14} className="text-cyan-700" />
          <span>Clinical Assessment & Differential Diagnosis</span>
        </h4>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Provisional Diagnosis / Clinical Impression:
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Acute Coronary Syndrome, Grade 2 Essential HTN..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:border-cyan-600 outline-none"
          />
        </div>

        {/* Quick ICD-10 Tag Selector */}
        <div>
          <span className="text-[11px] font-bold text-slate-500 block mb-1.5 flex items-center gap-1">
            <Tag size={12} />
            <span>Standard ICD-10 Classification Tags:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {icd10Suggestions.map((item) => {
              const isSelected = selectedIcd.includes(item.code);
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleToggleIcd(item.code)}
                  style={{
                    backgroundColor: isSelected ? '#0A4D68' : '#f8fafc',
                    borderColor: isSelected ? '#0A4D68' : '#cbd5e1',
                    color: isSelected ? '#ffffff' : '#334155'
                  }}
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all shadow-sm"
                >
                  <span className="font-mono">{item.code}</span>: {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Interactive e-Prescription (Rx) Builder */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Pill size={14} className="text-cyan-700" />
            <span>e-Prescription Formulary (Rx)</span>
          </h4>
          <span className="text-xs text-cyan-800 font-bold">
            {prescriptions.length} Drug(s) Prescribed
          </span>
        </div>

        {/* Drug Input Row */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Select / Type Drug Name</label>
              <select
                value={selectedDrug}
                onChange={handleDrugDropdownChange}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none"
              >
                {commonHospitalDrugs.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.strength})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Strength</label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Frequency</label>
              <input
                type="text"
                value={freq}
                onChange={(e) => setFreq(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Special instructions (e.g. Take after breakfast)..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none"
            />
            <button
              type="button"
              onClick={() => handleAddDrug()}
              style={{ backgroundColor: '#088395' }}
              className="px-5 py-2 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Medication</span>
            </button>
          </div>
        </div>

        {/* Optional Hospital Formulary Quick-Add (Explicit Add button only) */}
        <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <Tag size={13} className="text-cyan-700" />
              <span>Common Hospital Formulary Quick-Add:</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Click "+ Add" to explicitly prescribe
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {commonHospitalDrugs.map((d) => (
              <button
                key={d.name}
                type="button"
                onClick={() => handleAddDrug(d)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-cyan-50 hover:border-cyan-400 text-slate-800 text-[11px] font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-2xs group"
              >
                <span>{d.name} <span className="text-slate-500 font-normal">({d.strength})</span></span>
                <span className="text-cyan-700 group-hover:text-cyan-800 font-extrabold flex items-center gap-0.5 text-[10px] bg-cyan-50 group-hover:bg-cyan-100 px-1.5 py-0.5 rounded-md border border-cyan-200 transition-colors">
                  <Plus size={10} strokeWidth={3} /> Add
                </span>
              </button>
            ))}
          </div>
        </div>

        {allergyNotice && (
          <div className="p-3 bg-red-50 border border-red-300 text-red-900 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn">
            <span>{allergyNotice}</span>
            <button
              type="button"
              onClick={() => setAllergyNotice(null)}
              className="text-red-600 hover:text-red-900 text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Prescription Table or Clean Empty State */}
        {prescriptions.length === 0 ? (
          <div className="p-6 sm:p-8 bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Pill size={22} />
            </div>
            <h5 className="text-xs font-bold text-slate-800">No Medications Prescribed Yet</h5>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
              This consultation currently has 0 active medication orders. Select a drug from the formulary row above and click <strong>"Add Medication"</strong>, or click <strong>"+ Add"</strong> on any formulary item to prescribe.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Medicine Name & Strength</th>
                  <th className="p-3">Dose Frequency</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Instructions</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescriptions.map((drug, index) => (
                  <tr key={index} className="hover:bg-slate-50 font-medium">
                    <td className="p-3 font-bold text-slate-400">{index + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{drug.name} <span className="text-cyan-700 font-semibold">({drug.strength})</span></td>
                    <td className="p-3 text-slate-700 font-mono">{drug.freq}</td>
                    <td className="p-3 text-slate-700">{drug.duration}</td>
                    <td className="p-3 text-slate-500 text-[11px]">{drug.instructions}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveDrug(index)}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                        title="Remove prescription"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Diagnostic Investigation Requisitions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <FlaskConical size={14} className="text-cyan-700" />
          <span>Diagnostic Lab Orders & Investigations</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {commonDiagnosticTests.map((test) => {
            const isOrdered = selectedTests.includes(test);
            return (
              <button
                key={test}
                type="button"
                onClick={() => handleToggleTest(test)}
                style={{
                  backgroundColor: isOrdered ? '#ecfeff' : '#f8fafc',
                  borderColor: isOrdered ? '#088395' : '#cbd5e1',
                  color: isOrdered ? '#088395' : '#334155'
                }}
                className="p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-start gap-2 shadow-sm"
              >
                <div
                  style={{
                    backgroundColor: isOrdered ? '#088395' : '#ffffff',
                    borderColor: isOrdered ? '#088395' : '#94a3b8'
                  }}
                  className="w-4 h-4 rounded border flex items-center justify-center text-white text-[10px] mt-0.5 flex-shrink-0"
                >
                  {isOrdered && '✓'}
                </div>
                <span className="line-clamp-2">{test}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Doctor Advice & Follow-Up */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-slate-700">Doctor's Advice & Lifestyle Restrictions:</label>
          <textarea
            rows={2}
            value={doctorAdvice}
            onChange={(e) => setDoctorAdvice(e.target.value)}
            placeholder="e.g. Low salt diet, regular monitoring of BP, avoid strenuous exercises..."
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white outline-none"
          />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-slate-700">Follow-Up Review:</label>
          <input
            type="text"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            placeholder="e.g. After 7 Days"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white outline-none"
          />
          <div className="pt-2">
            <span className="text-[10px] text-slate-400 block">Consulting Doctor:</span>
            <span className="text-xs font-bold text-slate-900">{patient.assignedDoctor}</span>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>Consultation note and e-prescription successfully saved to patient medical record!</span>
        </div>
      )}

      {/* Bottom Save / Print Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900 text-white rounded-3xl shadow-xl">
        <div>
          <h5 className="text-sm font-bold">Complete OPD Consultation</h5>
          <p className="text-xs text-slate-400">Save prescription notes, update patient record, and generate official OPD slip.</p>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => handleSaveConsultation(false)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>Save Note</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveConsultation(true)}
            style={{ backgroundColor: '#088395' }}
            className="px-6 py-2.5 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg hover:opacity-90 transition-all"
          >
            <Printer size={16} />
            <span>Sign & Print OPD Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
