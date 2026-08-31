import React, { useRef } from 'react';
import { 
  CheckCircle2, 
  Printer, 
  RotateCcw, 
  ShieldCheck, 
  QrCode, 
  Building2, 
  Clock, 
  User, 
  ArrowRight,
  Heart,
  FileCheck2
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { TriageBadge } from '../common/TriageBadge';

export const Step8_SecureSubmit = ({ onFinish }) => {
  const { kioskForm, resetKiosk } = usePatient();
  const slipRef = useRef(null);

  const patientToken = kioskForm.generatedToken || {
    tokenNumber: 'MED-101',
    roomNumber: 'Room 104',
    department: kioskForm.assignedDepartment || 'General Medicine',
    assignedDoctor: 'Dr. Rajesh Sharma, MD',
    registrationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    waitTime: '15-20 mins',
    name: kioskForm.name || 'Ramesh Kumar',
    age: kioskForm.age || 54,
    gender: kioskForm.gender || 'Male',
    abhaId: kioskForm.abhaId || '91-8472-9182-3451',
    hospitalName: kioskForm.selectedHospitalName || 'Government General Hospital'
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Standard window.print() failed, trying popup fallback:', e);
      if (slipRef.current) {
        const printWindow = window.open('', '_blank', 'width=650,height=750');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>OPD Consultation Slip - ${patientToken.tokenNumber}</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; }
                  .border-dashed { border-style: dashed; }
                  .border-b-2 { border-bottom-width: 2px; }
                  .border-t-2 { border-top-width: 2px; }
                  .border-slate-300 { border-color: #cbd5e1; }
                  .grid { display: grid; }
                  .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                  .gap-4 { gap: 1rem; }
                  .text-xs { font-size: 0.75rem; }
                  .text-sm { font-size: 0.875rem; }
                  .text-base { font-size: 1rem; }
                  .text-xl { font-size: 1.25rem; }
                  .font-bold { font-weight: 700; }
                  .font-black { font-weight: 900; }
                  .font-mono { font-family: monospace; }
                  .bg-slate-50 { background-color: #f8fafc; }
                  .bg-slate-100 { background-color: #f1f5f9; }
                  .bg-slate-900 { background-color: #0f172a; color: white; }
                  .p-3 { padding: 0.75rem; }
                  .p-6 { padding: 1.5rem; }
                  .rounded-xl { border-radius: 0.75rem; }
                  .rounded-2xl { border-radius: 1rem; }
                  .rounded-3xl { border-radius: 1.5rem; }
                  .border { border-width: 1px; }
                  .border-2 { border-width: 2px; }
                  .border-slate-200 { border-color: #e2e8f0; }
                  .text-slate-400 { color: #94a3b8; }
                  .text-slate-500 { color: #64748b; }
                  .text-slate-700 { color: #334155; }
                  .text-slate-800 { color: #1e293b; }
                  .text-slate-900 { color: #0f172a; }
                  .text-cyan-900 { color: #164e63; }
                  .text-cyan-800 { color: #155e75; }
                  .flex { display: flex; }
                  .items-center { align-items: center; }
                  .justify-between { justify-content: space-between; }
                  .text-right { text-align: right; }
                  .space-y-6 > * + * { margin-top: 1.5rem; }
                  .space-y-4 > * + * { margin-top: 1rem; }
                  .w-14 { width: 3.5rem; }
                  .h-14 { height: 3.5rem; }
                </style>
              </head>
              <body>
                <div style="border: 2px solid #cbd5e1; border-radius: 1.5rem; padding: 1.5rem; background: white;">
                  ${slipRef.current.innerHTML}
                </div>
                <script>
                  window.onload = function() { window.print(); window.close(); };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
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
          Your information has been securely submitted to {kioskForm.selectedHospitalName || 'Government General Hospital'}.
        </h2>

        <p className="text-sm text-emerald-800 font-medium max-w-lg mx-auto leading-relaxed">
          Your clinical case has been encrypted and routed directly to the hospital's clinical queue for doctor review.
        </p>
      </div>

      {/* Official Printable OPD Consultation Slip */}
      <div 
        id="printable-opd-slip"
        ref={slipRef} 
        className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-300 shadow-md space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none"
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

        {/* Slip Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs">
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
        <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-slate-300">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center p-1">
              <QrCode size={40} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 block">ABDM TOKEN PASS</span>
              <span className="text-xs font-bold text-slate-700">Scan at Room Door Display</span>
            </div>
          </div>

          <div className="text-right">
            <TriageBadge level={kioskForm.triageLevel || 3} category={kioskForm.triageCategory || 'Urgent (Yellow)'} color={kioskForm.triageColor || 'amber'} size="sm" />
          </div>
        </div>
      </div>

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
