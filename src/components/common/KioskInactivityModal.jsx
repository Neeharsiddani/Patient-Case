import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, RotateCcw, ArrowRight, ShieldAlert } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';

/**
 * KioskInactivityModal
 * Automatically scrubs transient in-flight patient data if the kiosk is left unattended,
 * protecting patient health information under DPDP Act 2023.
 */
export const KioskInactivityModal = ({ idleTimeoutSec = 90, countdownSec = 15 }) => {
  const { kioskStep, resetKiosk, kioskForm } = usePatient();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(countdownSec);
  
  const idleTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const isIntakeActive = kioskStep >= 1 && kioskStep < 9 && (kioskForm.name || kioskForm.abhaId || kioskStep > 1);

  const resetTimers = () => {
    setShowWarning(false);
    setTimeLeft(countdownSec);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (isIntakeActive) {
      idleTimerRef.current = setTimeout(() => {
        setShowWarning(true);
      }, (idleTimeoutSec - countdownSec) * 1000);
    }
  };

  useEffect(() => {
    const handleUserActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    const events = ['mousedown', 'touchstart', 'keydown', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity));

    resetTimers();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [kioskStep, isIntakeActive]);

  useEffect(() => {
    if (showWarning) {
      setTimeLeft(countdownSec);
      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            setShowWarning(false);
            resetKiosk();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl border-2 border-amber-300 space-y-5 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert size={34} />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Privacy & Inactivity Protection
          </span>
          <h3 className="text-xl font-black text-slate-900 mt-2">
            Are you still there?
          </h3>
          <p className="text-xs text-slate-500">
            To protect your medical privacy, this kiosk will reset to the home screen in:
          </p>
        </div>

        <div className="text-4xl font-black font-mono text-amber-600 bg-amber-50 py-3 rounded-2xl border border-amber-200">
          00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setShowWarning(false);
              resetKiosk();
            }}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Reset Kiosk</span>
          </button>

          <button
            type="button"
            onClick={resetTimers}
            style={{ backgroundColor: '#088395' }}
            className="flex-1 py-3 px-4 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 transition-all shadow-md"
          >
            <span>Continue Intake</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
