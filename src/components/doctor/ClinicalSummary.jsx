import React, { useState, useEffect } from 'react';
import { 
  User, 
  Heart, 
  Activity, 
  AlertCircle, 
  Clock, 
  FileText, 
  Pill, 
  ShieldAlert, 
  ShieldCheck, 
  Flame, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Sparkles, 
  Stethoscope, 
  Info, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Volume2,
  Lock,
  Layers,
  FlaskConical,
  Brain,
  Wind,
  Leaf,
  Utensils
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { TriageBadge } from '../common/TriageBadge';

export const ClinicalSummary = ({ patient }) => {
  const { 
    updatePatientClinicalRecord, 
    confirmPatientSummary, 
    rejectPatientSummary,
    speakText
  } = usePatient();

  // Local state for editing the patient's clinical summary
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(patient || {});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData(patient);
      setIsEditing(false);
    }
  }, [patient?.id]);

  if (!patient) return null;

  const isVerified = patient.status === 'History Verified' || patient.verificationStatus === 'History Verified';
  const isRejected = patient.status === 'Rejected' || patient.verificationStatus === 'Rejected';

  const handleSaveDraft = () => {
    updatePatientClinicalRecord(patient.id, formData);
    setIsEditing(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleConfirmSummary = () => {
    updatePatientClinicalRecord(patient.id, formData);
    confirmPatientSummary(patient.id);
    setIsEditing(false);
  };

  const handleRejectSubmit = () => {
    rejectPatientSummary(patient.id, rejectReason || 'Clinical history flagged for re-intake.');
    setShowRejectModal(false);
    setRejectReason('');
  };

  const isHighBp = patient.vitals?.bpSystolic >= 160 || patient.vitals?.bpDiastolic >= 100;
  const isLowSpo2 = patient.vitals?.spo2 <= 94;
  const isHighBs = patient.vitals?.bloodSugar >= 200;

  return (
    <div className="space-y-6">
      {/* Top Doctor Action Toolbar: Edit, Save, Confirm, Reject */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold">Clinical Case History & Assessment</h3>
            {isVerified ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full uppercase">
                <ShieldCheck size={12} /> History Verified ✓
              </span>
            ) : isRejected ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-red-500 text-white px-2.5 py-0.5 rounded-full uppercase">
                <XCircle size={12} /> Re-Intake Requested
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                <Clock size={12} /> Pending Doctor Verification
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isVerified
              ? `Verified by attending medical officer at ${patient.verificationTimestamp || '09:15 AM'}`
              : 'Review and modify any clinical section before confirming into medical record.'}
          </p>
        </div>

        {/* Doctor Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Edit3 size={15} />
              <span>Edit Sections</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow"
            >
              <Save size={15} />
              <span>Save Changes</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirmSummary}
            style={{ backgroundColor: '#059669' }}
            className="px-5 py-2 text-white hover:opacity-90 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md"
          >
            <CheckCircle2 size={16} />
            <span>Confirm Summary</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <XCircle size={15} />
            <span>Reject / Re-take</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Doctor edits successfully saved to patient record!</span>
        </div>
      )}

      {/* Mandatory AI-Generated Summary Disclaimer Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 p-5 rounded-3xl shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-amber-700" />
            <h4 className="text-sm font-black text-amber-950 uppercase tracking-wide">
              AI-Generated Clinical Summary Draft
            </h4>
          </div>

          <div className="bg-amber-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
            <AlertCircle size={13} />
            <span>AI-generated draft — Doctor verification required</span>
          </div>
        </div>

        <p className="text-xs text-amber-900 font-semibold leading-relaxed">
          <strong>Notice:</strong> The clinical draft below is synthesized automatically from kiosk inputs and OCR extracted records. <strong>The AI does not make the final diagnosis.</strong> The attending doctor must verify, edit, and confirm all findings.
        </p>

        {/* AI Draft Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-3.5 bg-white/90 rounded-2xl border border-amber-200 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-amber-800 block">
              Subjective Clinical Impression
            </span>
            <p className="text-slate-800 font-medium">
              {patient.aiGeneratedDraft?.subjectiveSummary || 'Patient history collected at kiosk.'}
            </p>
          </div>

          <div className="p-3.5 bg-white/90 rounded-2xl border border-amber-200 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-amber-800 block">
              Objective & Risk Assessment
            </span>
            <p className="text-slate-800 font-medium">
              {patient.aiGeneratedDraft?.objectiveSummary || 'Vitals and lab observations recorded.'}
            </p>
          </div>
        </div>

        {/* Suggested Differential & Next Steps */}
        {patient.aiGeneratedDraft?.differentialDiagnosisDraft && (
          <div className="p-3.5 bg-white/90 rounded-2xl border border-amber-200 space-y-2 text-xs">
            <span className="text-[10px] font-extrabold uppercase text-amber-800 block">
              Suggested Differential Diagnosis Draft (For Doctor Review):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {patient.aiGeneratedDraft.differentialDiagnosisDraft.map((item, idx) => (
                <span key={idx} className="bg-amber-100/70 text-amber-950 font-bold px-2.5 py-1 rounded-lg border border-amber-300 text-[11px]">
                  • {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vitals Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        <div className={`p-3 rounded-2xl border text-center ${isHighBp ? 'bg-red-50 border-red-300 text-red-900' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">BP (Blood Pressure)</span>
          <span className="text-lg font-black text-slate-900">{formData.vitals?.bpSystolic}/{formData.vitals?.bpDiastolic}</span>
          <span className="text-[10px] text-slate-400 block">mmHg</span>
        </div>

        <div className="p-3 rounded-2xl border bg-slate-50 border-slate-200 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Pulse Rate</span>
          <span className="text-lg font-black text-cyan-800">{formData.vitals?.pulse}</span>
          <span className="text-[10px] text-slate-400 block">bpm</span>
        </div>

        <div className={`p-3 rounded-2xl border text-center ${isLowSpo2 ? 'bg-red-50 border-red-300 text-red-900' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">SpO2 (Oxygen)</span>
          <span className="text-lg font-black text-emerald-700">{formData.vitals?.spo2}%</span>
          <span className="text-[10px] text-slate-400 block">Room Air</span>
        </div>

        <div className="p-3 rounded-2xl border bg-slate-50 border-slate-200 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Temperature</span>
          <span className="text-lg font-black text-amber-700">{formData.vitals?.temp} °F</span>
          <span className="text-[10px] text-slate-400 block">Oral</span>
        </div>

        <div className={`p-3 rounded-2xl border text-center ${isHighBs ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Blood Sugar</span>
          <span className="text-lg font-black text-purple-800">{formData.vitals?.bloodSugar}</span>
          <span className="text-[10px] text-slate-400 block">mg/dL (RBS)</span>
        </div>

        <div className="p-3 rounded-2xl border bg-slate-50 border-slate-200 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">BMI / Weight</span>
          <span className="text-lg font-black text-slate-900">{formData.vitals?.bmi || 24.1}</span>
          <span className="text-[10px] text-slate-400 block">{formData.vitals?.weight || 68} kg</span>
        </div>
      </div>

      {/* 10 COMPREHENSIVE CLINICAL SECTIONS (ALL FULLY EDITABLE) */}
      <div className="space-y-4">
        {/* Section 1 & 2: Chief Complaint & HPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Section 1: Chief Complaint */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Activity size={15} className="text-cyan-700" />
                <span>1. Chief Complaint(s)</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">
                {isEditing ? 'Editing enabled' : 'Click Edit to modify'}
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 block">Chief Complaints (One per line):</label>
                <textarea
                  rows={3}
                  value={formData.chiefComplaints?.join('\n') || ''}
                  onChange={(e) => setFormData({ ...formData, chiefComplaints: e.target.value.split('\n').filter(Boolean) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white outline-none"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                {formData.chiefComplaints?.map((comp, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-start gap-2">
                    <span className="text-cyan-700">•</span>
                    <span>{comp}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">Duration:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full mt-1 p-1 bg-white border border-slate-300 rounded text-xs font-bold"
                  />
                ) : (
                  <span className="font-bold text-slate-800">{formData.duration || '2 Days'}</span>
                )}
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">Pain Rating:</span>
                {isEditing ? (
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.painScore || 5}
                    onChange={(e) => setFormData({ ...formData, painScore: Number(e.target.value) })}
                    className="w-full mt-1 p-1 bg-white border border-slate-300 rounded text-xs font-bold"
                  />
                ) : (
                  <span className="font-black text-cyan-800">{formData.painScore || 5} / 10</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: History of Present Illness (HPI) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <FileText size={15} className="text-cyan-700" />
              <span>2. History of Present Illness (HPI)</span>
            </h4>

            {isEditing ? (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">Onset & Location:</label>
                  <input
                    type="text"
                    value={formData.hpi?.onset || ''}
                    onChange={(e) => setFormData({ ...formData, hpi: { ...formData.hpi, onset: e.target.value } })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">Character & Severity:</label>
                  <input
                    type="text"
                    value={formData.hpi?.character || ''}
                    onChange={(e) => setFormData({ ...formData, hpi: { ...formData.hpi, character: e.target.value } })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">Radiation & Triggers:</label>
                  <input
                    type="text"
                    value={formData.hpi?.radiation || ''}
                    onChange={(e) => setFormData({ ...formData, hpi: { ...formData.hpi, radiation: e.target.value } })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Onset & Character</span>
                  <p className="text-slate-800 font-semibold">{formData.hpi?.onset} {formData.hpi?.character}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Radiation & Triggers</span>
                  <p className="text-slate-800 font-semibold">Spreads to: {formData.hpi?.radiation || 'None'}. Aggravated by: {formData.hpi?.aggravatingFactors || 'Exertion'}.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3, 4, 5, 6: Past Medical, Surgical, Meds & Allergies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Section 3 & 4: Past Medical & Surgical History */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Layers size={15} className="text-cyan-700" />
              <span>3 & 4. Past Medical & Surgical History</span>
            </h4>

            {isEditing ? (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block">Past Medical Conditions (Comma separated):</label>
                  <textarea
                    rows={2}
                    value={formData.pastMedicalHistory?.join('\n') || ''}
                    onChange={(e) => setFormData({ ...formData, pastMedicalHistory: e.target.value.split('\n').filter(Boolean) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block">Past Surgical History:</label>
                  <textarea
                    rows={2}
                    value={formData.pastSurgicalHistory?.join('\n') || ''}
                    onChange={(e) => setFormData({ ...formData, pastSurgicalHistory: e.target.value.split('\n').filter(Boolean) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Medical Conditions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.pastMedicalHistory?.map((c, i) => (
                      <span key={i} className="bg-slate-100 text-slate-800 font-semibold px-2.5 py-1 rounded-lg border border-slate-200">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Surgical Procedures:</span>
                  <div className="space-y-1">
                    {formData.pastSurgicalHistory?.map((s, i) => (
                      <div key={i} className="p-2 bg-purple-50 text-purple-950 font-semibold rounded-lg border border-purple-200">
                        • {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5 & 6: Current Medications & Drug Allergies */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Pill size={15} className="text-cyan-700" />
              <span>5 & 6. Medications & Drug Allergies</span>
            </h4>

            {isEditing ? (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-red-700 block">Drug Allergies (High Safety Risk):</label>
                  <textarea
                    rows={2}
                    value={formData.drugAllergies?.join('\n') || ''}
                    onChange={(e) => setFormData({ ...formData, drugAllergies: e.target.value.split('\n').filter(Boolean) })}
                    className="w-full p-2 bg-red-50/50 border border-red-300 rounded-xl text-xs font-bold text-red-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block">Current Medications List:</label>
                  <textarea
                    rows={2}
                    value={formData.currentMedications?.join('\n') || ''}
                    onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value.split('\n').filter(Boolean) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-red-700 block mb-1">Drug Allergies:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.drugAllergies?.map((a, i) => (
                      <span key={i} className="bg-red-50 text-red-800 font-extrabold px-2.5 py-1 rounded-lg border border-red-300">
                        ⚠️ {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Current Medicines:</span>
                  <div className="space-y-1">
                    {formData.currentMedications?.map((m, i) => (
                      <div key={i} className="p-2 bg-cyan-50/60 font-mono text-cyan-950 font-bold rounded-lg border border-cyan-200">
                        {m}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 7 & 8: Family & Personal History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Section 7: Family History */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <User size={15} className="text-cyan-700" />
              <span>7. Family History</span>
            </h4>
            {isEditing ? (
              <textarea
                rows={2}
                value={formData.familyHistory || ''}
                onChange={(e) => setFormData({ ...formData, familyHistory: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            ) : (
              <p className="text-xs text-slate-800 font-medium p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                {formData.familyHistory || 'Non-contributory.'}
              </p>
            )}
          </div>

          {/* Section 8: Personal History */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Activity size={15} className="text-cyan-700" />
              <span>8. Personal & Lifestyle History</span>
            </h4>
            {isEditing ? (
              <textarea
                rows={2}
                value={formData.personalHistory || ''}
                onChange={(e) => setFormData({ ...formData, personalHistory: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            ) : (
              <p className="text-xs text-slate-800 font-medium p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                {formData.personalHistory || 'Mixed diet, non-smoker.'}
              </p>
            )}
          </div>
        </div>

        {/* Section 9: Review of Systems (ROS) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Stethoscope size={15} className="text-cyan-700" />
            <span>9. Review of Systems (ROS)</span>
          </h4>

          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Cardiovascular:</label>
                <input
                  type="text"
                  value={formData.reviewOfSystems?.cardiovascular || ''}
                  onChange={(e) => setFormData({ ...formData, reviewOfSystems: { ...formData.reviewOfSystems, cardiovascular: e.target.value } })}
                  className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Respiratory:</label>
                <input
                  type="text"
                  value={formData.reviewOfSystems?.respiratory || ''}
                  onChange={(e) => setFormData({ ...formData, reviewOfSystems: { ...formData.reviewOfSystems, respiratory: e.target.value } })}
                  className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Neurological:</label>
                <input
                  type="text"
                  value={formData.reviewOfSystems?.neurological || ''}
                  onChange={(e) => setFormData({ ...formData, reviewOfSystems: { ...formData.reviewOfSystems, neurological: e.target.value } })}
                  className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-cyan-800 uppercase block">Cardiovascular</span>
                <p className="text-slate-800 font-semibold">{formData.reviewOfSystems?.cardiovascular || 'Normal.'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-cyan-800 uppercase block">Respiratory</span>
                <p className="text-slate-800 font-semibold">{formData.reviewOfSystems?.respiratory || 'Normal.'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-cyan-800 uppercase block">Neurological</span>
                <p className="text-slate-800 font-semibold">{formData.reviewOfSystems?.neurological || 'Normal.'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 10: Previous Investigations & Diagnostic Impressions */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <FlaskConical size={15} className="text-cyan-700" />
            <span>10. Previous Diagnostic Investigations & Lab History</span>
          </h4>

          {formData.previousInvestigations?.labs && formData.previousInvestigations.labs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {formData.previousInvestigations.labs.map((inv, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex justify-between items-center ${
                    inv.isAbnormal ? 'bg-red-50/60 border-red-200 text-red-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div>
                    <span className="block text-[11px]">{inv.test}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Ref: {inv.refRange}</span>
                  </div>
                  <span className="font-black text-xs">{inv.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No previous electronic laboratory orders on record.</p>
          )}

          {formData.previousInvestigations?.ecg && (
            <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-200 text-xs">
              <span className="text-[10px] font-bold text-cyan-900 uppercase block">ECG Impression:</span>
              <p className="text-slate-800 font-bold mt-0.5">{formData.previousInvestigations.ecg}</p>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* AYUSH CLINICAL ASSESSMENT & DASHAVIDHA PARIKSHA SECTION                   */}
        {/* Rendered when patient visited AYUSH OPD or has AYUSH clinical records     */}
        {/* ========================================================================= */}
        {(formData.ayushHistory || patient.ayushHistory || patient.department?.toLowerCase().includes('ayush') || patient.department?.toLowerCase().includes('ayurveda') || formData.department?.toLowerCase().includes('ayush')) && (
          <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-3xl p-6 shadow-sm space-y-6">
            {/* AYUSH Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-emerald-700 text-white rounded-2xl shadow-xs">
                  <Leaf size={22} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-emerald-950">
                      AYUSH Clinical Assessment & Dashavidha Pariksha
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300">
                      Ayurvedic OPD
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 font-medium">
                    Ten-fold clinical examination (Dashavidha Pariksha), digestive fire (Agni), bowel habit (Koshtha), and disease pathogenesis (Samprapti).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full border bg-white text-emerald-900 border-emerald-300">
                  📋 Patient-Reported + Clinician-Verified
                </span>
              </div>
            </div>

            {/* Clinician Directives Banner */}
            <div className="bg-white/80 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
              <Info size={16} className="text-emerald-700 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-extrabold text-emerald-900">
                  Clinical Verification Guardrail
                </p>
                <p className="text-emerald-800 leading-relaxed">
                  Patient entries reflect subjective self-reported tendencies. The attending Ayurvedic clinician must review the patient's pulse (Nadi), tongue (Jihwa), and clinical presentation to confirm the final <strong>Prakriti</strong>, <strong>Vikriti</strong>, and <strong>Dhatu Sara</strong>.
                </p>
              </div>
            </div>

            {/* 1. DASHAVIDHA PARIKSHA (10 PARAMETERS) */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Sparkles size={16} className="text-emerald-700" />
                <span>Dashavidha Pariksha (10-Fold Assessment)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Prakriti */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <User size={14} className="text-emerald-700" />
                      <span>1. Constitution (Prakriti)</span>
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Patient Self-Report
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <p><strong>Frame:</strong> {formData.ayushHistory?.dashavidhaPariksha?.prakriti?.bodyFrame || 'Medium / Athletic'}</p>
                    <p><strong>Thermal:</strong> {formData.ayushHistory?.dashavidhaPariksha?.prakriti?.thermalPreference || 'Prefers Cool'}</p>
                    <p><strong>Skin:</strong> {formData.ayushHistory?.dashavidhaPariksha?.prakriti?.skinNature || 'Warm / Oily'}</p>
                  </div>
                  {isEditing && (
                    <div className="pt-2 border-t border-slate-100">
                      <label className="text-[10px] font-bold text-emerald-900 block mb-1">Clinician Verified Dominant Dosha:</label>
                      <select
                        value={formData.ayushHistory?.dashavidhaPariksha?.prakriti?.clinicianVerified?.dominantDosha || 'Pitta Pradhana'}
                        onChange={(e) => {
                          const updated = { ...formData };
                          if (!updated.ayushHistory) updated.ayushHistory = {};
                          if (!updated.ayushHistory.dashavidhaPariksha) updated.ayushHistory.dashavidhaPariksha = {};
                          if (!updated.ayushHistory.dashavidhaPariksha.prakriti) updated.ayushHistory.dashavidhaPariksha.prakriti = {};
                          if (!updated.ayushHistory.dashavidhaPariksha.prakriti.clinicianVerified) updated.ayushHistory.dashavidhaPariksha.prakriti.clinicianVerified = {};
                          updated.ayushHistory.dashavidhaPariksha.prakriti.clinicianVerified.dominantDosha = e.target.value;
                          setFormData(updated);
                        }}
                        className="w-full p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950"
                      >
                        <option value="Vata Pradhana">Vata Pradhana</option>
                        <option value="Pitta Pradhana">Pitta Pradhana</option>
                        <option value="Kapha Pradhana">Kapha Pradhana</option>
                        <option value="Vata-Pitta">Vata-Pitta Dvandvaja</option>
                        <option value="Pitta-Kapha">Pitta-Kapha Dvandvaja</option>
                        <option value="Vata-Kapha">Vata-Kapha Dvandvaja</option>
                        <option value="Tridoshic (Sama Prakriti)">Tridoshic (Sama Prakriti)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 2. Vikriti */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Activity size={14} className="text-emerald-700" />
                      <span>2. Active Imbalance (Vikriti)</span>
                    </span>
                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Active Disease
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <p><strong>Reported Symptoms:</strong> {formData.ayushHistory?.dashavidhaPariksha?.vikriti?.primaryImbalanceSymptoms?.join(', ') || 'Digestive acidity and bodily heat'}</p>
                    <p><strong>Duration:</strong> {formData.ayushHistory?.dashavidhaPariksha?.vikriti?.durationOfImbalance || 'Acute (< 2 weeks)'}</p>
                  </div>
                  {isEditing && (
                    <div className="pt-2 border-t border-slate-100">
                      <label className="text-[10px] font-bold text-emerald-900 block mb-1">Clinician Aggravated Dosha Finding:</label>
                      <input
                        type="text"
                        placeholder="e.g. Pitta-Vata aggravated with Rasa-Rakta Dushti"
                        value={formData.ayushHistory?.dashavidhaPariksha?.vikriti?.clinicianVerified?.aggravatedDosha || ''}
                        onChange={(e) => {
                          const updated = { ...formData };
                          if (!updated.ayushHistory?.dashavidhaPariksha?.vikriti?.clinicianVerified) {
                            if (!updated.ayushHistory) updated.ayushHistory = {};
                            if (!updated.ayushHistory.dashavidhaPariksha) updated.ayushHistory.dashavidhaPariksha = {};
                            if (!updated.ayushHistory.dashavidhaPariksha.vikriti) updated.ayushHistory.dashavidhaPariksha.vikriti = {};
                            updated.ayushHistory.dashavidhaPariksha.vikriti.clinicianVerified = {};
                          }
                          updated.ayushHistory.dashavidhaPariksha.vikriti.clinicianVerified.aggravatedDosha = e.target.value;
                          setFormData(updated);
                        }}
                        className="w-full p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Sara (Tissue Vitality) */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 block">3. Tissue Excellence (Sara):</span>
                  <p className="text-slate-700"><strong>Reported Stamina:</strong> {formData.ayushHistory?.dashavidhaPariksha?.sara?.overallVitality || 'Moderate / Average (Madhya Sara)'}</p>
                  <p className="text-emerald-900 font-semibold"><strong>Dhatu Tone:</strong> {formData.ayushHistory?.dashavidhaPariksha?.sara?.clinicianVerified?.predominantDhatuSara || 'Rasa-Mamsa Madhyama Sara'}</p>
                </div>

                {/* 4. Samhanana (Body Compactness) */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 block">4. Compactness (Samhanana):</span>
                  <p className="text-slate-700">{formData.ayushHistory?.dashavidhaPariksha?.samhanana?.bodyCompactness || 'Madhyama (Moderate compactness)'}</p>
                </div>

                {/* 5. Pramana (Anthropometry) */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 block">5. Proportions (Pramana):</span>
                  <p className="text-slate-700">{formData.ayushHistory?.dashavidhaPariksha?.pramana?.bodyProportion || 'Sama Pramana (Well-proportioned)'}</p>
                </div>

                {/* 6. Satmya (Habitual Adaptability) */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 block">6. Habitual Suitability (Satmya):</span>
                  <p className="text-slate-700">{formData.ayushHistory?.dashavidhaPariksha?.satmya?.dietSuitability || 'Madhyama (Prefers warm, cooked simple foods)'}</p>
                </div>

                {/* 7. Sattva (Mental Resilience) */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 block">7. Mental Tone (Sattva):</span>
                  <p className="text-slate-700">{formData.ayushHistory?.dashavidhaPariksha?.sattva?.mentalResilience || 'Madhya Sattva (Moderate resolve)'}</p>
                </div>

                {/* 8. Ahara Shakti (Digestive Power) */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 block">8. Digestive Capacity (Ahara Shakti):</span>
                  <p className="text-slate-700">{formData.ayushHistory?.dashavidhaPariksha?.aharaShakti?.appetiteDigestionPower || 'Madhya (Moderate appetite, normal digestion)'}</p>
                </div>

                {/* 9. Vyayama Shakti (Physical Endurance) */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 block">9. Physical Stamina (Vyayama Shakti):</span>
                  <p className="text-slate-700">{formData.ayushHistory?.dashavidhaPariksha?.vyayamaShakti?.physicalEndurance || 'Madhya (Can walk 1-3 km comfortably)'}</p>
                </div>

                {/* 10. Vaya (Biological Age Stage) */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 block">10. Life Stage (Vaya):</span>
                  <p className="text-slate-700">{formData.ayushHistory?.dashavidhaPariksha?.vaya?.ageStage || 'Madhyama (16-60 yrs - Youth & Adulthood / Pitta stage)'}</p>
                </div>
              </div>
            </div>

            {/* 2. AGNI, KOSHTHA, AHARA, VIHARA, NIDANA & SAMPRAPTI */}
            <div className="space-y-3 pt-2 border-t border-emerald-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Flame size={16} className="text-amber-700" />
                <span>Digestive Fire, Bowels, Regimen & Pathogenesis</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Agni */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Flame size={14} className="text-amber-600" />
                    <span>Digestive Fire (Agni):</span>
                  </span>
                  <p className="text-slate-800 font-semibold">{formData.ayushHistory?.additionalHistory?.agni || 'Samagni (Balanced)'}</p>
                </div>

                {/* Koshtha */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Layers size={14} className="text-cyan-600" />
                    <span>Bowel Habit (Koshtha):</span>
                  </span>
                  <p className="text-slate-800 font-semibold">{formData.ayushHistory?.additionalHistory?.koshtha || 'Madhyama Koshtha'}</p>
                </div>

                {/* Ahara */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Utensils size={14} className="text-emerald-600" />
                    <span>Dietary Regimen (Ahara):</span>
                  </span>
                  <p className="text-slate-700"><strong>Type:</strong> {formData.ayushHistory?.additionalHistory?.ahara?.dietType || 'Vegetarian with dairy'}</p>
                  <p className="text-slate-700"><strong>Fluids:</strong> {formData.ayushHistory?.additionalHistory?.ahara?.waterIntake || '2 - 3 Litres / day'}</p>
                  {formData.ayushHistory?.additionalHistory?.ahara?.unwholesomeHabits && (
                    <p className="text-amber-800 font-medium"><strong>Unwholesome:</strong> {formData.ayushHistory.additionalHistory.ahara.unwholesomeHabits}</p>
                  )}
                </div>

                {/* Vihara */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Clock size={14} className="text-purple-600" />
                    <span>Daily Regimen (Vihara):</span>
                  </span>
                  <p className="text-slate-700"><strong>Wake:</strong> {formData.ayushHistory?.additionalHistory?.vihara?.wakeTime || '6:30 AM'} • <strong>Sleep:</strong> {formData.ayushHistory?.additionalHistory?.vihara?.sleepTime || '11:00 PM'}</p>
                  <p className="text-slate-700"><strong>Stress Level:</strong> {formData.ayushHistory?.additionalHistory?.vihara?.stressLevel || 'Moderate'}</p>
                </div>

                {/* Nidana */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs md:col-span-2">
                  <span className="font-bold text-red-900 flex items-center gap-1">
                    <AlertCircle size={14} className="text-red-600" />
                    <span>Patient-Reported Causative Factors & Triggers (Nidana):</span>
                  </span>
                  <p className="text-slate-800 font-medium bg-red-50/50 p-2 rounded-xl border border-red-200">
                    {formData.ayushHistory?.additionalHistory?.nidana?.patientReportedTriggers || 'Irregular meal timings, stress during work, unaccustomed spicy food'}
                  </p>
                </div>

                {/* Samprapti */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs md:col-span-2">
                  <span className="font-bold text-emerald-950 flex items-center gap-1">
                    <Activity size={14} className="text-emerald-700" />
                    <span>Disease Progression & Relief Factors (Samprapti):</span>
                  </span>
                  <p className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                    {formData.ayushHistory?.additionalHistory?.samprapti?.patientReportedProgression || 'Symptoms began with mild sour belching, then progressed into epigastric burning.'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-950 border border-emerald-200">
                      <strong>Relieving Factors (Upashaya):</strong> {formData.ayushHistory?.additionalHistory?.samprapti?.relievingFactors || 'Cool water, buttermilk, resting'}
                    </div>
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-950 border border-amber-200">
                      <strong>Aggravating Factors (Anupashaya):</strong> {formData.ayushHistory?.additionalHistory?.samprapti?.aggravatingFactors || 'Spicy food, empty stomach, stress'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Reason Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle size={22} />
              <h4 className="text-base font-bold text-slate-900">Reject Case Summary for Re-Intake</h4>
            </div>

            <p className="text-xs text-slate-600">
              Please enter the clinical reason for rejecting the patient history draft:
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Inconsistent symptom onset timeline reported, patient needs language assistance re-interview..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs outline-none focus:border-red-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow"
              >
                Confirm Rejection & Re-Intake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
