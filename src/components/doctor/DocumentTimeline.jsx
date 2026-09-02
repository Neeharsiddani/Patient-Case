import React, { useState, useEffect } from 'react';
import { 
  History, 
  FileText, 
  TrendingUp, 
  Calendar, 
  Building2, 
  Eye, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Pill, 
  FlaskConical, 
  Activity, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { 
  generateMedicalTimeline 
} from '../../services/documentDigitizationService';
import { ApiService } from '../../services/api';

/**
 * Normalizes document record into a uniform schema regardless of origin
 * (Client-side kiosk upload, initial state, or server SQLite backend)
 */
const normalizeDoc = (d) => {
  const extracted = d.extractedData || {};
  return {
    id: d.id || `doc-${Math.random().toString(36).slice(2, 8)}`,
    title: d.title || d.originalFilename || 'Medical Record',
    docType: d.docType || d.type || 'document',
    typeName: d.typeName || (d.docType === 'lab_report' ? 'Lab Test Report' : d.docType === 'prescription' ? 'Prescription Slip' : d.docType === 'discharge_summary' ? 'Discharge Summary' : 'Clinical Document'),
    date: d.date || d.docDate || '',
    year: d.year || d.docYear || (d.docDate ? d.docDate.slice(0, 4) : (d.date ? d.date.split(/[\/\-\.]/)[2] : 'Recent')),
    hospital: d.hospital || d.hospitalName || 'Healthcare Facility',
    doctor: d.doctor || d.doctorName || 'Attending Physician',
    diagnosis: d.diagnosis || extracted.diagnosis || 'Digitized clinical record',
    ocrConfidence: d.ocrConfidence ?? d.ocr_confidence ?? null,
    verificationStatus: d.verificationStatus || d.verification_status || 'MACHINE_EXTRACTED_UNVERIFIED',
    investigations: d.investigations || extracted.investigations || [],
    medicines: d.medicines || extracted.medicines || [],
    procedures: d.procedures || extracted.procedures || [],
    rawOcrText: d.rawOcrText || extracted.rawOcrText || '',
    timelineEvent: d.timelineEvent
  };
};

export const DocumentTimeline = ({ patient }) => {
  const [documents, setDocuments] = useState(patient?.documents || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedDocId, setExpandedDocId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!patient?.id) {
      setDocuments([]);
      setError(null);
      return;
    }

    // Initialize with patient.documents if already loaded in context/prop
    if (Array.isArray(patient.documents)) {
      setDocuments(patient.documents);
      if (patient.documents.length > 0) {
        setExpandedDocId(patient.documents[0].id);
      }
    }

    // Fetch from backend API to ensure real-time synchronization
    const fetchPatientDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await ApiService.getPatientDocuments(patient.id);
        if (isMounted) {
          if (res && res.success && Array.isArray(res.documents)) {
            setDocuments(res.documents);
            if (res.documents.length > 0 && !expandedDocId) {
              setExpandedDocId(res.documents[0].id);
            }
          } else if (Array.isArray(patient.documents)) {
            setDocuments(patient.documents);
          } else {
            setDocuments([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          // If we already have patient.documents in memory from context, keep them
          if (Array.isArray(patient.documents) && patient.documents.length > 0) {
            setDocuments(patient.documents);
          } else {
            setDocuments([]);
            setError('Unable to load medical records. Please try again.');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPatientDocs();

    return () => {
      isMounted = false;
    };
  }, [patient?.id]);

  const rawDocs = documents.map(normalizeDoc);
  const timeline = generateMedicalTimeline(rawDocs);

  // Abnormal lab investigations across all genuine patient documents
  const allAbnormalLabs = rawDocs.flatMap((d) => 
    (d.investigations || []).filter((inv) => inv.isAbnormal)
  );

  // Extract all genuine lab tests with values from uploaded documents
  const allGenuineLabs = rawDocs.flatMap((d) => 
    (d.investigations || []).map((inv) => ({ ...inv, docYear: d.year, docDate: d.date, hospital: d.hospital }))
  );

  const handleVerifyDocument = async (docId, diagnosis, docDate) => {
    try {
      if (docId) {
        await fetch(`/api/documents/${docId}/verify`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(ApiService.getAuthToken() ? { Authorization: `Bearer ${ApiService.getAuthToken()}` } : {})
          },
          body: JSON.stringify({ diagnosis, docDate })
        });
      }
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, verificationStatus: 'VERIFIED_BY_CLINICIAN' } : d))
      );
    } catch (err) {
      console.error('Verification failed:', err);
    }
  };

  // 1. Error State
  if (error && rawDocs.length === 0) {
    return (
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-red-200 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
          <AlertTriangle size={28} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-red-900">
            Unable to load medical records. Please try again.
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            An error occurred while connecting to the medical records repository or verifying hospital permissions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (patient?.id) {
              setLoading(true);
              setError(null);
              ApiService.getPatientDocuments(patient.id)
                .then((res) => {
                  setDocuments(res.documents || []);
                })
                .catch(() => {
                  setError('Unable to load medical records. Please try again.');
                })
                .finally(() => setLoading(false));
            }
          }}
          className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  // 2. Loading State
  if (loading && rawDocs.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
        <div className="w-10 h-10 mx-auto rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 animate-spin">
          <History size={20} />
        </div>
        <p className="text-xs font-semibold text-slate-600">Loading digitized medical records...</p>
      </div>
    );
  }

  // 3. Clean Empty State (Zero Persisted Documents)
  if (rawDocs.length === 0) {
    return (
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
          <FileText size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-800 font-heading">
            No past digitized medical records
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Documents uploaded during this consultation will appear here.
          </p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-lg mx-auto text-left space-y-1.5">
          <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
            <Sparkles size={14} className="text-cyan-700" />
            <span>Consultation Record Status:</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            No previous paper prescriptions, lab test reports, or diagnostic scans were attached by this patient during intake. If physical records are available, they can be digitized via the intake kiosk flatbed scanner or mobile document upload.
          </p>
        </div>
      </div>
    );
  }

  // 4. Populated State with Genuinely Uploaded Documents
  return (
    <div className="space-y-5">
      {/* Abnormal Values High-Priority Attention Banner for Doctor */}
      {allAbnormalLabs.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-600 animate-pulse" size={20} />
              <h4 className="text-xs font-black uppercase tracking-wider text-red-900">
                Abnormal Laboratory Biomarkers Requiring Clinical Attention ({allAbnormalLabs.length})
              </h4>
            </div>
            <span className="text-[10px] font-extrabold bg-red-600 text-white px-2.5 py-0.5 rounded-full">
              Doctor Review
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {allAbnormalLabs.slice(0, 6).map((inv, idx) => (
              <div key={idx} className="p-2.5 bg-white rounded-xl border border-red-200 text-xs flex justify-between items-center shadow-xs">
                <div>
                  <span className="font-bold text-slate-800 block">{inv.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Ref: {inv.refRange} {inv.unit}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-red-700 block text-xs">{inv.value} {inv.unit}</span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-red-100 text-red-800">
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Verified Biomarker Panel from Genuine Patient Records */}
      {allGenuineLabs.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <TrendingUp size={15} className="text-cyan-700" />
              <span>Extracted Laboratory Biomarkers ({allGenuineLabs.length} Parameters)</span>
            </h4>
            <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
              Digitized Lab Panels
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allGenuineLabs.slice(0, 6).map((inv, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                  <span className="truncate pr-2">{inv.name}</span>
                  <span className={inv.isAbnormal ? 'text-red-600 font-black' : 'text-slate-800 font-bold'}>
                    {inv.value} {inv.unit}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                  <span>Ref: {inv.refRange} {inv.unit}</span>
                  <span className="font-medium text-slate-500">{inv.docYear || 'Recent'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Automated Chronological Medical Timeline Flow */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-cyan-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Automated Longitudinal Timeline ({timeline.length} Recorded Milestones)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Digitized from physical hospital records
          </span>
        </div>

        {/* Chronological Timeline List */}
        <div className="relative pl-6 sm:pl-8 space-y-4 border-l-2 border-cyan-500/30 ml-2">
          {timeline.map((item, idx) => (
            <div key={idx} className="relative">
              {/* Year Marker Pin */}
              <div className="absolute -left-[33px] sm:-left-[41px] top-1 w-7 h-7 rounded-full bg-cyan-700 text-white font-black text-[10px] flex items-center justify-center shadow ring-4 ring-white">
                {idx + 1}
              </div>

              {/* Event Box */}
              <div className="p-4 bg-slate-50/80 hover:bg-white border border-slate-200 rounded-2xl transition-all shadow-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-cyan-950 font-mono">
                      {item.year}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-slate-600">
                      {item.date}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.2 rounded-full bg-cyan-100 text-cyan-800">
                      {item.docType}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {item.hospital}
                  </span>
                </div>

                <p className="text-xs text-slate-800 font-semibold">
                  {item.timelineEvent?.summary || item.diagnosis}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.abnormalLabs.length > 0 && (
                    <span className="bg-red-50 text-red-700 border border-red-200 font-bold px-2 py-0.5 rounded text-[10px]">
                      ⚠️ {item.abnormalLabs.length} Abnormal Lab Values
                    </span>
                  )}
                  {item.medicinesCount > 0 && (
                    <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold px-2 py-0.5 rounded text-[10px]">
                      💊 {item.medicinesCount} Medicines
                    </span>
                  )}
                  {item.procedures.length > 0 && (
                    <span className="bg-purple-50 text-purple-800 border border-purple-200 font-semibold px-2 py-0.5 rounded text-[10px]">
                      🩺 Procedure Recorded
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Detailed Digitized Records with Full Extracted Entities */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <FileText size={15} className="text-cyan-700" />
          <span>Extracted Structured Document Records ({rawDocs.length})</span>
        </h4>

        <div className="space-y-3">
          {rawDocs.map((doc) => {
            const isExpanded = expandedDocId === doc.id;
            const docAbnormalLabs = (doc.investigations || []).filter((inv) => inv.isAbnormal);

            return (
              <div
                key={doc.id}
                className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition-all"
              >
                {/* Document Header Accordion Bar */}
                <div
                  onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                  className="p-4 bg-slate-50 hover:bg-slate-100/70 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-100 text-cyan-800 rounded-xl">
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-extrabold text-slate-900">{doc.title}</h5>
                        <span className="text-[10px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.2 rounded">
                          {doc.year}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {doc.hospital} • <span className="text-cyan-700 font-semibold">{doc.typeName || doc.docType}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {docAbnormalLabs.length > 0 && (
                      <span className="hidden sm:inline-block bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200">
                        {docAbnormalLabs.length} Abnormal Labs
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">
                      OCR: {doc.ocrConfidence != null ? `${doc.ocrConfidence}%` : 'Confidence unavailable'}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-5 bg-white border-t border-slate-200 space-y-4 text-xs">
                    {/* Diagnosis & Facility */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Extracted Diagnosis:</span>
                      <span className="font-extrabold text-slate-900 text-sm">{doc.diagnosis}</span>
                    </div>

                    {/* Labs Table */}
                    {doc.investigations && doc.investigations.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-bold text-slate-700 block uppercase text-[11px] flex items-center gap-1">
                          <FlaskConical size={13} className="text-cyan-700" />
                          <span>Extracted Laboratory Investigations:</span>
                        </span>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              <tr>
                                <th className="p-2">Test Name</th>
                                <th className="p-2">Value</th>
                                <th className="p-2">Ref Range</th>
                                <th className="p-2 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {doc.investigations.map((inv, iIdx) => (
                                <tr key={iIdx} className={inv.isAbnormal ? 'bg-red-50/60 font-bold' : ''}>
                                  <td className="p-2 text-slate-900">{inv.name}</td>
                                  <td className="p-2">
                                    <span className={inv.isAbnormal ? 'text-red-700 font-black' : 'text-slate-800'}>
                                      {inv.value} {inv.unit}
                                    </span>
                                  </td>
                                  <td className="p-2 text-slate-500 font-mono">{inv.refRange} {inv.unit}</td>
                                  <td className="p-2 text-right">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                      inv.status === 'HIGH' ? 'bg-red-100 text-red-800' : inv.status === 'LOW' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
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

                    {/* Medicines Table */}
                    {doc.medicines && doc.medicines.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-bold text-slate-700 block uppercase text-[11px] flex items-center gap-1">
                          <Pill size={13} className="text-cyan-700" />
                          <span>Extracted Prescription Medications:</span>
                        </span>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              <tr>
                                <th className="p-2">Medicine Name</th>
                                <th className="p-2">Dosage</th>
                                <th className="p-2">Frequency</th>
                                <th className="p-2">Duration</th>
                                <th className="p-2">Instructions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {doc.medicines.map((med, mIdx) => (
                                <tr key={mIdx}>
                                  <td className="p-2 font-bold text-slate-900">{med.name}</td>
                                  <td className="p-2 text-cyan-800 font-bold">{med.dosage}</td>
                                  <td className="p-2 font-mono text-slate-700">{med.freq}</td>
                                  <td className="p-2 text-slate-600">{med.duration}</td>
                                  <td className="p-2 text-slate-500 text-[11px]">{med.instructions}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Raw OCR Text Viewer (Preserving Original Text) */}
                    {doc.rawOcrText && (
                      <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl space-y-1.5 border border-slate-700">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1">
                            <span>📄 Preserved Raw OCR Text Stream</span>
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            Engine Confidence: {doc.ocrConfidence != null ? `${doc.ocrConfidence}%` : 'Confidence unavailable'}
                          </span>
                        </div>
                        <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                          {doc.rawOcrText}
                        </pre>
                      </div>
                    )}

                    {/* Clinician Review & Verification Footer */}
                    <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                          doc.verificationStatus === 'VERIFIED_BY_CLINICIAN'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                        }`}>
                          {doc.verificationStatus === 'VERIFIED_BY_CLINICIAN'
                            ? '✓ Clinician Verified Record'
                            : '⚠️ Machine-Extracted (Pending Doctor Review)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.verificationStatus !== 'VERIFIED_BY_CLINICIAN' && (
                          <button
                            type="button"
                            onClick={() => handleVerifyDocument(doc.id, doc.diagnosis, doc.date)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <ShieldCheck size={14} />
                            <span>Verify & Sign Document</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
