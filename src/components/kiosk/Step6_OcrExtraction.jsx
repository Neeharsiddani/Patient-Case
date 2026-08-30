import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Save, 
  Plus, 
  Trash2, 
  FileSearch, 
  History, 
  Sparkles, 
  Building2, 
  Calendar, 
  Pill, 
  FlaskConical, 
  Activity, 
  ShieldCheck,
  Cpu,
  ArrowRight,
  Eye,
  ChevronRight,
  Info
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { 
  standardClinicalDocuments, 
  generateMedicalTimeline 
} from '../../services/documentDigitizationService';
import { AudioPrompt } from '../common/AudioPrompt';

export const Step6_OcrExtraction = () => {
  const { kioskForm, setKioskForm, t } = usePatient();
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [activeTab, setActiveTab] = useState('extracted_data'); // 'extracted_data' | 'timeline' | 'raw_preview'
  const [isProcessingScan, setIsProcessingScan] = useState(true);

  // Initialize uploaded docs if none attached yet
  useEffect(() => {
    if (!kioskForm.uploadedDocs || kioskForm.uploadedDocs.length === 0) {
      const defaultDocs = [standardClinicalDocuments[0], standardClinicalDocuments[1]];
      setKioskForm((prev) => ({
        ...prev,
        uploadedDocs: defaultDocs
      }));
      setSelectedDocId(defaultDocs[0].id);
    } else {
      setSelectedDocId(kioskForm.uploadedDocs[0].id);
    }

    const timer = setTimeout(() => {
      setIsProcessingScan(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const documents = kioskForm.uploadedDocs || [];
  const currentDoc = documents.find((d) => d.id === selectedDocId) || documents[0];
  const timeline = generateMedicalTimeline(documents);

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

  const abnormalLabsCount = (currentDoc?.investigations || []).filter((inv) => inv.isAbnormal).length;

  return (
    <div className="space-y-6">
      {/* Header & Audio Guidance */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="text-cyan-600" />
            <span>Medical Document Digitization & Clinical Extraction</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review structured diagnostic entities, prescription medicines, and chronological health timeline.
          </p>
        </div>
        <AudioPrompt promptText="Review your digitized medical records, extracted prescription medicines, laboratory tests, and health timeline." />
      </div>

      {/* Document Selector Pills (If multiple documents uploaded) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-2 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 pl-2">Select Document:</span>
          {documents.map((doc) => {
            const isSelected = currentDoc?.id === doc.id;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => {
                  setSelectedDocId(doc.id);
                  setIsProcessingScan(true);
                  setTimeout(() => setIsProcessingScan(false), 600);
                }}
                style={{
                  backgroundColor: isSelected ? '#088395' : '#ffffff',
                  borderColor: isSelected ? '#088395' : '#cbd5e1',
                  color: isSelected ? '#ffffff' : '#334155'
                }}
                className="px-3.5 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5"
              >
                <FileText size={14} />
                <span>{doc.title}</span>
                <span className="opacity-80 text-[10px] font-mono">({doc.year})</span>
              </button>
            );
          })}
        </div>

        {/* View Switcher: Extracted Data vs Automated Timeline */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('extracted_data')}
            style={{
              backgroundColor: activeTab === 'extracted_data' ? '#0A4D68' : 'transparent',
              color: activeTab === 'extracted_data' ? '#ffffff' : '#475569'
            }}
            className="px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Sparkles size={13} />
            <span>Extracted Entities</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            style={{
              backgroundColor: activeTab === 'timeline' ? '#0A4D68' : 'transparent',
              color: activeTab === 'timeline' ? '#ffffff' : '#475569'
            }}
            className="px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <History size={13} />
            <span>Medical Timeline ({timeline.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: EXTRACTED STRUCTURED MEDICAL DATA */}
      {activeTab === 'extracted_data' && currentDoc && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Visual Document Preview & Scan Surface (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[460px]">
            {isProcessingScan && <div className="scanner-line" />}

            {/* Scanner Top Status */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-mono text-cyan-300">
                  {isProcessingScan ? 'Processing Document OCR...' : 'OCR & Clinical Extraction Ready'}
                </span>
              </div>
              <span className="bg-cyan-950 text-cyan-300 border border-cyan-700 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                Confidence: {currentDoc.ocrConfidence || 95}%
              </span>
            </div>

            {/* Scanned Paper Layout */}
            <div className="bg-slate-800/90 rounded-2xl p-4 my-3 font-mono text-[11px] space-y-2.5 border border-slate-700 select-none">
              <div className="text-slate-400 text-[10px] border-b border-slate-700 pb-1.5 flex justify-between">
                <span>[DOCUMENT TYPE]: {currentDoc.typeName || currentDoc.type}</span>
                <span className="text-cyan-400">DATE: {currentDoc.date}</span>
              </div>

              <div className="text-slate-200">
                <span className="text-slate-400">FACILITY:</span> {currentDoc.hospital}
              </div>

              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200">
                <span className="font-bold text-cyan-400 block text-[10px]">DIAGNOSIS / IMPRESSION:</span>
                <span>{currentDoc.diagnosis}</span>
              </div>

              {/* Extracted Labs Snippet */}
              {currentDoc.investigations && currentDoc.investigations.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold block">LAB BIOMARKER RECOGNITION:</span>
                  {currentDoc.investigations.slice(0, 3).map((inv, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 rounded-lg border text-[10px] flex justify-between ${
                        inv.isAbnormal ? 'bg-red-500/15 border-red-500/40 text-red-200' : 'bg-slate-700/60 border-slate-600 text-slate-300'
                      }`}
                    >
                      <span>• {inv.name}</span>
                      <span className="font-bold">{inv.value} {inv.unit} ({inv.status})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Engine Note */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>FHIR R4 DiagnosticReport Validated</span>
              </div>
              <span className="text-slate-400 text-[10px] font-mono">ID: {currentDoc.id}</span>
            </div>
          </div>

          {/* Right Column: Structured Extracted Information Fields (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            {/* Header: Document Date, Hospital & Diagnosis */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Document Date</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mt-0.5">
                    <Calendar size={14} className="text-cyan-700" />
                    <span>{currentDoc.date} ({currentDoc.year})</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Hospital / Clinic</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mt-0.5 truncate">
                    <Building2 size={14} className="text-cyan-700 flex-shrink-0" />
                    <span className="truncate">{currentDoc.hospital}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Extracted Diagnosis</span>
                <span className="text-sm font-extrabold text-cyan-950 block mt-0.5">
                  {currentDoc.diagnosis}
                </span>
              </div>
            </div>

            {/* Abnormal Values High-Priority Banner */}
            {abnormalLabsCount > 0 && (
              <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-900">
                      {abnormalLabsCount} Abnormal Laboratory Biomarker(s) Highlighted for Doctor Attention
                    </h5>
                    <p className="text-[11px] text-amber-700">
                      Out-of-range parameters are highlighted in red/amber below.
                    </p>
                  </div>
                </div>
                <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Action Needed
                </span>
              </div>
            )}

            {/* 1. Laboratory & Diagnostic Investigations Table */}
            {currentDoc.investigations && currentDoc.investigations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FlaskConical size={14} className="text-cyan-700" />
                    <span>Laboratory Investigations & Reference Ranges ({currentDoc.investigations.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Tap to edit</span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Test Name</th>
                        <th className="p-2.5">Observed Value</th>
                        <th className="p-2.5">Reference Range</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentDoc.investigations.map((inv, idx) => (
                        <tr key={idx} className={inv.isAbnormal ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-slate-50'}>
                          <td className="p-2.5 font-semibold text-slate-900">{inv.name}</td>
                          <td className="p-2.5 font-bold">
                            <span className={inv.isAbnormal ? 'text-red-700 font-black' : 'text-slate-800'}>
                              {inv.value} {inv.unit}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-500 font-mono">{inv.refRange} {inv.unit}</td>
                          <td className="p-2.5 text-right">
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                inv.status === 'HIGH'
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : inv.status === 'LOW'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Extracted Medicines (Prescriptions) */}
            {currentDoc.medicines && currentDoc.medicines.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Pill size={14} className="text-cyan-700" />
                  <span>Prescribed Medications ({currentDoc.medicines.length})</span>
                </h4>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Medicine Name</th>
                        <th className="p-2.5">Dosage</th>
                        <th className="p-2.5">Frequency</th>
                        <th className="p-2.5">Duration</th>
                        <th className="p-2.5">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {currentDoc.medicines.map((med, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{med.name}</td>
                          <td className="p-2.5 text-cyan-800 font-bold">{med.dosage}</td>
                          <td className="p-2.5 font-mono text-slate-700">{med.freq}</td>
                          <td className="p-2.5 text-slate-600">{med.duration}</td>
                          <td className="p-2.5 text-slate-500 text-[11px]">{med.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Procedures & Surgeries (If any) */}
            {currentDoc.procedures && currentDoc.procedures.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Activity size={14} className="text-purple-700" />
                  <span>Documented Surgical & Clinical Procedures</span>
                </h4>
                <div className="space-y-1.5">
                  {currentDoc.procedures.map((proc, idx) => (
                    <div key={idx} className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-purple-950 block">{proc.name}</span>
                        <span className="text-[11px] text-purple-800">{proc.outcome}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-bold">
                        {proc.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: AUTOMATIC LONGITUDINAL MEDICAL TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-cyan-100 text-cyan-800 text-xs font-bold px-3 py-1 rounded-full border border-cyan-300 mb-1">
                <History size={14} />
                <span>Automated Chronological Health Record Timeline</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                Patient Longitudinal Health History
              </h3>
              <p className="text-xs text-slate-500">
                Generated automatically from uploaded physical prescriptions, lab reports, and discharge summaries.
              </p>
            </div>

            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200">
              {timeline.length} Medical Milestones Detected
            </span>
          </div>

          {/* Timeline Visual Cards Flow */}
          <div className="relative pl-6 sm:pl-8 space-y-6 border-l-2 border-cyan-500/30 ml-3 sm:ml-4">
            {timeline.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Year Marker Badge on Timeline */}
                <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cyan-600 text-white font-black text-[11px] sm:text-xs flex items-center justify-center shadow-md ring-4 ring-white">
                  {idx + 1}
                </div>

                {/* Timeline Card */}
                <div className="p-5 bg-slate-50 hover:bg-cyan-50/40 border border-slate-200 rounded-3xl transition-all shadow-sm space-y-3 card-hover">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-cyan-900 font-mono">
                        {item.year}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-xs font-bold text-slate-500">
                        {item.date}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                        {item.docType}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">
                      {item.hospital}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                      {item.docTitle}
                    </h4>
                    <p className="text-xs text-slate-700 font-medium mt-1">
                      {item.timelineEvent.summary}
                    </p>
                  </div>

                  {/* Highlights of this timeline event */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {item.abnormalLabs.length > 0 && (
                      <span className="bg-red-50 text-red-700 border border-red-200 font-bold px-2 py-0.5 rounded-lg text-[11px] flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {item.abnormalLabs.length} Abnormal Lab Values
                      </span>
                    )}

                    {item.medicinesCount > 0 && (
                      <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold px-2 py-0.5 rounded-lg text-[11px]">
                        💊 {item.medicinesCount} Medicines Prescribed
                      </span>
                    )}

                    {item.procedures.length > 0 && (
                      <span className="bg-purple-50 text-purple-800 border border-purple-200 font-semibold px-2 py-0.5 rounded-lg text-[11px]">
                        🩺 Surgical Procedure Recorded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Disclaimer & Standards Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-cyan-700 flex-shrink-0" />
          <span>
            <strong>Document Processing Standards:</strong> Structured via MediMitra Clinical Extraction Engine. Formatted according to HL7 FHIR DiagnosticReport guidelines.
          </span>
        </div>
        <span className="text-emerald-700 font-bold whitespace-nowrap">
          FHIR R4 Standard ✓
        </span>
      </div>
    </div>
  );
};
