import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Camera, 
  Trash2, 
  Sparkles, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  History, 
  Calendar, 
  Building2, 
  Pill, 
  FlaskConical, 
  Activity, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Eye,
  Layers,
  ChevronRight
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { 
  documentTypes, 
  processDocumentWithOcr, 
  generateMedicalTimeline 
} from '../../services/documentDigitizationService';
import { AudioPrompt } from '../common/AudioPrompt';

export const Step_DocumentsUnified = () => {
  const { kioskForm, setKioskForm, t } = usePatient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('extracted_data'); // 'extracted_data' | 'timeline'

  const documents = kioskForm.uploadedDocs || [];

  // Set default selected document
  useEffect(() => {
    if (documents.length > 0) {
      setSelectedDocId(prev => {
        const exists = documents.some(d => d.id === prev);
        return exists ? prev : documents[0].id;
      });
    } else {
      setSelectedDocId(null);
    }
  }, [documents.length]);

  const currentDoc = documents.find(d => d.id === selectedDocId) || documents[0] || null;

  // Process Document with Automatic OCR
  const handleProcessAndAttach = async (docPresetOrFile) => {
    setIsProcessing(true);
    try {
      const extractedDoc = await processDocumentWithOcr(docPresetOrFile, (stageObj) => {
        setProcessingStage(stageObj);
      });

      setKioskForm((prev) => {
        const exists = prev.uploadedDocs.some((d) => d.id === extractedDoc.id);
        const updatedDocs = exists
          ? prev.uploadedDocs.map((d) => (d.id === extractedDoc.id ? extractedDoc : d))
          : [...prev.uploadedDocs, extractedDoc];

        return {
          ...prev,
          uploadedDocs: updatedDocs,
          activeOcrDoc: extractedDoc
        };
      });

      setSelectedDocId(extractedDoc.id);
    } catch (e) {
      console.error('Error digitizing document with OCR:', e);
    } finally {
      setIsProcessing(false);
      setProcessingStage(null);
    }
  };

  const handleRemoveDoc = (docId) => {
    setKioskForm((prev) => ({
      ...prev,
      uploadedDocs: prev.uploadedDocs.filter((d) => d.id !== docId)
    }));
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await handleProcessAndAttach(files[i]);
      }
      e.target.value = '';
    }
  };

  // Medicine & Lab Table In-Place Edits
  const handleUpdateMedicine = (docId, medIndex, field, value) => {
    setKioskForm((prev) => {
      const updated = prev.uploadedDocs.map((doc) => {
        if (doc.id === docId) {
          const newMeds = [...(doc.medicines || [])];
          newMeds[medIndex] = { ...newMeds[medIndex], [field]: value };
          return { ...doc, medicines: newMeds };
        }
        return doc;
      });
      return { ...prev, uploadedDocs: updated };
    });
  };

  const handleUpdateLab = (docId, labIndex, field, value) => {
    setKioskForm((prev) => {
      const updated = prev.uploadedDocs.map((doc) => {
        if (doc.id === docId) {
          const newLabs = [...(doc.investigations || [])];
          newLabs[labIndex] = { ...newLabs[labIndex], [field]: value };
          return { ...doc, investigations: newLabs };
        }
        return doc;
      });
      return { ...prev, uploadedDocs: updated };
    });
  };

  // Synthesize Longitudinal Timeline Events
  const timelineEvents = React.useMemo(() => {
    const events = [];

    // 1. Current Active Consultation (Top)
    events.push({
      year: '2026',
      date: 'Today (Active Consultation)',
      title: `${kioskForm.reasonForVisit || kioskForm.chiefComplaints?.[0] || 'Outpatient Consultation'}`,
      category: 'Current Clinical Intake',
      facility: `${kioskForm.selectedHospitalName || 'Selected Healthcare Facility'}`,
      details: `Vitals: BP ${kioskForm.vitals?.bpSystolic || '--'}/${kioskForm.vitals?.bpDiastolic || '--'} mmHg, Pulse ${kioskForm.vitals?.pulse || '--'} bpm, SpO2 ${kioskForm.vitals?.spo2 || '--'}%.`,
      icon: Activity,
      color: 'cyan',
      isCurrent: true
    });

    // 2. Uploaded & Extracted Documents
    if (documents.length > 0) {
      documents.forEach((doc) => {
        const yearMatch = (doc.year || doc.date || '').toString().match(/\b(19\d\d|20\d\d)\b/);
        const displayYear = yearMatch ? yearMatch[1] : (doc.year || 'Recent');
        const docDiagnosis = doc.diagnosis && !/^(?:digitized\s+clinical\s+record|clinical\s+record|medical\s+document)$/i.test(doc.diagnosis) ? doc.diagnosis : null;

        events.push({
          year: displayYear,
          date: doc.date || 'Digitized Document',
          title: doc.title,
          category: doc.typeName || doc.type || 'Medical Record',
          facility: doc.hospital || doc.hospitalName || 'Healthcare Facility',
          details: docDiagnosis ? `Diagnosis: ${docDiagnosis}` : (doc.rawOcrText ? doc.rawOcrText.slice(0, 100) + '...' : 'Clinical record digitized with OCR.'),
          icon: (doc.type === 'Prescription' || doc.typeName === 'Prescription') ? Pill : FlaskConical,
          color: (doc.type === 'Prescription' || doc.typeName === 'Prescription') ? 'blue' : 'amber',
          isCurrent: false
        });
      });
    }

    // 3. Past Conditions
    if (kioskForm.pastConditions && kioskForm.pastConditions.length > 0) {
      kioskForm.pastConditions.forEach((cond) => {
        events.push({
          year: 'History',
          date: 'Patient Reported',
          title: `Medical History: ${cond}`,
          category: 'Pre-existing Condition',
          facility: 'Reported at Intake',
          details: `Patient has documented history of ${cond}.`,
          icon: History,
          color: 'purple',
          isCurrent: false
        });
      });
    }

    return events;
  }, [kioskForm, documents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <UploadCloud className="text-cyan-700" />
            <span>{t.docsUnifiedTitle || 'Medical Records, Auto-OCR & Health Timeline'}</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {t.docsUnifiedSub || 'Upload previous prescriptions, lab reports, or discharge summaries. Automatic OCR will digitize parameters and generate your health timeline.'}
          </p>
        </div>

        <AudioPrompt promptText={t.audioPromptDocs || 'Please upload past medical records. Automatic OCR will extract your reports into a medical timeline.'} />
      </div>

      {/* AUTOMATIC OCR PROCESSING BANNER */}
      {isProcessing && (
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl space-y-3 animate-pulse border border-cyan-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cpu size={24} className="text-cyan-400 animate-spin" />
              <div>
                <h4 className="text-sm sm:text-base font-bold text-cyan-300">
                  {t.ocrAutoRunning || 'Automatic OCR Processing & Entity Recognition in Progress...'}
                </h4>
                <p className="text-xs text-slate-400">
                  Digitizing medical parameters, lab reference ranges, and medications...
                </p>
              </div>
            </div>
            <span className="bg-cyan-950 text-cyan-300 border border-cyan-700 px-3 py-1 rounded-full text-xs font-mono font-bold">
              Stage {processingStage?.stage || 1} of 6
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              style={{ width: `${((processingStage?.stage || 1) / 6) * 100}%`, backgroundColor: '#22d3ee' }}
              className="h-full transition-all duration-300"
            />
          </div>
        </div>
      )}

      {/* SECTION 1: UPLOAD & QUICK PRESETS ZONE */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Upload Drop Zone */}
          <div className="md:col-span-1 border-2 border-dashed border-cyan-300 rounded-2xl p-5 text-center bg-white flex flex-col justify-center items-center space-y-2.5">
            <UploadCloud size={32} className="text-cyan-700" />
            <h4 className="text-xs font-bold text-slate-800">
              {t.uploadTitle || 'Upload Previous Document'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-tight">
              {t.supportedFormats || 'Supports PDF, JPG, PNG from Mobile or Scanner'}
            </p>
            <input
              type="file"
              id="kiosk-unified-file-input"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => document.getElementById('kiosk-unified-file-input')?.click()}
              className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
            >
              Browse or Scan File
            </button>
          </div>

          {/* Quick Real Test Presets */}
          <div className="md:col-span-2 space-y-2">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
              {t.selectPresetDoc || 'Or Select Quick Standard Medical Record Preset:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {documentTypes.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleProcessAndAttach(preset)}
                  disabled={isProcessing}
                  className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-cyan-600 hover:bg-cyan-50/40 text-left transition-all flex items-start gap-2.5 cursor-pointer shadow-2xs group"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:bg-cyan-700 group-hover:text-white transition-colors">
                    📄
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{preset.title}</h5>
                    <p className="text-[10px] text-slate-400 truncate">{preset.hospital} • {preset.date}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: DIGITIZED RECORDS VIEW (Tabs: Extracted Entities vs Timeline) */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('extracted_data')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'extracted_data'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Cpu size={14} />
              <span>{t.extractedEntitiesTab || 'Extracted Medical Entities'} ({documents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'timeline'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <History size={14} />
              <span>{t.timelineTab || 'Longitudinal Health Timeline'}</span>
            </button>
          </div>

          <span className="text-[11px] font-bold text-slate-400">
            {documents.length} record(s) digitized
          </span>
        </div>

        {/* SUBTAB 1: EXTRACTED CLINICAL ENTITIES & MEDICATIONS */}
        {activeSubTab === 'extracted_data' && (
          <div>
            {documents.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 border border-slate-200 rounded-3xl text-slate-500 space-y-2">
                <FileText size={32} className="mx-auto text-slate-400" />
                <p className="text-xs font-bold text-slate-600">
                  {t.noDocsNotice || 'No past medical documents uploaded. You can attach documents or continue directly.'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Uploading past prescriptions or lab reports helps the doctor review your health history.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Uploaded Documents Pill Selector */}
                <div className="flex flex-wrap gap-2">
                  {documents.map((doc) => {
                    const isSelected = selectedDocId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        className={`px-3 py-2 rounded-2xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-50 border-cyan-600 text-cyan-950 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedDocId(doc.id)}
                      >
                        <FileCheck size={14} className="text-cyan-700 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{doc.title}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDoc(doc.id);
                          }}
                          className="text-slate-400 hover:text-red-600 p-0.5"
                          title="Remove document"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Document Detailed Extraction Panel */}
                {currentDoc && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-5 shadow-xs">
                    {/* Doc Header Card */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                          {currentDoc.typeName || currentDoc.type || 'Clinical Document'}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1">
                          {currentDoc.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {currentDoc.hospital || 'Healthcare Facility'} • {currentDoc.date || 'Recent Date'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl block">
                          OCR Confidence: {Math.round((currentDoc.ocrConfidence || 0.94) * 100)}%
                        </span>
                        {currentDoc.diagnosis && (
                          <span className="text-[11px] text-slate-600 font-semibold block mt-1">
                            Impression: <strong>{currentDoc.diagnosis}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Extracted Medicines Table (Editable) */}
                    {Array.isArray(currentDoc.medicines) && currentDoc.medicines.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Pill size={14} className="text-cyan-700" />
                          <span>{t.extractedMedicines || 'Extracted Prescription Medications'}</span>
                        </h4>
                        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] uppercase">
                              <tr>
                                <th className="p-2.5">Medication Name</th>
                                <th className="p-2.5">Dosage</th>
                                <th className="p-2.5">Frequency</th>
                                <th className="p-2.5">Duration</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {currentDoc.medicines.map((med, mIdx) => (
                                <tr key={mIdx} className="hover:bg-slate-50/60">
                                  <td className="p-2.5 font-bold text-slate-900">
                                    <input
                                      type="text"
                                      value={med.name || ''}
                                      onChange={(e) => handleUpdateMedicine(currentDoc.id, mIdx, 'name', e.target.value)}
                                      className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-700 focus:outline-none"
                                    />
                                  </td>
                                  <td className="p-2.5 text-slate-600">{med.dosage || '--'}</td>
                                  <td className="p-2.5 text-slate-600">{med.frequency || '--'}</td>
                                  <td className="p-2.5 text-slate-500">{med.duration || '--'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Extracted Lab Investigations Table */}
                    {Array.isArray(currentDoc.investigations) && currentDoc.investigations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <FlaskConical size={14} className="text-cyan-700" />
                          <span>{t.extractedLabs || 'Extracted Diagnostic Investigations'}</span>
                        </h4>
                        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] uppercase">
                              <tr>
                                <th className="p-2.5">Investigation Test</th>
                                <th className="p-2.5">Observed Value</th>
                                <th className="p-2.5">Reference Range</th>
                                <th className="p-2.5">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {currentDoc.investigations.map((inv, lIdx) => (
                                <tr key={lIdx} className="hover:bg-slate-50/60">
                                  <td className="p-2.5 font-bold text-slate-900">{inv.name}</td>
                                  <td className="p-2.5 font-mono font-bold text-slate-800">
                                    {inv.value} {inv.unit}
                                  </td>
                                  <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                                    {inv.referenceRange || '--'}
                                  </td>
                                  <td className="p-2.5">
                                    {inv.isAbnormal ? (
                                      <span className="text-[10px] font-black uppercase text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                                        Abnormal
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                        Normal
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: LONGITUDINAL MEDICAL TIMELINE */}
        {activeSubTab === 'timeline' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <History size={16} className="text-cyan-700" />
                <span>{t.timelineTitle || 'Chronological Health Timeline'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.timelineSub || 'Synthesized longitudinal medical history from past records and today\'s consultation.'}
              </p>
            </div>

            {/* Timeline Events List */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timelineEvents.map((evt, idx) => {
                const Icon = evt.icon;
                return (
                  <div key={idx} className="relative group">
                    <div 
                      style={{ backgroundColor: evt.isCurrent ? '#088395' : '#64748b' }}
                      className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs"
                    />
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 group-hover:border-cyan-500 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-black text-cyan-900">
                          {evt.date} ({evt.year})
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {evt.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{evt.title}</h4>
                      <p className="text-xs text-slate-600 font-medium">{evt.facility}</p>
                      <p className="text-xs text-slate-500 pt-1 leading-relaxed">{evt.details}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
