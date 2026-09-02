import React, { useRef, useState } from 'react';
import { 
  Ticket, 
  Printer, 
  Building2, 
  Stethoscope, 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { usePatient } from '../../context/PatientContext';
import { TriageBadge } from '../common/TriageBadge';
import { printElement } from '../../utils/printUtility';
import { QrZoomModal } from '../common/QrZoomModal';

export const Step9_TokenReceipt = () => {
  const { kioskForm, t, resetKiosk, setRole, setSelectedPatientId } = usePatient();
  const slipRef = useRef(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const tokenData = kioskForm.generatedToken || {
    tokenNumber: kioskForm.generatedToken?.tokenNumber || 'Token pending generation',
    roomNumber: kioskForm.roomNumber || 'Room pending assignment',
    assignedDoctor: kioskForm.assignedDoctor || 'Assigned on arrival',
    department: kioskForm.selectedDepartmentName || kioskForm.assignedDepartment || 'General OPD',
    waitTime: 'Calculated on arrival',
    name: kioskForm.name || 'Patient Name Not Recorded',
    abhaId: kioskForm.abhaId || 'Walk-in (No ABHA)',
    triageLevel: kioskForm.triageLevel || 4,
    triageCategory: kioskForm.triageCategory || 'Routine / Standard',
    triageColor: kioskForm.triageColor || 'green',
    id: null
  };

  const handlePrint = () => {
    if (slipRef.current) {
      printElement(slipRef.current, `MediMitra OPD Token - ${tokenData.tokenNumber}`);
    } else {
      window.print();
    }
  };

  const handleGoToDoctor = () => {
    if (tokenData.id) {
      setSelectedPatientId(tokenData.id);
    }
    setRole('doctor');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-lg mx-auto space-y-2 border-b border-slate-200 pb-4">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300">
          <ShieldCheck size={14} />
          <span>Case Registered & Transmitted to Doctor Workstation</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900">
          {t.tokenTitle}
        </h2>
        <p className="text-xs text-slate-500">{t.tokenSub}</p>
      </div>

      {/* Official Printable OPD Slip Card */}
      <div 
        id="printable-opd-slip"
        ref={slipRef}
        className="max-w-md mx-auto bg-white rounded-3xl border-2 border-slate-300 shadow-xl overflow-hidden relative"
      >
        {/* Slip Top Header */}
        <div 
          style={{ background: 'linear-gradient(135deg, #0A4D68 0%, #088395 100%)' }}
          className="p-6 text-white text-center relative"
        >
          <p className="text-[10px] uppercase font-bold tracking-widest text-cyan-200">
            Government of India • National Health Authority
          </p>
          <h3 className="text-base font-extrabold mt-0.5">
            {tokenData.hospitalName || tokenData.hospital_name || kioskForm.selectedHospitalName || 'Hospital not recorded'}
          </h3>
          <p className="text-[11px] text-cyan-100 mt-0.5">
            ABDM Smart Outpatient Intake Token Pass
          </p>

          <div className="mt-4 bg-white text-slate-900 rounded-2xl p-4 shadow-lg border border-cyan-100 inline-block w-full">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.tokenNumber}
            </span>
            <span className="text-4xl font-black text-cyan-800 tracking-tight block my-1">
              {tokenData.tokenNumber}
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <TriageBadge level={tokenData.triageLevel} category={tokenData.triageCategory} color={tokenData.triageColor} size="sm" />
            </div>
          </div>
        </div>

        {/* Slip Details Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-100 pb-3">
            <div>
              <span className="text-slate-400 block text-[10px]">Patient Name</span>
              <span className="font-bold text-slate-800 text-sm">{tokenData.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ABHA ID</span>
              <span className="font-mono font-bold text-cyan-800">{tokenData.abhaId}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-100 pb-3">
            <div>
              <span className="text-slate-400 block text-[10px]">{t.department}</span>
              <span className="font-bold text-slate-800">{tokenData.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{t.roomNumber}</span>
              <span className="font-bold text-cyan-700 text-sm">{tokenData.roomNumber}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px]">{t.assignedDoctor}</span>
              <span className="font-bold text-slate-800">{tokenData.assignedDoctor}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">{t.estWaitTime}</span>
              <span className="font-bold text-emerald-700">{tokenData.waitTime}</span>
            </div>
          </div>

          {/* QR Barcode & Security Stamp */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                title="Click to enlarge QR code"
                className="p-1 bg-white rounded-xl border-2 border-slate-300 hover:border-cyan-600 shadow-xs flex items-center justify-center cursor-pointer transition-all hover:scale-105 group relative"
              >
                <QRCodeSVG 
                  value={JSON.stringify({
                    app: 'MediMitra',
                    type: 'TOKEN_RECEIPT',
                    token: tokenData.tokenNumber,
                    name: tokenData.name,
                    abhaId: tokenData.abhaId,
                    department: tokenData.department,
                    room: tokenData.roomNumber,
                    doctor: tokenData.assignedDoctor
                  })}
                  size={52}
                  level="M"
                  includeMargin={false}
                />
                <div className="absolute inset-0 bg-black/10 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Maximize2 size={14} className="text-slate-900 bg-white/90 p-0.5 rounded" />
                </div>
              </button>
              <div className="text-[10px] text-slate-500 font-mono">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-700">ABDM DIGITAL PASS</span>
                  <span className="no-print text-[8px] bg-cyan-100 text-cyan-800 font-bold px-1 rounded">Tap QR</span>
                </div>
                <span>TOKEN: #{tokenData.tokenNumber}</span>
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-400">
              <span>Date: {new Date().toLocaleDateString()}</span><br />
              <span>Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enlarged QR Code Modal */}
      <QrZoomModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        value={JSON.stringify({
          app: 'MediMitra',
          type: 'TOKEN_RECEIPT',
          token: tokenData.tokenNumber,
          name: tokenData.name,
          abhaId: tokenData.abhaId,
          department: tokenData.department,
          room: tokenData.roomNumber,
          doctor: tokenData.assignedDoctor
        })}
        title="Official ABDM Token Pass"
        tokenNumber={tokenData.tokenNumber}
        patientName={tokenData.name}
        subtitle={`${tokenData.department} • Room: ${tokenData.roomNumber}`}
      />

      {/* Slip Action Buttons */}
      <div className="no-print max-w-md mx-auto flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <Printer size={16} />
          <span>{t.printSlip}</span>
        </button>

        <button
          type="button"
          onClick={handleGoToDoctor}
          style={{ backgroundColor: '#0A4D68' }}
          className="flex-1 py-3 px-4 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-md"
        >
          <Stethoscope size={16} />
          <span>View in Doctor Station</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="no-print text-center pt-2">
        <button
          type="button"
          onClick={resetKiosk}
          className="text-xs text-slate-500 hover:text-cyan-700 font-semibold inline-flex items-center gap-1.5"
        >
          <RotateCcw size={13} />
          <span>{t.newPatientBtn}</span>
        </button>
      </div>
    </div>
  );
};
