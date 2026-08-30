import React, { useRef, useState, useEffect } from 'react';
import { 
  FileCheck2, 
  ShieldCheck, 
  PenTool, 
  RotateCcw, 
  Fingerprint, 
  CheckSquare, 
  Square,
  Lock,
  Volume2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Info,
  ArrowRight
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { AudioPrompt } from '../common/AudioPrompt';

export const Step3_Consent = () => {
  const { kioskForm, setKioskForm, t, setKioskStep, speakText } = usePatient();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [declinedNotice, setDeclinedNotice] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#088395';
    }
  }, []);

  const consentExplanationText = "Please listen. To provide you medical treatment today, this kiosk needs to collect your symptoms, vitals, and previous medical documents. This information will only be shared with your consulting doctor in this hospital. Please tap Agree to proceed or Decline if you do not wish to share.";

  const handleSpeakConsent = () => {
    speakText(consentExplanationText);
  };

  const handleAgreeConsent = (method = 'one_tap') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setKioskForm((prev) => ({
      ...prev,
      consentAgreed: true,
      consentStatus: 'Granted',
      consentTimestamp: timestamp,
      consentType: method === 'signature' ? 'Digital Touch Signature' : 'One-Touch Electronic Consent',
      consentPurpose: 'OPD Clinical Consultation & ABDM Health Record Linking',
      signature: method === 'signature' ? 'data:signed-touch' : 'ABDM_ELECTRONIC_CONSENT_CONFIRMED'
    }));
    setDeclinedNotice(false);
  };

  const handleDeclineConsent = () => {
    setKioskForm((prev) => ({
      ...prev,
      consentAgreed: false,
      consentStatus: 'Declined',
      consentTimestamp: null,
      signature: ''
    }));
    setDeclinedNotice(true);
    speakText("Consent declined. Clinical history collection is paused. Please visit the manual registration counter if you need assistance.");
  };

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
    setHasDrawn(true);
    handleAgreeConsent('signature');
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setKioskForm((prev) => ({
      ...prev,
      consentAgreed: false,
      consentStatus: 'Pending',
      signature: ''
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-cyan-600" />
              <span>Patient Consent & Privacy Notice</span>
            </h2>
            <span className="bg-cyan-100 text-cyan-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-cyan-300">
              DPDP Consent Framework
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Simple, transparent consent to share your clinical case history with hospital doctors.
          </p>
        </div>

        {/* Audio Readout of Consent */}
        <button
          type="button"
          onClick={handleSpeakConsent}
          className="px-4 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
        >
          <Volume2 size={16} className="text-cyan-700 animate-pulse" />
          <span>🔊 Listen to Consent Explanation</span>
        </button>
      </div>

      {/* Simple Patient-Friendly Consent Clauses in Plain Language */}
      <div className="bg-gradient-to-r from-cyan-50 via-slate-50 to-blue-50 border border-cyan-200 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-black text-cyan-950 uppercase tracking-wider flex items-center gap-2">
          <Shield size={18} className="text-cyan-700" />
          <span>What You Are Giving Consent For (Plain Language Summary)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5 shadow-xs">
            <div className="w-7 h-7 rounded-xl bg-cyan-100 text-cyan-800 font-black text-xs flex items-center justify-center">
              1
            </div>
            <h4 className="text-xs font-extrabold text-slate-900">Collect Symptoms & Vitals</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              We collect your current complaints (e.g. chest pain, fever) and recorded vital signs to prepare your clinical summary.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5 shadow-xs">
            <div className="w-7 h-7 rounded-xl bg-cyan-100 text-cyan-800 font-black text-xs flex items-center justify-center">
              2
            </div>
            <h4 className="text-xs font-extrabold text-slate-900">Share with Hospital Doctor</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your information is transmitted directly to the doctor’s workstation for your consultation today in Room 104.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5 shadow-xs">
            <div className="w-7 h-7 rounded-xl bg-cyan-100 text-cyan-800 font-black text-xs flex items-center justify-center">
              3
            </div>
            <h4 className="text-xs font-extrabold text-slate-900">Analyze Uploaded Records</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your uploaded previous prescriptions and test reports are digitized to create an automatic health history timeline.
            </p>
          </div>
        </div>
      </div>

      {/* Main Consent Choice: AGREE vs DECLINE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Choice 1: AGREE */}
        <div
          onClick={() => handleAgreeConsent('one_tap')}
          style={{
            borderColor: kioskForm.consentAgreed ? '#059669' : '#cbd5e1',
            backgroundColor: kioskForm.consentAgreed ? '#f0fdf4' : '#ffffff'
          }}
          className="p-6 rounded-3xl border-2 cursor-pointer transition-all hover:border-emerald-500 flex flex-col justify-between space-y-4 shadow-sm card-hover group"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${kioskForm.consentAgreed ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                <CheckCircle2 size={26} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 group-hover:text-emerald-800">
                  ✓ I Agree & Give Consent
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorize case-taking and proceed to clinical history
                </p>
              </div>
            </div>

            {kioskForm.consentAgreed && (
              <span className="text-xs font-black bg-emerald-600 text-white px-2.5 py-1 rounded-full">
                Selected ✓
              </span>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-800 font-bold">
            <span>Enables Step 4: Clinical History Taking</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Choice 2: DECLINE */}
        <div
          onClick={handleDeclineConsent}
          style={{
            borderColor: declinedNotice ? '#dc2626' : '#cbd5e1',
            backgroundColor: declinedNotice ? '#fef2f2' : '#ffffff'
          }}
          className="p-6 rounded-3xl border-2 cursor-pointer transition-all hover:border-red-400 flex flex-col justify-between space-y-4 shadow-sm card-hover group"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${declinedNotice ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}>
                <XCircle size={26} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 group-hover:text-red-800">
                  ✕ Decline / Do Not Share
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Do not collect clinical history on kiosk
                </p>
              </div>
            </div>

            {declinedNotice && (
              <span className="text-xs font-black bg-red-600 text-white px-2.5 py-1 rounded-full">
                Declined
              </span>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-red-700 font-medium">
            Halts kiosk intake. Requires manual desk registration.
          </div>
        </div>
      </div>

      {/* Declined Warning Banner & Enforcement Notice */}
      {declinedNotice && (
        <div className="bg-red-50 border-2 border-red-300 p-5 rounded-3xl space-y-2">
          <div className="flex items-center gap-2 text-red-900 font-black text-sm">
            <AlertCircle size={20} className="text-red-600" />
            <span>Consent Declined — Clinical History Taking is Paused</span>
          </div>
          <p className="text-xs text-red-800 leading-relaxed font-medium">
            Without your consent, this kiosk cannot collect your medical symptoms, pain scores, or documents. 
            You cannot proceed to the clinical questioning screen. If you would like manual assistance, please visit the hospital registration desk. If you changed your mind, tap <strong>"✓ I Agree & Give Consent"</strong> above to continue.
          </p>
        </div>
      )}

      {/* Optional: Touch Signature Canvas or Biometric One-Tap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Touch Signature Pad */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <PenTool size={15} className="text-cyan-700" />
              <span>Optional Touch Signature</span>
            </label>
            <button
              type="button"
              onClick={clearCanvas}
              className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={12} />
              <span>Clear</span>
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-slate-50 relative">
            <canvas
              ref={canvasRef}
              width={420}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-36 cursor-crosshair touch-none"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-semibold">
                ✍️ Sign with finger / stylus here
              </div>
            )}
          </div>
        </div>

        {/* Security & DPDP Act Indicator */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-sm flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-300 font-extrabold text-xs">
              <Lock size={15} />
              <span>Digital Personal Data Protection (DPDP) Act 2023</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your electronic consent artifact is cryptographically logged with a timestamp and linked to your ABHA profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-cyan-300 font-mono">
              256-Bit Encrypted
            </span>
            <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-emerald-300">
              Electronic Consent Artifact Logged
            </span>
          </div>
        </div>
      </div>

      {/* Enforcement Advance Button */}
      {kioskForm.consentAgreed && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
            <div>
              <h5 className="text-xs font-black text-emerald-900">
                Consent Confirmed ({kioskForm.consentType || 'Electronic Consent'})
              </h5>
              <p className="text-[11px] text-emerald-700">
                You may now proceed to the interactive clinical history taking step.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setKioskStep(4)}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
          >
            <span>Proceed to Clinical History</span>
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
