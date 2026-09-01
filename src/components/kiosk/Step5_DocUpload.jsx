import React, { useState } from 'react';
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
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { 
  documentTypes, 
  standardClinicalDocuments, 
  processDocumentWithOcr 
} from '../../services/documentDigitizationService';
import { AudioPrompt } from '../common/AudioPrompt';

export const Step5_DocUpload = () => {
  const { kioskForm, setKioskForm, t, setKioskStep } = usePatient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeTypeFilter, setActiveTypeFilter] = useState('ALL');

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
    } catch (e) {
      console.error('Error digitizing document:', e);
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

  const handleFlatbedCameraCapture = () => {
    document.getElementById('flatbed-file-input')?.click();
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

  const filteredPresets = standardClinicalDocuments.filter((doc) => {
    return activeTypeFilter === 'ALL' || doc.type === activeTypeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="text-cyan-600" />
            <span>{t.uploadTitle}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Digitize previous Prescriptions, Lab test reports, Discharge summaries, and Radiology investigations.
          </p>
        </div>
        <AudioPrompt promptText="Please upload or scan your past medical records, prescriptions, or lab reports." />
      </div>

      {/* Real-time OCR Processing Status Banner */}
      {isProcessing && (
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4 animate-pulse border border-cyan-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cpu size={26} className="text-cyan-400 animate-spin" />
              <div>
                <h4 className="text-base font-bold text-cyan-300">
                  Optical Character Recognition & Clinical Entity Extraction
                </h4>
                <p className="text-xs text-slate-400">
                  Digitizing medical document into structured FHIR resources...
                </p>
              </div>
            </div>
            <span className="bg-cyan-950 text-cyan-300 border border-cyan-700 px-3 py-1 rounded-full text-xs font-mono font-bold">
              Stage {processingStage?.stage || 1} of 6
            </span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${((processingStage?.stage || 1) / 6) * 100}%`, backgroundColor: '#22d3ee' }}
                className="h-full transition-all duration-300 shadow-glow"
              />
            </div>
            <p className="text-xs font-mono text-cyan-200 font-semibold">
              ▸ {processingStage?.label || 'Processing document...'}
            </p>
          </div>
        </div>
      )}

      {/* Mobile-Specific Direct Capture & Upload Card (<md screens) */}
      <div className="block md:hidden bg-white p-5 rounded-3xl border-2 border-cyan-300 shadow-sm space-y-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-md border border-cyan-200">
            Mobile Document Upload
          </span>
          <h3 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <Camera className="text-cyan-700" size={18} />
            <span>Upload or Photograph Prescription / Report</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Photograph your paper prescription directly or select previous lab reports from your phone.
          </p>
        </div>

        {/* Hidden inputs for Camera, Gallery, and PDF */}
        <input
          type="file"
          id="mobile-camera-capture"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          type="file"
          id="mobile-gallery-upload"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          type="file"
          id="mobile-pdf-upload"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* 3 Large Mobile Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => document.getElementById('mobile-camera-capture')?.click()}
            className="p-3.5 min-h-[48px] bg-cyan-700 hover:bg-cyan-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
          >
            <Camera size={18} />
            <span>Take Photo (Camera)</span>
          </button>

          <button
            type="button"
            onClick={() => document.getElementById('mobile-gallery-upload')?.click()}
            className="p-3.5 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-300 active:scale-98 cursor-pointer"
          >
            <UploadCloud size={18} className="text-cyan-700" />
            <span>Upload from Device</span>
          </button>

          <button
            type="button"
            onClick={() => document.getElementById('mobile-pdf-upload')?.click()}
            className="p-3.5 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-300 active:scale-98 cursor-pointer"
          >
            <FileText size={18} className="text-cyan-700" />
            <span>Choose PDF File</span>
          </button>
        </div>
      </div>

      {/* Hidden flatbed file input */}
      <input
        id="flatbed-file-input"
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Supported Document Types Guidance */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <ShieldCheck size={18} className="text-cyan-700" />
          <span>Supported Document Categories for Automated OCR Digitization:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {documentTypes.map((dt) => (
            <div key={dt.id} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <h4 className="text-xs font-extrabold text-slate-900">{dt.name}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{dt.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Upload Zone & Flatbed Camera Scanner (>=md screens - 100% Preserved) */}
      <div className="hidden md:grid md:grid-cols-2 gap-4">
        {/* Drag & Drop File Upload */}
        <label className="border-2 border-dashed border-slate-300 hover:border-cyan-500 bg-white p-8 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all group card-hover shadow-sm">
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="w-16 h-16 bg-slate-100 group-hover:bg-cyan-50 text-slate-500 group-hover:text-cyan-600 rounded-2xl flex items-center justify-center mb-3 transition-colors">
            <UploadCloud size={34} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {t.dropFiles}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Supports PDF, JPG, PNG from mobile or physical records
          </p>
          <span className="mt-3 px-3 py-1 bg-slate-100 group-hover:bg-cyan-600 group-hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-colors">
            Browse Document Files
          </span>
        </label>

        {/* Physical Camera Scan Surface */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-3 shadow-sm">
          <div className="w-16 h-16 bg-cyan-100 text-cyan-700 rounded-2xl flex items-center justify-center">
            <Camera size={34} className={isCameraActive ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {isCameraActive ? 'Scanning Paper Prescription...' : 'Kiosk Document Flatbed Camera Scanner'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Place paper prescriptions or lab printouts under the kiosk scanning tray
            </p>
          </div>
          <button
            type="button"
            onClick={handleFlatbedCameraCapture}
            disabled={isCameraActive}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow"
          >
            <Camera size={16} />
            <span>{isCameraActive ? 'Scanning High-Resolution Image...' : 'Capture Photo from Flatbed'}</span>
          </button>
        </div>
      </div>

      {/* Currently Attached & Digitized Documents List */}
      {kioskForm.uploadedDocs.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileCheck className="text-emerald-600" size={20} />
              <h3 className="text-sm font-bold text-slate-900">
                Digitized Medical Documents ({kioskForm.uploadedDocs.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setKioskStep(6)}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>View Extractions & Timeline</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-2">
            {kioskForm.uploadedDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-100 text-cyan-800 rounded-xl">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-extrabold text-slate-900">{doc.title}</h5>
                      <span className="text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.2 rounded">
                        {doc.year || '2026'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {doc.hospital} • {doc.typeName || doc.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-[11px]">
                    <span className="text-emerald-700 font-bold block">
                      ✓ Extracted: {doc.medicines?.length || 0} Rx • {doc.investigations?.length || 0} Labs
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      Confidence: {doc.ocrConfidence || 95}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(doc.id)}
                    className="text-slate-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors"
                    title="Remove document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
