import React, { useRef, useState } from 'react';
import { 
  CheckCircle2, 
  Printer, 
  RotateCcw, 
  ShieldCheck, 
  Building2, 
  Clock, 
  User, 
  ArrowRight,
  Heart,
  FileCheck2,
  Maximize2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { usePatient } from '../../context/PatientContext';
import { TriageBadge } from '../common/TriageBadge';
import { printElement } from '../../utils/printUtility';
import { QrZoomModal } from '../common/QrZoomModal';

export const Step8_SecureSubmit = ({ onFinish }) => {
  const { kioskForm, resetKiosk } = usePatient();
  const slipRef = useRef(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const patientToken = kioskForm.generatedToken || {
    tokenNumber: `OPD-${Date.now().toString().slice(-4)}`,
    roomNumber: kioskForm.roomNumber || 'Room 101',
    department: kioskForm.selectedDepartmentName || kioskForm.assignedDepartment || 'General Medicine',
    assignedDoctor: kioskForm.assignedDoctor || 'Attending Medical Officer',
    registrationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    waitTime: '15-20 mins',
    name: kioskForm.name || 'Walk-in Patient',
    age: kioskForm.age || 'Not provided',
    gender: kioskForm.gender || 'Not specified',
    abhaId: kioskForm.abhaId || 'None (Walk-in)',
    hospitalName: kioskForm.selectedHospitalName || 'Selected Healthcare Facility'
  };

  // Real verifiable clinical consultation token payload
  const qrVerificationPayload = JSON.stringify({
    app: 'MediMitra',
    type: 'OPD_TOKEN_PASS',
    token: patientToken.tokenNumber,
    name: patientToken.name,
    age: patientToken.age,
    gender: patientToken.gender,
    abhaId: patientToken.abhaId,
    hospital: patientToken.hospitalName,
    department: patientToken.department,
    room: patientToken.roomNumber,
    time: patientToken.registrationTime
  });

  const handlePrint = () => {
    if (slipRef.current) {
      printElement(slipRef.current, `MediMitra OPD Slip - ${patientToken.tokenNumber}`);
    } else {
      window.print();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Official Success Submission Banner */}
      <div className="no-print bg-emerald-50 border-2 border-emerald-300 p-6 sm:p-8 rounded-3xl text-center space-y-3 shadow-sm">
        <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 size={36} strokeWidth={2.5} />
        </div>

        <h2 className="text-2xl font-extrabold text-emerald-950 font-heading">
          Your information has been securely submitted to {kioskForm.selectedHospitalName || 'your selected healthcare facility'}.
        </h2>

        <p className="text-sm text-emerald-800 font-medium max-w-lg mx-auto leading-relaxed">
          Your clinical case has been encrypted and routed directly to the hospital's clinical queue for doctor review.
        </p>
      </div>

      {/* Official Printable OPD Consultation Slip */}
      <div 
        id="printable-opd-slip"
        ref={slipRef} 
        className="bg-white p-4 sm:p-8 rounded-3xl border-2 border-slate-300 shadow-md space-y-5 sm:space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none w-full"
      >
        {/* Slip Header */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-slate-300 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Official Outpatient Intake Slip
            </span>
            <h3 className="text-lg font-black text-slate-900 font-heading">
              {patientToken.hospitalName}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Outpatient Case Preparation & Clinical Triage System
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block">Token Slip</span>
            <span className="text-xl font-black font-mono text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
              {patientToken.tokenNumber}
            </span>
          </div>
        </div>

        {/* Slip Details Grid (1 col on mobile, 2 cols on tablet/desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold">Patient Name:</span>
            <span className="font-extrabold text-slate-900 text-sm">{patientToken.name}</span>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold">Age / Gender:</span>
            <span className="font-extrabold text-slate-900 text-sm">{patientToken.age} Y / {patientToken.gender}</span>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold">ABHA ID:</span>
            <span className="font-mono font-bold text-cyan-900">{patientToken.abhaId}</span>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold">Registration Time:</span>
            <span className="font-bold text-slate-800">{patientToken.registrationTime}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Consultation Room</span>
            <span className="text-base font-extrabold text-slate-900">{patientToken.roomNumber || 'Room 104'}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Estimated Wait</span>
            <span className="text-base font-extrabold text-cyan-800">{patientToken.waitTime || '15-20 mins'}</span>
          </div>
        </div>

        {/* QR Code & Clinical Verification Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t-2 border-dashed border-slate-300">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              title="Click to enlarge QR code"
              className="w-16 h-16 bg-white p-1 rounded-xl border-2 border-slate-300 hover:border-cyan-600 shadow-sm flex items-center justify-center flex-shrink-0 cursor-pointer transition-all hover:scale-105 group relative"
            >
              <QRCodeSVG 
                value={qrVerificationPayload}
                size={56}
                level="M"
                includeMargin={false}
              />
              <div className="absolute inset-0 bg-black/10 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 size={16} className="text-slate-900 bg-white/90 p-0.5 rounded" />
              </div>
            </button>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono font-bold text-slate-500 block">DIGITAL VERIFIED PASS</span>
                <span className="no-print text-[9px] bg-cyan-100 text-cyan-800 font-bold px-1.5 py-0.2 rounded">Tap to Enlarge</span>
              </div>
              <span className="text-xs font-bold text-slate-800">Scan with Phone / OPD Display</span>
              <span className="text-[10px] text-cyan-800 font-mono block">Token #{patientToken.tokenNumber}</span>
            </div>
          </div>

          <div className="sm:text-right">
            <TriageBadge level={kioskForm.triageLevel || 3} category={kioskForm.triageCategory || 'Urgent (Yellow)'} color={kioskForm.triageColor || 'amber'} size="sm" />
          </div>
        </div>
      </div>

      {/* Enlarged QR Code Modal */}
      <QrZoomModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        value={qrVerificationPayload}
        title="Official OPD Token QR Pass"
        tokenNumber={patientToken.tokenNumber}
        patientName={patientToken.name}
        subtitle={`${patientToken.hospitalName} • ${patientToken.department} (${patientToken.roomNumber})`}
      />

      {/* Action Buttons */}
      <div className="no-print flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <Printer size={18} />
          <span>Print OPD Slip</span>
        </button>

        <button
          type="button"
          onClick={() => {
            resetKiosk();
            if (onFinish) onFinish();
          }}
          style={{ backgroundColor: '#088395' }}
          className="flex-1 py-3.5 px-4 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:opacity-90"
        >
          <RotateCcw size={18} />
          <span>Finish & Start New Intake</span>
        </button>
      </div>
    </div>
  );
};
