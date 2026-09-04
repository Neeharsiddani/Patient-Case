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
  AlertTriangle,
  X,
  RotateCcw,
  Sparkle,
  Leaf
} from 'lucide-react';
import { 
  icd10Suggestions, 
  commonHospitalDrugs, 
  commonDiagnosticTests 
} from '../../data/symptomsData';
import { usePatient } from '../../context/PatientContext';

// Classical Ayurvedic formulary suggestions for AYUSH / AIIA Outpatient Consultations
export const ayushHospitalDrugs = [
  { name: 'Tab. Ashwagandha Ghanvati', strength: '250 mg', freq: '1-0-1 (After Meals)', duration: '15 days', instructions: 'With warm water or milk' },
  { name: 'Triphala Churna', strength: '3 gm', freq: '0-0-1 (Bedtime)', duration: '15 days', instructions: 'With Ushnajala (warm water)' },
  { name: 'Tab. Sudarshan Ghanvati', strength: '500 mg', freq: '1-0-1 (After Meals)', duration: '5 days', instructions: 'For Jwara (fever) and malaise with warm water' },
  { name: 'Syp. Dashamoolarishta', strength: '20 ml', freq: '1-0-1 (After Meals)', duration: '15 days', instructions: 'Mix with equal quantity of warm water' },
  { name: 'Tab. Brahmi Vati', strength: '250 mg', freq: '1-0-1 (Morning & Evening)', duration: '14 days', instructions: 'For Shiroruka (Headache) and mental calm' },
  { name: 'Yashtimadhu Churna', strength: '2 gm', freq: '1-0-1 (Before Food)', duration: '7 days', instructions: 'Take with honey or warm milk' }
];

export const PrescriptionEditor = ({ patient, onSaveAndPrint }) => {
  const { updateDoctorNotes, authenticatedUser } = usePatient();

  const [diagnosis, setDiagnosis] = useState('');
  const [selectedIcd, setSelectedIcd] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [doctorAdvice, setDoctorAdvice] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [allergyNotice, setAllergyNotice] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // Drug entry fields
  const isAyushCase = Boolean(
    patient?.isAyushCase ||
    patient?.department?.toLowerCase().includes('ayush') ||
    patient?.department?.toLowerCase().includes('ayurved') ||
    patient?.department_id?.includes('ayush')
  );

  const formularyList = isAyushCase ? ayushHospitalDrugs : commonHospitalDrugs;

  const [selectedDrug, setSelectedDrug] = useState(formularyList[0]?.name || '');
  const [isCustomDrug, setIsCustomDrug] = useState(false);
  const [customDrugName, setCustomDrugName] = useState('');
  const [strength, setStrength] = useState(formularyList[0]?.strength || '');
  const [freq, setFreq] = useState(formularyList[0]?.freq || '');
  const [duration, setDuration] = useState(formularyList[0]?.duration || '');
  const [instructions, setInstructions] = useState(formularyList[0]?.instructions || '');

  // Synchronize with authoritative patient record on selection change
  useEffect(() => {
    if (!patient) return;

    const existingNotes = patient.doctorNotes || {};

    // Filter out legacy placeholder strings
    const rawDiag = existingNotes.provisionalDiagnosis || patient.provisionalDiagnosis || '';
    const cleanDiag = (rawDiag !== 'Clinical Assessment Recorded' && rawDiag !== 'Clinical History Verified' && rawDiag !== 'Digitized clinical record')
      ? rawDiag.trim()
      : '';

    const existingPrescriptions = Array.isArray(existingNotes.prescriptions) && existingNotes.prescriptions.length > 0
      ? existingNotes.prescriptions
      : (Array.isArray(patient.prescriptions) && patient.prescriptions.length > 0 ? patient.prescriptions : []);

    const existingIcd = Array.isArray(existingNotes.icd10) && existingNotes.icd10.length > 0
      ? existingNotes.icd10
      : (Array.isArray(patient.icd10) && patient.icd10.length > 0 ? patient.icd10 : []);

    const existingTests = Array.isArray(existingNotes.investigations) && existingNotes.investigations.length > 0
      ? existingNotes.investigations
      : (Array.isArray(patient.investigations) && patient.investigations.length > 0 ? patient.investigations : []);

    setDiagnosis(cleanDiag);
    setSelectedIcd(existingIcd);
    setPrescriptions(existingPrescriptions);
    setSelectedTests(existingTests);
    setDoctorAdvice(existingNotes.advice || patient.doctorAdvice || '');
    setFollowUp(existingNotes.followUp || patient.followUp || '');
    setAllergyNotice(null);
    setSaveSuccess(null);
  }, [patient?.id]);

  const handleToggleIcd = (code) => {
    setSelectedIcd((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleClearAllIcd = () => {
    setSelectedIcd([]);
  };

  const handleToggleTest = (test) => {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  const handleDrugDropdownChange = (e) => {
    const val = e.target.value;
    if (val === '__CUSTOM__') {
      setIsCustomDrug(true);
      setSelectedDrug('__CUSTOM__');
      setStrength('');
      setFreq(isAyushCase ? '1-0-1 (After Meals)' : '1-0-1 (After Food)');
      setDuration('7 days');
      setInstructions('');
      return;
    }

    setIsCustomDrug(false);
    setSelectedDrug(val);
    const found = formularyList.find((d) => d.name === val);
    if (found) {
      setStrength(found.strength);
      setFreq(found.freq);
      setDuration(found.duration);
      setInstructions(found.instructions);
    }
  };

  const handleAddDrug = (medication = null) => {
    let drugToAdd = null;

    if (medication && medication.name) {
      drugToAdd = {
        name: medication.name,
        strength: medication.strength || '',
        freq: medication.freq || '1-0-1 (After Food)',
        duration: medication.duration || '5 days',
        instructions: medication.instructions || ''
      };
    } else {
      const finalName = isCustomDrug ? customDrugName.trim() : selectedDrug?.trim();
      drugToAdd = {
        name: finalName || '',
        strength: strength?.trim() || '',
        freq: freq?.trim() || '',
        duration: duration?.trim() || '',
        instructions: instructions?.trim() || ''
      };
    }

    if (!drugToAdd.name) {
      setAllergyNotice('⚠️ Please enter or select a valid medication name.');
      return;
    }

    // 1. Accidental duplicate medication prevention
    const isDuplicate = prescriptions.some(
      (p) => p.name.toLowerCase().trim() === drugToAdd.name.toLowerCase().trim()
    );
    if (isDuplicate) {
      setAllergyNotice(`⚠️ Medication "${drugToAdd.name}" is already in this prescription list.`);
      return;
    }

    // 2. Allergy contraindication check
    const isPenicillinAllergic = patient?.allergies?.some((a) =>
      a.toLowerCase().includes('penicillin') || a.toLowerCase().includes('amoxicillin')
    );
    if (isPenicillinAllergic && drugToAdd.name.toLowerCase().includes('amoxicillin')) {
      setAllergyNotice('⚠️ CONTRAINDICATION ALERT: Patient has a recorded severe allergy to Penicillin / Amoxicillin!');
      return;
    }

    setAllergyNotice(null);
    setPrescriptions((prev) => [...prev, drugToAdd]);

    // Reset custom inputs if used
    if (isCustomDrug) {
      setCustomDrugName('');
    }
  };

  const handleRemoveDrug = (index) => {
    setPrescriptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveConsultation = async (finalize = false) => {
    if (isSaving || isSigning) return;

    if (finalize) {
      setIsSigning(true);
    } else {
      setIsSaving(true);
    }

    const cleanDiag = diagnosis.trim();
    const updatedNotes = {
      provisionalDiagnosis: (cleanDiag && cleanDiag !== 'Clinical Assessment Recorded' && cleanDiag !== 'Clinical History Verified') ? cleanDiag : '',
      icd10: selectedIcd,
      prescriptions,
      investigations: selectedTests,
      advice: doctorAdvice.trim(),
      followUp: followUp.trim(),
      doctorName: authenticatedUser?.fullName || patient?.assignedDoctor || 'Attending Clinician'
    };

    try {
      await updateDoctorNotes(patient.id, updatedNotes, finalize);

      if (finalize && onSaveAndPrint) {
        onSaveAndPrint();
      } else {
        setSaveSuccess('Consultation note successfully saved as draft to patient record.');
        setTimeout(() => setSaveSuccess(null), 3500);
      }
    } catch (err) {
      setAllergyNotice('Save Error: ' + (err.message || 'Could not persist notes.'));
    } finally {
      setIsSaving(false);
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AYUSH / AIIA Outpatient Mode Banner if applicable */}
      {isAyushCase && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-xs space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
            <Leaf size={18} className="text-emerald-700" />
            <span>AYUSH / Ayurveda Outpatient Consultation Mode</span>
          </div>
          <p className="text-emerald-800 leading-relaxed font-medium">
            Patient registered in <strong>{patient.department}</strong>. Comprehensive Ayurvedic Clinical Assessment (Dashavidha Pariksha, Prakriti, and Vikriti) is preserved in the Clinical Summary tab. Standard ICD-10 tags below are optional references; classical Ayurvedic diagnoses and customized herbal formulations (Vati, Churna, Asava, Taila) can be entered directly below. Specialized NAMASTE / WHO ICD-11 TM2 module integration is in advisory readiness.
          </p>
        </div>
      )}

      {/* 1. Provisional Diagnosis & ICD-10 Suggestions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Stethoscope size={14} className="text-cyan-700" />
            <span>Clinical Assessment & Provisional Diagnosis</span>
          </h4>
          <span className="text-[11px] font-semibold text-slate-400">
            Clinician Manual Entry Required
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Provisional Diagnosis / Clinical Impression:
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder={isAyushCase ? "e.g. Vataja Shirashoola, Kaphaja Jwara, Amavata..." : "e.g. Acute Febrile Illness, Tension-type Headache, Acute Gastritis..."}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:border-cyan-600 outline-none transition-colors"
          />
          <div className="mt-1.5 flex items-center justify-between text-[11px]">
            {diagnosis.trim() ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Recorded Diagnosis: "{diagnosis.trim()}"</span>
              </span>
            ) : (
              <span className="text-slate-400 italic">
                No diagnosis entered yet — field remains empty unless explicitly recorded by attending doctor.
              </span>
            )}
          </div>
        </div>

        {/* Quick ICD-10 Tag Selector */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Tag size={12} className="text-cyan-700" />
              <span>Standard ICD-10 Classification Tags:</span>
            </span>
            {selectedIcd.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllIcd}
                className="text-[10px] text-slate-500 hover:text-red-600 underline font-semibold cursor-pointer"
              >
                Clear all tags
              </button>
            )}
          </div>

          {/* Active Selected Tags Strip */}
          <div className="min-h-7 flex flex-wrap items-center gap-1.5">
            {selectedIcd.length === 0 ? (
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                No diagnosis / ICD-10 tags selected (Initial state: unselected)
              </span>
            ) : (
              selectedIcd.map((code) => {
                const found = icd10Suggestions.find((i) => i.code === code);
                return (
                  <span
                    key={code}
                    style={{ backgroundColor: '#0A4D68' }}
                    className="text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{code}: {found ? found.name : code}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleIcd(code)}
                      className="hover:text-red-300 cursor-pointer text-[12px] font-black"
                      title="Remove tag"
                    >
                      ×
                    </button>
                  </span>
                );
              })
            )}
          </div>

          {/* Available Suggestion Chips (Selecting a tag NEVER auto-prescribes drugs) */}
          <div className="flex flex-wrap gap-1.5 pt-1">
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
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all shadow-sm hover:border-cyan-600 cursor-pointer"
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
            {prescriptions.length} Medication(s) Prescribed
          </span>
        </div>

        {/* Drug Input Row */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {isCustomDrug ? 'Custom Medicine Name' : 'Select or Type Medicine'}
              </label>
              {isCustomDrug ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={customDrugName}
                    onChange={(e) => setCustomDrugName(e.target.value)}
                    placeholder="Type customized medicine name..."
                    className="flex-1 px-2.5 py-1.5 bg-white border border-cyan-600 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomDrug(false)}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-xl text-[10px] font-bold text-slate-700 cursor-pointer"
                    title="Switch to formulary dropdown"
                  >
                    List
                  </button>
                </div>
              ) : (
                <select
                  value={selectedDrug}
                  onChange={handleDrugDropdownChange}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                >
                  <optgroup label="Standard Formulary">
                    {formularyList.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} ({d.strength})
                      </option>
                    ))}
                  </optgroup>
                  <option value="__CUSTOM__">➕ Enter Custom Medicine Name...</option>
                </select>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Strength</label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g. 500 mg, 3 gm"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Frequency</label>
              <input
                type="text"
                value={freq}
                onChange={(e) => setFreq(e.target.value)}
                placeholder="e.g. 1-0-1 (After Food)"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 5 days, 15 days"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder={isAyushCase ? "Anupana & instructions (e.g. Take with Ushnajala / warm water after meals)..." : "Special instructions (e.g. Take after breakfast with water)..."}
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

        {/* Common Formulary Quick-Add (Explicit '+ Add' action required) */}
        <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <Tag size={13} className="text-cyan-700" />
              <span>{isAyushCase ? 'Ayurvedic Formulary Quick-Add:' : 'Common Hospital Formulary Quick-Add:'}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Click "+ Add" to prescribe (Zero auto-prescription)
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {formularyList.map((d) => (
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
              className="text-red-600 hover:text-red-900 text-xs underline cursor-pointer font-bold"
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
            <h5 className="text-xs font-bold text-slate-800">No Medications Prescribed During This Encounter</h5>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
              This consultation currently has 0 active medication orders. Consultations with zero prescriptions (e.g. lifestyle counselling, diagnostic review) are fully valid. Select a drug from the formulary row above and click <strong>"Add Medication"</strong>, or click <strong>"+ Add"</strong> on any formulary item to prescribe.
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
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FlaskConical size={14} className="text-cyan-700" />
            <span>Diagnostic Lab Orders & Investigations</span>
          </h4>
          <span className="text-xs text-cyan-800 font-bold">
            {selectedTests.length} Investigation(s) Ordered
          </span>
        </div>

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
                className="p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-start gap-2 shadow-sm cursor-pointer hover:border-cyan-500"
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
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              Doctor's Advice & Lifestyle Restrictions:
            </label>
            {isAyushCase && (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setDoctorAdvice((prev) => prev ? `${prev}; Pathya: Ushnajala pana, Laghu ahara.` : 'Pathya: Ushnajala pana, Laghu ahara.')}
                  className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-300 transition-colors cursor-pointer"
                >
                  + Pathya
                </button>
                <button
                  type="button"
                  onClick={() => setDoctorAdvice((prev) => prev ? `${prev}; Apathya: Sheeta ahara, Divaswapna varjanam.` : 'Apathya: Sheeta ahara, Divaswapna varjanam.')}
                  className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-md border border-amber-300 transition-colors cursor-pointer"
                >
                  + Apathya
                </button>
              </div>
            )}
          </div>
          <textarea
            rows={2}
            value={doctorAdvice}
            onChange={(e) => setDoctorAdvice(e.target.value)}
            placeholder={isAyushCase ? "e.g. Pathya: Ushnajala (warm water), light diet. Apathya: Cold drinks, day-sleeping..." : "e.g. Low salt diet, regular monitoring of BP, avoid strenuous exercises..."}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white outline-none"
          />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-slate-700">Follow-Up Review:</label>
          <input
            type="text"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            placeholder="e.g. After 7 Days, SOS"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white outline-none"
          />
          <div className="pt-2">
            <span className="text-[10px] text-slate-400 block">Consulting Clinician:</span>
            <span className="text-xs font-bold text-slate-900">
              {authenticatedUser?.fullName || patient.assignedDoctor || 'Attending Clinician'}
            </span>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Bottom Save / Print Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900 text-white rounded-3xl shadow-xl">
        <div>
          <h5 className="text-sm font-bold">Complete OPD Consultation</h5>
          <p className="text-xs text-slate-400">Save prescription notes as draft, or sign and generate official OPD slip.</p>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            disabled={isSaving || isSigning}
            onClick={() => handleSaveConsultation(false)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 size={16} />
            <span>{isSaving ? 'Saving Draft...' : 'Save Note (Draft)'}</span>
          </button>

          <button
            type="button"
            disabled={isSaving || isSigning}
            onClick={() => handleSaveConsultation(true)}
            style={{ backgroundColor: '#088395' }}
            className="px-6 py-2.5 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Printer size={16} />
            <span>{isSigning ? 'Signing...' : 'Sign & Print OPD Slip'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
