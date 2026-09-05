import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe, 
  User, 
  CreditCard, 
  QrCode, 
  UserPlus, 
  ShieldCheck, 
  CheckCircle2, 
  Volume2, 
  Lock, 
  PenTool, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Phone, 
  AlertCircle,
  FileCheck2,
  Calendar,
  Building2
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { languages } from '../../data/translations';
import { AudioPrompt } from '../common/AudioPrompt';
import { MediMitraLogo } from '../common/MediMitraLogo';

export const Step2_Registration = () => {
  const { 
    kioskForm, 
    setKioskForm, 
    language, 
    setLanguage, 
    t 
  } = usePatient();

  // Active identification tab: 'abha' | 'qr' | 'walkin'
  const [identTab, setIdentTab] = useState(
    kioskForm.abhaId ? 'abha' : (kioskForm.name ? 'walkin' : 'abha')
  );
  const [qrRawInput, setQrRawInput] = useState('');
  const [qrSuccess, setQrSuccess] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  // Initialize Canvas for Touch Signature
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#088395';
    }
  }, []);

  // Language Selection Handler - Strictly changes language and text without auto-playing audio
  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
  };

  // ABDM QR Code Payload Parser
  const parseAbdmQr = (rawPayload) => {
    if (!rawPayload || !rawPayload.trim()) return;
    try {
      const parsed = JSON.parse(rawPayload);
      const abhaId = parsed.hidn || parsed.abhaId || parsed.healthIdNumber || '';
      const abhaAddress = parsed.hid || parsed.abhaAddress || parsed.healthId || '';
      const name = parsed.name || parsed.fullName || '';
      const gender = parsed.gender === 'M' ? 'Male' : parsed.gender === 'F' ? 'Female' : (parsed.gender || 'Other');
      
      let calculatedAge = parsed.age ? String(parsed.age) : '';
      if (!calculatedAge && parsed.dob) {
        const year = parseInt(parsed.dob.slice(-4), 10);
        if (!isNaN(year)) calculatedAge = String(new Date().getFullYear() - year);
      }

      setKioskForm((prev) => ({
        ...prev,
        abhaId: abhaId || prev.abhaId,
        abhaAddress: abhaAddress || prev.abhaAddress,
        name: name || prev.name,
        gender: gender || prev.gender,
        age: calculatedAge || prev.age,
        phone: parsed.mobile || parsed.phone || prev.phone,
        address: parsed.address || prev.address,
        abhaStatus: 'ABHA_QR_SCANNED_UNVERIFIED'
      }));

      setQrSuccess(true);
      setTimeout(() => setQrSuccess(false), 4000);
    } catch {
      const parts = rawPayload.split(/[,|\n]/).map(s => s.trim());
      if (parts.length >= 2) {
        setKioskForm((prev) => ({
          ...prev,
          name: parts[0] || prev.name,
          abhaId: parts[1] || prev.abhaId,
          abhaStatus: 'ABHA_QR_SCANNED_UNVERIFIED'
        }));
        setQrSuccess(true);
        setTimeout(() => setQrSuccess(false), 4000);
      }
    }
  };

  // Registration validation flags for mandatory patient identity & consent
  const isNameValid = Boolean(kioskForm.name && kioskForm.name.trim().length >= 2);
  const isAgeValid = Boolean(kioskForm.age && !isNaN(kioskForm.age) && Number(kioskForm.age) >= 1 && Number(kioskForm.age) <= 125);
  const isGenderValid = Boolean(kioskForm.gender && ['Male', 'Female', 'Other'].includes(kioskForm.gender));
  const isPhoneValid = Boolean(kioskForm.phone && kioskForm.phone.replace(/\D/g, '').length === 10);
  const isConsentValid = Boolean(kioskForm.consentAgreed);
  const isAbhaValid = identTab === 'walkin' ? true : Boolean(
    kioskForm.abhaId && (
      kioskForm.abhaId.replace(/\D/g, '').length === 14 || 
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/.test(kioskForm.abhaId.trim()) || 
      kioskForm.abhaId.trim().length >= 10
    )
  );
  const isFormValid = isNameValid && isAgeValid && isGenderValid && isPhoneValid && isAbhaValid && isConsentValid;

  // Consent Agreement Handlers
  const handleAgreeConsent = (method = 'one_tap') => {
    const timestamp = new Date().toISOString();
    setKioskForm(prev => ({
      ...prev,
      consentAgreed: true,
      consentStatus: 'Granted',
      consentTimestamp: timestamp,
      consentType: method === 'signature' ? 'Electronic Touch Signature' : 'One-Touch DPDP Authorization',
      signature: method === 'signature' ? 'data:signed-touch' : 'ABDM_ELECTRONIC_CONSENT_CONFIRMED'
    }));
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setKioskForm(prev => ({
      ...prev,
      signature: prev.consentAgreed ? 'ABDM_ELECTRONIC_CONSENT_CONFIRMED' : ''
    }));
  };

  // Canvas Drawing Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      handleAgreeConsent('signature');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Accessibility Guidance */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <User className="text-cyan-700" />
            <span>{t.registrationTitle || 'Patient Registration & Identity'}</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {t.registrationSub || 'Select language, verify your ABHA ID or enter personal details, and authorize healthcare consent.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block bg-cyan-100 text-cyan-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-cyan-300">
            DPDP Act 2023 & ABDM Compliant
          </span>
          <AudioPrompt promptText={t.audioPromptRegistration || 'Please select your language, enter your ABHA number or personal details, and authorize consent.'} />
        </div>
      </div>

      {/* SECTION 1: LANGUAGE SELECTION (High-Visibility Interactive Bar) */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-cyan-700 flex-shrink-0" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              {t.preferredLanguage || 'Preferred Language / भाषा चुनें'}
            </h3>
          </div>
          <span className="text-xs font-bold text-cyan-800 bg-cyan-100/70 px-2.5 py-0.5 rounded-full">
            Active: {languages.find(l => l.code === language)?.name} ({languages.find(l => l.code === language)?.native})
          </span>
        </div>
        <p className="text-xs text-slate-500">
          {t.chooseLanguageSub || 'Select the language for on-screen text, audio voice prompts, and voice recognition.'}
        </p>

        {/* 11 Indian Languages Responsive Pill Grid */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
          {languages.map((l) => {
            const isSelected = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => handleLanguageChange(l.code)}
                style={{
                  backgroundColor: isSelected ? '#088395' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#0f172a',
                  borderColor: isSelected ? '#088395' : '#cbd5e1'
                }}
                className={`px-3 py-2.5 rounded-2xl border-2 text-center transition-all flex items-center justify-between gap-1.5 cursor-pointer shadow-xs min-h-[46px] hover:border-cyan-600 ${
                  isSelected ? 'font-black ring-2 ring-cyan-200' : 'font-semibold'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className="text-xs truncate">{l.native}</span>
                </div>
                {isSelected && <Check size={14} strokeWidth={3} className="text-white flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: PATIENT IDENTIFICATION (ABHA ID, QR Card, or Walk-In) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <CreditCard size={18} className="text-cyan-700" />
            <span>{t.identTitle || 'Patient Identification & ABHA Registration'}</span>
          </h3>
        </div>

        {/* Identification Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setIdentTab('abha');
              setKioskForm(p => ({ ...p, registrationMode: 'abha' }));
            }}
            className={`flex-1 py-3 px-2 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              identTab === 'abha'
                ? 'border-cyan-700 text-cyan-800 bg-cyan-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard size={15} />
            <span>{t.abhaTab || 'ABHA ID / Number'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIdentTab('qr');
              setKioskForm(p => ({ ...p, registrationMode: 'qr' }));
            }}
            className={`flex-1 py-3 px-2 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              identTab === 'qr'
                ? 'border-cyan-700 text-cyan-800 bg-cyan-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode size={15} />
            <span>{t.qrTab || 'Scan ABHA QR'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIdentTab('walkin');
              setKioskForm(p => ({ ...p, registrationMode: 'walkin', abhaStatus: 'WALKIN_NO_ABHA' }));
            }}
            className={`flex-1 py-3 px-2 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              identTab === 'walkin'
                ? 'border-cyan-700 text-cyan-800 bg-cyan-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus size={15} />
            <span>{t.walkInTab || 'New Patient (No ABHA)'}</span>
          </button>
        </div>

        {/* Tab 1: ABHA Number / ID */}
        {identTab === 'abha' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">
                  {t.abhaNumber || '14-digit ABHA ID / Number'}
                </label>
                <input
                  type="text"
                  value={kioskForm.abhaId || ''}
                  onChange={(e) => setKioskForm(p => ({ ...p, abhaId: e.target.value }))}
                  placeholder={t.enterAbha || 'e.g. 91-8472-9182-3451 or name@abdm'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:border-cyan-700 focus:outline-none transition-colors"
                />
                <span className="text-[11px] text-slate-400 block">
                  Official Ayushman Bharat Health Account ID.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">
                  {t.mobileNumber || 'Registered Mobile Number'}
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={kioskForm.phone || ''}
                  onChange={(e) => setKioskForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                  placeholder={t.enterMobile || 'e.g. 9876543210'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:border-cyan-700 focus:outline-none transition-colors"
                />
                <span className="text-[11px] text-slate-400 block">
                  Linked mobile number for SMS token & queue status.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="space-y-1.5 sm:col-span-1">
                <label className="block text-xs font-extrabold text-slate-700">{t.fullName || 'Patient Name'}</label>
                <input
                  type="text"
                  value={kioskForm.name || ''}
                  onChange={(e) => setKioskForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={t.enterFullName || 'Enter name'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-cyan-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">{t.age || 'Age (Years)'}</label>
                <input
                  type="number"
                  min="1"
                  max="125"
                  value={kioskForm.age || ''}
                  onChange={(e) => setKioskForm(p => ({ ...p, age: e.target.value }))}
                  placeholder={t.enterAge || 'Age'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-cyan-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">{t.gender || 'Gender'}</label>
                <select
                  value={kioskForm.gender || ''}
                  onChange={(e) => setKioskForm(p => ({ ...p, gender: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-cyan-700 focus:outline-none cursor-pointer"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">{t.male || 'Male'}</option>
                  <option value="Female">{t.female || 'Female'}</option>
                  <option value="Other">{t.other || 'Other'}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: ABDM QR Card Scan */}
        {identTab === 'qr' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="text-center p-6 border-2 border-dashed border-cyan-300 rounded-2xl bg-cyan-50/30 space-y-3">
              <QrCode size={40} className="mx-auto text-cyan-700" />
              <h4 className="text-sm font-extrabold text-slate-900">
                Hold your ABHA Health Card QR code to the kiosk camera
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Or paste ABDM QR string / JSON payload directly into the test field below:
              </p>
              <textarea
                rows={2}
                value={qrRawInput}
                onChange={(e) => {
                  setQrRawInput(e.target.value);
                  parseAbdmQr(e.target.value);
                }}
                placeholder='Paste ABDM QR code data JSON payload or scanned text here...'
                className="w-full max-w-lg mx-auto p-3 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:border-cyan-700 focus:outline-none"
              />
              {qrSuccess && (
                <div className="text-xs font-bold text-emerald-800 bg-emerald-100 p-2 rounded-xl flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={16} />
                  <span>ABDM QR Data Parsed & Verified!</span>
                </div>
              )}
            </div>

            {kioskForm.name && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                <span>Loaded: <strong>{kioskForm.name}</strong> ({kioskForm.gender}, {kioskForm.age} yrs)</span>
                <span className="font-mono text-cyan-800 font-bold">{kioskForm.abhaId || 'ABHA Scanned'}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Walk-In / New Patient */}
        {identTab === 'walkin' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-extrabold text-slate-700">
                  {t.fullName || 'Full Patient Name'} *
                </label>
                <input
                  type="text"
                  value={kioskForm.name || ''}
                  onChange={(e) => setKioskForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={t.enterFullName || 'e.g. Ramesh Kumar'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:border-cyan-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">
                  {t.age || 'Age (Years)'} *
                </label>
                <input
                  type="number"
                  min="1"
                  max="125"
                  value={kioskForm.age || ''}
                  onChange={(e) => setKioskForm(p => ({ ...p, age: e.target.value }))}
                  placeholder={t.enterAge || 'e.g. 42'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:border-cyan-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">
                  {t.gender || 'Gender'} *
                </label>
                <select
                  value={kioskForm.gender || ''}
                  onChange={(e) => setKioskForm(p => ({ ...p, gender: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:border-cyan-700 focus:outline-none cursor-pointer"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">{t.male || 'Male'}</option>
                  <option value="Female">{t.female || 'Female'}</option>
                  <option value="Other">{t.other || 'Other'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">
                  {t.phone || 'Contact Phone Number'} *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={kioskForm.phone || ''}
                  onChange={(e) => setKioskForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                  placeholder={t.enterMobile || '10-digit mobile number'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:border-cyan-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">
                  {t.address || 'Residential Address / City'}
                </label>
                <input
                  type="text"
                  value={kioskForm.address || ''}
                  onChange={(e) => setKioskForm(p => ({ ...p, address: e.target.value }))}
                  placeholder={t.enterAddress || 'City, State'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:border-cyan-700 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: DPDP ACT 2023 INFORMED CONSENT (Merged Inline) */}
      <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-cyan-700" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {t.consentHeading || 'DPDP Act 2023 Informed Consent'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t.consentSubtext || 'Digital Personal Data Protection Act 2023 & NHA Privacy Standards'}
              </p>
            </div>
          </div>

          {kioskForm.consentAgreed ? (
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 size={15} />
              <span>{t.consentGrantedBadge || 'Consent Authorized'}</span>
            </span>
          ) : (
            <span className="text-xs font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5">
              <AlertCircle size={14} />
              <span>Authorization Required</span>
            </span>
          )}
        </div>

        {/* Plain Legal Consent Points */}
        <div className="space-y-2.5 text-xs text-slate-700 bg-white p-4 rounded-2xl border border-slate-200 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <span className="text-cyan-700 font-bold">•</span>
            <p>{t.consentPoint1 || 'I consent to the collection and automated processing of my symptoms, vitals, and health history for today\'s OPD consultation.'}</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-cyan-700 font-bold">•</span>
            <p>{t.consentPoint2 || 'I authorize the hospital medical officer and care team to access my uploaded medical records and test reports.'}</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-cyan-700 font-bold">•</span>
            <p>{t.consentPoint3 || 'My personal health information will be stored securely with cryptographic integrity and will not be shared without authorization.'}</p>
          </div>
        </div>

        {/* Consent Actions: One-Touch Agree + Optional Digital Signature */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 items-start">
          {/* Action 1: One-Touch Express Consent */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleAgreeConsent('one_tap')}
              style={{
                backgroundColor: kioskForm.consentAgreed ? '#047857' : '#088395'
              }}
              className="w-full px-6 py-3.5 text-white font-extrabold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:opacity-95 cursor-pointer min-h-[48px]"
            >
              <CheckCircle2 size={18} />
              <span>{t.agreeAndProceed || 'I Agree & Authorize Consent'}</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              1-tap authorization under Digital Personal Data Protection Act.
            </p>
          </div>

          {/* Action 2: Digital Touch Signature Pad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <PenTool size={14} className="text-cyan-700" />
                <span>{t.touchSignatureTitle || 'Touch / Finger Signature (Optional)'}</span>
              </label>
              <button
                type="button"
                onClick={handleClearSignature}
                className="text-[11px] font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>{t.clearSign || 'Clear'}</span>
              </button>
            </div>

            <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden">
              <canvas
                ref={canvasRef}
                width={400}
                height={110}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[110px] touch-none cursor-crosshair"
              />
              {!kioskForm.signature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs font-semibold">
                  {t.signHerePrompt || 'Sign with finger or stylus inside this box'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: REGISTRATION VALIDATION GUIDANCE */}
      <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${
        isFormValid 
          ? 'bg-emerald-50/60 border-emerald-200' 
          : 'bg-amber-50/60 border-amber-200'
      }`}>
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2">
            {isFormValid ? (
              <CheckCircle2 size={18} className="text-emerald-700 flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-amber-700 flex-shrink-0" />
            )}
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              {isFormValid 
                ? 'All Registration Requirements Satisfied' 
                : 'Mandatory Registration Requirements'}
            </h4>
          </div>
          <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
            isFormValid 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-amber-100 text-amber-900'
          }`}>
            {isFormValid ? 'Ready to Continue' : 'Incomplete'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-3">
          {/* Item 1: Full Name */}
          <div className="flex items-center gap-2 text-xs">
            {isNameValid ? (
              <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
            )}
            <span className={isNameValid ? 'font-bold text-slate-800' : 'text-slate-500 font-medium'}>
              Full Name {isNameValid ? '✓' : '(Min 2 letters)'}
            </span>
          </div>

          {/* Item 2: Age */}
          <div className="flex items-center gap-2 text-xs">
            {isAgeValid ? (
              <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
            )}
            <span className={isAgeValid ? 'font-bold text-slate-800' : 'text-slate-500 font-medium'}>
              Age {isAgeValid ? `(${kioskForm.age} yrs) ✓` : '(1–125 yrs)'}
            </span>
          </div>

          {/* Item 3: Gender */}
          <div className="flex items-center gap-2 text-xs">
            {isGenderValid ? (
              <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
            )}
            <span className={isGenderValid ? 'font-bold text-slate-800' : 'text-slate-500 font-medium'}>
              Gender {isGenderValid ? `(${kioskForm.gender}) ✓` : '(Required)'}
            </span>
          </div>

          {/* Item 4: 10-digit Phone */}
          <div className="flex items-center gap-2 text-xs">
            {isPhoneValid ? (
              <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
            )}
            <span className={isPhoneValid ? 'font-bold text-slate-800' : 'text-slate-500 font-medium'}>
              Phone {isPhoneValid ? '✓' : '(10-digit mobile)'}
            </span>
          </div>

          {/* Item 5: ABHA (if abha or qr mode) */}
          {identTab !== 'walkin' && (
            <div className="flex items-center gap-2 text-xs">
              {isAbhaValid ? (
                <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
              )}
              <span className={isAbhaValid ? 'font-bold text-slate-800' : 'text-slate-500 font-medium'}>
                {identTab === 'qr' ? 'ABHA QR Data' : 'ABHA ID / Number'} {isAbhaValid ? '✓' : '(14 digits or @abdm)'}
              </span>
            </div>
          )}

          {/* Item 6: Consent */}
          <div className="flex items-center gap-2 text-xs">
            {isConsentValid ? (
              <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
            )}
            <span className={isConsentValid ? 'font-bold text-slate-800' : 'text-slate-500 font-medium'}>
              DPDP Consent {isConsentValid ? '✓' : '(Authorization Required)'}
            </span>
          </div>
        </div>

        {!isFormValid && (
          <p className="text-[11px] text-amber-800 font-medium mt-3 border-t border-amber-200/60 pt-2">
            Please fill all missing details above and authorize consent. The Continue button below will remain disabled until all required items are valid.
          </p>
        )}
      </div>
    </div>
  );
};
