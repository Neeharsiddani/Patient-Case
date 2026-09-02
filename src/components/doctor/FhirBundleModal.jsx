import React, { useState, useEffect } from 'react';
import { 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Copy, 
  Send, 
  X, 
  ShieldCheck, 
  Layers, 
  Building2,
  Server,
  Sparkles,
  Info
} from 'lucide-react';
import { ApiService } from '../../services/api';

export const FhirBundleModal = ({ patient, isOpen, onClose }) => {
  const [fhirBundle, setFhirBundle] = useState(null);
  const [validationReport, setValidationReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [hisDispatchResult, setHisDispatchResult] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [activeTab, setActiveTab] = useState('resources'); // 'resources' | 'raw_json' | 'validation'

  useEffect(() => {
    if (!isOpen || !patient?.id) return;

    let isMounted = true;
    setLoading(true);
    setHisDispatchResult(null);

    const fetchFhirData = async () => {
      try {
        const bundleRes = await fetch(`/api/fhir/patient/${patient.id}`);
        if (bundleRes.ok) {
          const bundleJson = await bundleRes.json();
          if (isMounted) setFhirBundle(bundleJson);
        }

        const valRes = await fetch(`/api/fhir/patient/${patient.id}/validate`);
        if (valRes.ok) {
          const valJson = await valRes.json();
          if (isMounted) setValidationReport(valJson.validation);
        }
      } catch (err) {
        console.warn('FHIR fetch notice:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFhirData();
    return () => { isMounted = false; };
  }, [isOpen, patient?.id]);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    if (!fhirBundle) return;
    navigator.clipboard.writeText(JSON.stringify(fhirBundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadJson = () => {
    if (!fhirBundle) return;
    const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/fhir+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FHIR_R4_Bundle_${patient?.name?.replace(/\s+/g, '_') || 'Patient'}_${patient?.id?.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDispatchHis = async () => {
    if (!patient?.id) return;
    setDispatching(true);
    setHisDispatchResult(null);
    try {
      const res = await fetch(`/api/his/dispatch/${patient.id}`, { method: 'POST' });
      const data = await res.json();
      setHisDispatchResult(data);
    } catch (err) {
      setHisDispatchResult({
        success: false,
        status: 'HIS_NETWORK_ERROR',
        message: err.message
      });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-600/30 text-cyan-400 rounded-2xl border border-cyan-500/30">
              <FileCode size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-wide">
                  ABDM FHIR R4 Document Bundle
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  HL7 FHIR Release 4
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Patient: <strong className="text-white">{patient?.name}</strong> • Hospital: <strong className="text-cyan-200">{patient?.hospital_name || patient?.hospitalName || 'Hospital not recorded'}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Tabs & Top Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('resources')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'resources' ? 'bg-white text-cyan-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resources & Provenance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('validation')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'validation' ? 'bg-white text-cyan-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Validation</span>
              {validationReport?.isValid && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('raw_json')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'raw_json' ? 'bg-white text-cyan-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Raw FHIR JSON
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Copy size={13} />
              <span>{copied ? 'Copied ✓' : 'Copy JSON'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadJson}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Download size={13} />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={handleDispatchHis}
              disabled={dispatching}
              style={{ backgroundColor: '#088395' }}
              className="px-3.5 py-1.5 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Send size={13} />
              <span>{dispatching ? 'Dispatching...' : 'Dispatch to HIS'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* HIS Dispatch Result Notification Banner */}
          {hisDispatchResult && (
            <div className={`p-4 rounded-2xl text-xs border space-y-1 ${
              hisDispatchResult.status === 'HIS_DISPATCHED_SUCCESS'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-center justify-between font-extrabold">
                <span className="flex items-center gap-1.5">
                  {hisDispatchResult.status === 'HIS_DISPATCHED_SUCCESS' ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <Info size={16} className="text-amber-600" />
                  )}
                  <span>HIS Adapter Status: {hisDispatchResult.status}</span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {hisDispatchResult.fhirBundleId}
                </span>
              </div>
              <p className="leading-relaxed pl-5">
                {hisDispatchResult.message}
              </p>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Generating ABDM FHIR R4 Resource Tree...</p>
            </div>
          ) : activeTab === 'resources' ? (
            <div className="space-y-4">
              {/* Provenance Key */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                <span className="font-extrabold text-slate-700">Provenance Standards:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                    [PATIENT-REPORTED]
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                    [MACHINE-EXTRACTED]
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                    [CLINICIAN-VERIFIED]
                  </span>
                </div>
              </div>

              {/* Resource Entries Tree */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fhirBundle?.entry?.map((entry, idx) => {
                  const res = entry.resource;
                  const tag = res.meta?.tag?.[0]?.code || 'SYSTEM';

                  return (
                    <div
                      key={entry.fullUrl || idx}
                      className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-cyan-400 transition-all space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-cyan-900 flex items-center gap-1.5">
                          <Layers size={14} className="text-cyan-600" />
                          <span>{res.resourceType}</span>
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          tag === 'CLINICIAN_VERIFIED' 
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : tag === 'MACHINE_EXTRACTED'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {tag.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 font-mono">
                        <p className="truncate text-slate-400 text-[11px]">ID: {res.id}</p>
                        {res.resourceType === 'Patient' && (
                          <p className="font-sans font-semibold text-slate-800">
                            {res.name?.[0]?.text} ({res.gender}, {patient?.age} Y) • ABHA: {patient?.abha_id || 'Unregistered'}
                          </p>
                        )}
                        {res.resourceType === 'Composition' && (
                          <p className="font-sans font-semibold text-slate-800">
                            {res.title} • Status: <strong className="text-cyan-800">{res.status}</strong>
                          </p>
                        )}
                        {res.resourceType === 'Condition' && (
                          <p className="font-sans font-semibold text-slate-800">
                            {res.code?.text || res.code?.coding?.[0]?.display} ({res.verificationStatus?.coding?.[0]?.code})
                          </p>
                        )}
                        {res.resourceType === 'Observation' && (
                          <p className="font-sans font-semibold text-slate-800">
                            {res.code?.coding?.[0]?.display || 'Vital Sign'} • Status: {res.status}
                          </p>
                        )}
                        {res.resourceType === 'DocumentReference' && (
                          <p className="font-sans font-semibold text-slate-800 truncate">
                            {res.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'validation' ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${
                validationReport?.isValid ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-red-50 border-red-300 text-red-950'
              }`}>
                <div className="flex items-center gap-2 font-extrabold text-sm">
                  {validationReport?.isValid ? (
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={20} className="text-red-600" />
                  )}
                  <span>
                    {validationReport?.isValid 
                      ? 'VALID ABDM FHIR R4 DOCUMENT BUNDLE' 
                      : 'FHIR Validation Errors Detected'}
                  </span>
                </div>
                <p className="text-xs mt-1 pl-7 text-slate-600">
                  Validated against National Health Authority (NHA) & NRCeS India FHIR Release 4 Document Profiles.
                </p>
              </div>

              {/* Resource Counts Summary Table */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Resource Counts in Document Bundle ({validationReport?.summary?.totalEntries || 0} Total):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Object.entries(validationReport?.summary?.resourceCounts || {}).map(([rType, count]) => (
                    <div key={rType} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-700">{rType}</span>
                      <span className="font-mono font-extrabold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 text-cyan-300 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-[450px]">
              <pre>{JSON.stringify(fhirBundle, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
