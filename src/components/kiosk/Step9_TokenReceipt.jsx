import { 
  Ticket, 
  Printer, 
  QrCode, 
  Building2, 
  Stethoscope, 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { TriageBadge } from '../common/TriageBadge';

export const Step9_TokenReceipt = () => {
  const { kioskForm, t, resetKiosk, setRole, setSelectedPatientId } = usePatient();
  const tokenData = kioskForm.generatedToken || {
    tokenNumber: 'MED-108',
    roomNumber: 'Room 104',
    assignedDoctor: 'Dr. Rajesh Sharma, MD (Med)',
    department: 'General Medicine & Cardiology',
    waitTime: '15 mins',
    name: kioskForm.name || 'Ramesh Kumar Verma',
    abhaId: kioskForm.abhaId || '91-8472-9182-3451',
    triageLevel: kioskForm.triageLevel || 2,
    triageCategory: kioskForm.triageCategory || 'Emergent (Red Flag)',
    triageColor: kioskForm.triageColor || 'red',
    id: 'PAT-101'
  };

  const handlePrint = () => {
    window.print();
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
            {t.hospitalName}
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
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-xl border border-slate-200">
                <QrCode size={48} className="text-slate-800" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                <span>DIGITAL VERIFIED</span><br />
                <span>SEC-HASH: #{tokenData.tokenNumber}-99X</span>
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-400">
              <span>Date: {new Date().toLocaleDateString()}</span><br />
              <span>Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

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
