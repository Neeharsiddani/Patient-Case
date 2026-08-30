import React, { useState } from 'react';
import { 
  QrCode, 
  CreditCard, 
  Smartphone, 
  UserPlus, 
  Sparkles, 
  CheckCircle2, 
  Camera, 
  Info,
  ShieldCheck,
  Building2,
  Lock
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { AudioPrompt } from '../common/AudioPrompt';

export const Step1_Identification = () => {
  const { kioskForm, setKioskForm, t, language } = usePatient();
  const [tab, setTab] = useState('abha'); // 'abha' | 'qr' | 'walkin'
  const [isScanning, setIsScanning] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');

  const demoProfiles = [
    {
      name: 'Ramesh Kumar Verma',
      age: '54',
      gender: 'Male',
      phone: '9876543210',
      abhaId: '91-8472-9182-3451',
      abhaAddress: 'ramesh.verma@abdm',
      address: 'Sector 4, Rohini, New Delhi'
    },
    {
      name: 'Sunita Sharma',
      age: '48',
      gender: 'Female',
      phone: '9412378901',
      abhaId: '91-3321-4456-7890',
      abhaAddress: 'sunita.sharma@abdm',
      address: 'Karol Bagh, New Delhi'
    },
    {
      name: 'Mohammad Irfan',
      age: '32',
      gender: 'Male',
      phone: '9711234567',
      abhaId: '91-5544-7788-9900',
      abhaAddress: 'm.irfan@abdm',
      address: 'Chawri Bazar, Old Delhi'
    },
    {
      name: 'Ananya Ghosh',
      age: '24',
      gender: 'Female',
      phone: '9810123456',
      abhaId: '91-1122-3344-5566',
      abhaAddress: 'ananya.ghosh@abdm',
      address: 'Salt Lake / New Delhi'
    }
  ];

  const handleSelectDemo = (profile) => {
    setKioskForm((prev) => ({
      ...prev,
      ...profile
    }));
  };

  const handleSimulateQrScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      handleSelectDemo(demoProfiles[0]);
    }, 1500);
  };

  const handleSendOtp = () => {
    if (kioskForm.phone.length >= 10 || kioskForm.abhaId.length >= 10) {
      setOtpSent(true);
      setOtpValue('482910'); // simulated auto-fill OTP
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Audio Guidance */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="text-cyan-600" />
              <span>{t.identTitle}</span>
            </h2>
            <span className="bg-cyan-100 text-cyan-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-cyan-300">
              Integration-ready / Prototype
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Identify patient via 14-Digit ABHA ID, QR Code, or new Walk-in UHID registration.
          </p>
        </div>
        <AudioPrompt promptText="Welcome to MediKiosk. Please enter your ABHA number or select new patient walk-in registration." />
      </div>

      {/* Integration Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-cyan-700 flex-shrink-0" />
          <span>
            <strong>ABDM & HIS Integration-ready Prototype:</strong> Designed for NHA Gateway M1/M2/M3 Sandbox APIs. Real Aadhaar data is not required for testing.
          </span>
        </div>
        <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">FHIR R4 Ready</span>
      </div>

      {/* Quick Demo Fill Buttons for SIH Testing */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-cyan-900 font-bold text-xs">
          <Sparkles size={16} className="text-cyan-600" />
          <span>1-Click Realistic Patient Profiles for Testing:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {demoProfiles.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSelectDemo(p)}
              className="px-3.5 py-2.5 bg-white hover:bg-cyan-600 hover:text-white border border-cyan-300 rounded-2xl text-left text-xs font-medium transition-all shadow-sm flex flex-col group card-hover"
            >
              <span className="font-extrabold text-slate-900 group-hover:text-white truncate">{p.name}</span>
              <span className="text-slate-400 group-hover:text-cyan-100 text-[11px] font-mono mt-0.5">{p.abhaId}</span>
              <span className="text-cyan-700 group-hover:text-white text-[10px] font-semibold mt-1">{p.age} Y • {p.gender}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Identification Mode Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setTab('abha')}
          style={{
            backgroundColor: tab === 'abha' ? '#088395' : 'transparent',
            color: tab === 'abha' ? '#ffffff' : '#475569'
          }}
          className="py-3 px-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <CreditCard size={18} />
          <span className="hidden sm:inline">14-Digit</span> ABHA ID
        </button>

        <button
          type="button"
          onClick={() => setTab('qr')}
          style={{
            backgroundColor: tab === 'qr' ? '#088395' : 'transparent',
            color: tab === 'qr' ? '#ffffff' : '#475569'
          }}
          className="py-3 px-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <QrCode size={18} />
          <span className="hidden sm:inline">Scan</span> ABHA QR
        </button>

        <button
          type="button"
          onClick={() => setTab('walkin')}
          style={{
            backgroundColor: tab === 'walkin' ? '#088395' : 'transparent',
            color: tab === 'walkin' ? '#ffffff' : '#475569'
          }}
          className="py-3 px-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <UserPlus size={18} />
          <span>New Patient Walk-in</span>
        </button>
      </div>

      {/* Tab 1: ABHA Number / Mobile Input */}
      {tab === 'abha' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t.abhaNumber} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t.enterAbha}
                  value={kioskForm.abhaId}
                  onChange={(e) => setKioskForm({ ...kioskForm, abhaId: e.target.value })}
                  className="w-full pl-3.5 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-semibold tracking-wider text-slate-800 focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20 outline-none"
                />
                {kioskForm.abhaId.length >= 14 && (
                  <CheckCircle2 size={20} className="absolute right-3 top-3.5 text-emerald-500" />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Format: 91-XXXX-XXXX-XXXX (ABDM Test Sandbox)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t.mobileNumber} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder={t.enterMobile}
                  value={kioskForm.phone}
                  onChange={(e) => setKioskForm({ ...kioskForm, phone: e.target.value })}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-medium text-slate-800 focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-colors"
                >
                  {otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              </div>
            </div>
          </div>

          {otpSent && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={20} />
                <div>
                  <p className="text-xs font-bold text-emerald-900">ABDM Aadhaar OTP Mock Sent</p>
                  <p className="text-[11px] text-emerald-700">Prototype auto-verified OTP: {otpValue}</p>
                </div>
              </div>
              <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold">
                Auto-Verified ✓
              </span>
            </div>
          )}

          {/* Demographic Auto-Populate Fields */}
          <div className="border-t border-slate-200 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t.fullName}</label>
              <input
                type="text"
                placeholder="Full Name"
                value={kioskForm.name}
                onChange={(e) => setKioskForm({ ...kioskForm, name: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t.age}</label>
              <input
                type="number"
                placeholder="Age"
                value={kioskForm.age}
                onChange={(e) => setKioskForm({ ...kioskForm, age: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t.gender}</label>
              <select
                value={kioskForm.gender}
                onChange={(e) => setKioskForm({ ...kioskForm, gender: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white outline-none"
              >
                <option value="Male">{t.male}</option>
                <option value="Female">{t.female}</option>
                <option value="Other">{t.other}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: ABHA QR Scanner Simulator */}
      {tab === 'qr' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-4">
          <div className="max-w-md mx-auto p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-cyan-400 relative overflow-hidden">
            {isScanning && <div className="scanner-line" />}
            <div className="w-24 h-24 mx-auto bg-cyan-100 text-cyan-700 rounded-2xl flex items-center justify-center mb-3">
              <Camera size={44} className={isScanning ? 'animate-pulse' : ''} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {isScanning ? 'Scanning ABHA Physical Card...' : 'Hold your ABHA Card in front of the Kiosk Camera'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              The camera will automatically detect the NHA QR code and fetch your ABDM Health Profile.
            </p>
            <button
              type="button"
              onClick={handleSimulateQrScan}
              disabled={isScanning}
              style={{ backgroundColor: '#088395' }}
              className="mt-4 px-6 py-2.5 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all shadow-md inline-flex items-center gap-2"
            >
              <QrCode size={18} />
              <span>{isScanning ? 'Reading ABHA Barcode...' : t.scanQrBtn}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Walk-in Registration (Without ABHA) */}
      {tab === 'walkin' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-medium">
            <Info size={18} className="text-amber-600 flex-shrink-0" />
            <span>New patient without ABHA. A temporary Hospital UHID will be generated and can be linked later.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t.fullName} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter patient full name"
                value={kioskForm.name}
                onChange={(e) => setKioskForm({ ...kioskForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t.phone} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={kioskForm.phone}
                onChange={(e) => setKioskForm({ ...kioskForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.age}</label>
              <input
                type="number"
                placeholder="e.g. 45"
                value={kioskForm.age}
                onChange={(e) => setKioskForm({ ...kioskForm, age: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.gender}</label>
              <select
                value={kioskForm.gender}
                onChange={(e) => setKioskForm({ ...kioskForm, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white outline-none"
              >
                <option value="Male">{t.male}</option>
                <option value="Female">{t.female}</option>
                <option value="Other">{t.other}</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
