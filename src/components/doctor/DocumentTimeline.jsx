import React, { useState } from 'react';
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
  ShieldCheck 
} from 'lucide-react';
import { 
  standardClinicalDocuments, 
  generateMedicalTimeline 
} from '../../services/documentDigitizationService';

export const DocumentTimeline = ({ patient }) => {
  // If patient has documents, use them; fallback to standard clinical records
  const rawDocs = (patient?.documents && patient.documents.length > 0)
    ? patient.documents
    : standardClinicalDocuments;

  const [expandedDocId, setExpandedDocId] = useState(rawDocs[0]?.id || null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const timeline = generateMedicalTimeline(rawDocs);

  // Total abnormal labs across all documents
  const allAbnormalLabs = rawDocs.flatMap((d) => (d.investigations || []).filter((inv) => inv.isAbnormal));

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

      {/* 1. Longitudinal Biomarker Trends Widget */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <TrendingUp size={15} className="text-cyan-700" />
            <span>Longitudinal Health & Lab Biomarker Trends (2022 - 2026)</span>
          </h4>
          <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
            Multi-Year Progression
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* BP Trend */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
              <span>Systolic BP (mmHg)</span>
              <span className="text-red-600 font-black">174 (Today)</span>
            </div>
            <div className="flex items-end gap-2 h-14 pt-2">
              <div className="flex-1 bg-cyan-500 rounded-t h-2/5 flex items-center justify-center text-[9px] font-bold text-white">130</div>
              <div className="flex-1 bg-cyan-600 rounded-t h-3/5 flex items-center justify-center text-[9px] font-bold text-white">148</div>
              <div className="flex-1 bg-amber-500 rounded-t h-4/5 flex items-center justify-center text-[9px] font-bold text-white">168</div>
              <div className="flex-1 bg-red-500 rounded-t h-full flex items-center justify-center text-[9px] font-bold text-white">174</div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 pt-1 font-mono">
              <span>'22</span>
              <span>'24</span>
              <span>'25</span>
              <span>'26</span>
            </div>
          </div>

          {/* HbA1c Glycemic Trend */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
              <span>HbA1c Glycated Hb (%)</span>
              <span className="text-amber-700 font-black">8.9%</span>
            </div>
            <div className="flex items-end gap-2 h-14 pt-2">
              <div className="flex-1 bg-amber-400 rounded-t h-3/5 flex items-center justify-center text-[9px] font-bold text-white">7.2</div>
              <div className="flex-1 bg-amber-500 rounded-t h-3/4 flex items-center justify-center text-[9px] font-bold text-white">7.8</div>
              <div className="flex-1 bg-red-500 rounded-t h-full flex items-center justify-center text-[9px] font-bold text-white">10.2</div>
              <div className="flex-1 bg-amber-600 rounded-t h-4/5 flex items-center justify-center text-[9px] font-bold text-white">8.9</div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 pt-1 font-mono">
              <span>'22</span>
              <span>'23</span>
              <span>'25</span>
              <span>'26</span>
            </div>
          </div>

          {/* Serum Creatinine Trend */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
              <span>Serum Creatinine (mg/dL)</span>
              <span className="text-amber-700 font-black">1.6 (High)</span>
            </div>
            <div className="flex items-end gap-2 h-14 pt-2">
              <div className="flex-1 bg-cyan-500 rounded-t h-1/2 flex items-center justify-center text-[9px] font-bold text-white">0.9</div>
              <div className="flex-1 bg-cyan-600 rounded-t h-3/5 flex items-center justify-center text-[9px] font-bold text-white">1.1</div>
              <div className="flex-1 bg-amber-400 rounded-t h-4/5 flex items-center justify-center text-[9px] font-bold text-white">1.3</div>
              <div className="flex-1 bg-red-500 rounded-t h-full flex items-center justify-center text-[9px] font-bold text-white">1.6</div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 pt-1 font-mono">
              <span>'22</span>
              <span>'24</span>
              <span>'25</span>
              <span>'26</span>
            </div>
          </div>
        </div>
      </div>

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
                  {item.timelineEvent.summary}
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
                        {doc.hospital} • <span className="text-cyan-700 font-semibold">{doc.typeName || doc.type}</span>
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
                      OCR: {doc.ocrConfidence || 95}%
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
