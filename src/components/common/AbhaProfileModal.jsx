import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  User, 
  Phone, 
  Calendar, 
  FileText, 
  Activity, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Sparkles, 
  ExternalLink,
  Info,
  Maximize2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { QrZoomModal } from './QrZoomModal';

export const AbhaProfileModal = ({ patient, onClose }) => {
  const [showQrModal, setShowQrModal] = useState(false);
  if (!patient) return null;

  const isConsentGranted = patient.consentAgreed || patient.consentStatus === 'Granted' || patient.verificationStatus === 'History Verified';
  const docsCount = patient.documents?.length || 0;
  const historyCompleted = Boolean(patient.chiefComplaints && patient.chiefComplaints.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative my-auto max-h-[92vh] flex flex-col border border-slate-200">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
              AB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">
                  ABHA Digital Health Profile
                </h3>
                <span className="bg-cyan-950 text-cyan-300 border border-cyan-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                  ABDM Digital Health Profile
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ayushman Bharat Digital Mission (ABDM) • National Health Authority
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Verification Standards Banner */}
        <div className="bg-cyan-50 border-b border-cyan-200 px-4 sm:px-5 py-2 text-[11px] text-cyan-900 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <Info size={14} className="text-cyan-700 flex-shrink-0" />
            <span>ABDM Digital Health Card — Formatted for ABDM M1/M2/M3 Standards</span>
          </div>
          <span className="font-bold text-cyan-800 hidden sm:inline">FHIR R4 Standard</span>
        </div>

        {/* ABHA Card Surface */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Card Body */}
          <div 
            style={{ background: 'linear-gradient(135deg, #0A4D68 0%, #088395 100%)' }}
            className="rounded-3xl p-6 text-white shadow-xl relative overflow-hidden space-y-4"
          >
            {/* Top Row: Emblems */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-200 block">
                  Government of India • Ministry of Health
                </span>
                <h4 className="text-base font-extrabold tracking-tight">
                  Ayushman Bharat Health Account (ABHA)
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                <ShieldCheck size={24} className="text-cyan-200" />
              </div>
            </div>

            {/* Middle Row: Photo/Avatar, Name, ABHA ID */}
            <div className="flex items-center gap-4 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-white text-slate-900 font-extrabold text-xl flex items-center justify-center shadow-md flex-shrink-0 border-2 border-cyan-200">
                {patient.name?.charAt(0) || 'P'}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-lg font-black">{patient.name}</h3>
                <p className="text-xs text-cyan-100 font-medium">
                  {patient.age} Years • {patient.gender}
                </p>
                <div className="pt-1">
                  <span className="text-[10px] font-mono text-cyan-200 block uppercase">14-Digit ABHA Number</span>
                  <span className="text-base font-black font-mono tracking-wider text-white">
                    {patient.abhaId}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Row: ABHA Address & QR Code */}
            <div className="flex items-end justify-between pt-2 border-t border-cyan-400/30">
              <div>
                <span className="text-[10px] text-cyan-200 block">ABHA Address / PHR Handle</span>
                <span className="text-xs font-mono font-bold text-white">
                  {patient.abhaAddress || `${patient.name?.toLowerCase().replace(/\s+/g, '')}@abdm`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                title="Click to enlarge ABHA QR code"
                className="p-1 bg-white rounded-xl shadow-md flex items-center justify-center cursor-pointer transition-all hover:scale-110 group relative border border-white/40"
              >
                <QRCodeSVG 
                  value={JSON.stringify({
                    hidn: patient.abhaId,
                    hid: patient.abhaAddress || `${patient.name?.toLowerCase().replace(/\s+/g, '')}@abdm`,
                    name: patient.name,
                    gender: patient.gender === 'Male' ? 'M' : patient.gender === 'Female' ? 'F' : 'O',
                    age: patient.age,
                    mobile: patient.phone || '',
                    address: patient.address || ''
                  })}
                  size={46}
                  level="M"
                  includeMargin={false}
                />
                <div className="absolute inset-0 bg-black/10 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Maximize2 size={14} className="text-slate-900 bg-white/90 p-0.5 rounded" />
                </div>
              </button>
            </div>
          </div>

          {/* Enlarged QR Modal */}
          <QrZoomModal
            isOpen={showQrModal}
            onClose={() => setShowQrModal(false)}
            value={JSON.stringify({
              hidn: patient.abhaId,
              hid: patient.abhaAddress || `${patient.name?.toLowerCase().replace(/\s+/g, '')}@abdm`,
              name: patient.name,
              gender: patient.gender === 'Male' ? 'M' : patient.gender === 'Female' ? 'F' : 'O',
              age: patient.age,
              mobile: patient.phone || '',
              address: patient.address || ''
            })}
            title="Official ABHA Health ID QR"
            tokenNumber={patient.abhaId}
            patientName={patient.name}
            subtitle={`PHR: ${patient.abhaAddress || `${patient.name?.toLowerCase().replace(/\s+/g, '')}@abdm`} • ${patient.age} Y / ${patient.gender}`}
          />

          {/* 4 Core Status Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Consent Status */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Consent Status
              </span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span className="text-xs font-extrabold text-emerald-800">
                  {isConsentGranted ? 'Consent Granted ✓' : 'Pending Consent'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Authorized for today's OPD consultation & record linking
              </p>
            </div>

            {/* 2. Clinical History Status */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Clinical History Status
              </span>
              <div className="flex items-center gap-1.5">
                <Activity size={16} className="text-cyan-700" />
                <span className="text-xs font-extrabold text-slate-900">
                  {historyCompleted ? 'Completed (10/10)' : 'In-Progress'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Primary: {patient.chiefComplaints?.[0]?.slice(0, 24) || 'General Intake'}...
              </p>
            </div>

            {/* 3. Document Status */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Digitized Documents
              </span>
              <div className="flex items-center gap-1.5">
                <FileText size={16} className="text-purple-700" />
                <span className="text-xs font-extrabold text-slate-900">
                  {docsCount} Document(s)
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                AI OCR & Biomarker extraction active
              </p>
            </div>
          </div>

          {/* Privacy & Security Metadata */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Lock size={14} className="text-cyan-700" />
              <span>Data Protection & Privacy Safeguards</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-500">
              <li>• Protected under the <strong>Digital Personal Data Protection (DPDP) Act 2023</strong>.</li>
              <li>• 256-bit AES encryption applied to all health data payloads in transit and at rest.</li>
              <li>• Medical data is shared strictly for the purpose of consultation with the assigned medical officer.</li>
            </ul>
          </div>
        </div>

        {/* Footer Close */}
        <div className="bg-slate-100 p-4 flex items-center justify-between text-xs border-t border-slate-200">
          <span className="text-slate-500 font-mono text-[10px]">
            NODE: AIIMS-OPD-KIOSK-04
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
