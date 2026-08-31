import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Keyboard, 
  Volume2, 
  Sparkles,
  X
} from 'lucide-react';
import { 
  startSpeechSession, 
  isSpeechRecognitionSupported, 
  INDIAN_LANGUAGE_LOCALES 
} from '../../services/speechService';

export const VoiceInputWidget = ({
  languageKey = 'en',
  promptLabel = 'Tap the microphone to speak your answer',
  currentValue = '',
  onTranscriptConfirmed = () => {},
  onFallbackToText = () => {},
  showApplyButton = true,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalTranscript, setFinalTranscript] = useState(currentValue || '');
  const [errorState, setErrorState] = useState(null);
  const recognitionRef = useRef(null);

  const isSupported = isSpeechRecognitionSupported();
  const langConfig = INDIAN_LANGUAGE_LOCALES[languageKey] || INDIAN_LANGUAGE_LOCALES.en;

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  const handleStartListening = () => {
    setErrorState(null);
    setInterimText('');
    setIsListening(true);

    const session = startSpeechSession({
      languageKey,
      onInterim: (text) => {
        setInterimText(text);
      },
      onFinal: (text) => {
        setFinalTranscript((prev) => {
          const updated = prev ? `${prev} ${text}`.trim() : text;
          onTranscriptConfirmed(updated, true);
          return updated;
        });
        setInterimText('');
      },
      onError: (err) => {
        setIsListening(false);
        setErrorState(err);
      },
      onEnd: (lastText) => {
        setIsListening(false);
        setInterimText('');
      }
    });

    recognitionRef.current = session;
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
  };

  const handleClear = () => {
    setFinalTranscript('');
    setInterimText('');
    setErrorState(null);
    onTranscriptConfirmed('', false);
  };

  const handleConfirm = () => {
    if (finalTranscript.trim()) {
      onTranscriptConfirmed(finalTranscript.trim(), true);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-cyan-50/80 via-white to-blue-50/60 border-2 ${isListening ? 'border-cyan-500 shadow-lg ring-4 ring-cyan-100' : 'border-cyan-200'} rounded-3xl p-5 sm:p-6 transition-all space-y-4 ${className}`}>
      
      {/* Header with Language Badge & Accessibility info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-cyan-600 text-white rounded-xl shadow-xs">
            <Mic size={18} className={isListening ? 'animate-pulse' : ''} />
          </span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Multilingual Voice Input
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              {promptLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300">
            {langConfig.native} ({langConfig.code})
          </span>
        </div>
      </div>

      {/* Main Mic Button & Visual Recording Wave */}
      <div className="flex flex-col items-center justify-center py-2 space-y-3">
        <div className="relative">
          {/* Animated sound ripple rings */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-cyan-400 opacity-75 animate-ping" />
              <div className="absolute -inset-2 rounded-full bg-cyan-300 opacity-40 animate-pulse" />
            </>
          )}

          <button
            type="button"
            onClick={isListening ? handleStopListening : handleStartListening}
            className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all shadow-xl ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-200 scale-105 animate-pulse'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white ring-4 ring-cyan-100 hover:scale-105'
            }`}
            title={isListening ? 'Tap to stop recording' : 'Tap to speak'}
          >
            {isListening ? (
              <>
                <MicOff size={32} />
                <span className="text-[9px] font-extrabold mt-0.5">STOP</span>
              </>
            ) : (
              <>
                <Mic size={32} />
                <span className="text-[9px] font-extrabold mt-0.5">SPEAK</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs font-bold text-slate-800">
            {isListening ? (
              <span className="text-red-600 font-extrabold flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                Listening to your voice... Speak now in {langConfig.native}
              </span>
            ) : (
              <span className="text-slate-600">
                Tap the microphone button and speak clearly into your device
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Real-time Transcription Preview Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-inner space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
          <span>Spoken Transcription Preview</span>
          {finalTranscript && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-red-600 flex items-center gap-1 text-[10px]"
            >
              <X size={12} />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="min-h-[50px] text-sm text-slate-800 font-semibold leading-relaxed">
          {finalTranscript ? (
            <span className="text-slate-900">{finalTranscript}</span>
          ) : interimText ? (
            <span className="text-cyan-700 italic animate-pulse">{interimText}...</span>
          ) : (
            <span className="text-slate-400 text-xs italic font-normal">
              Spoken words will appear here in real-time...
            </span>
          )}
          {isListening && interimText && (
            <span className="text-cyan-600 font-normal italic ml-1.5">{interimText}</span>
          )}
        </div>
      </div>

      {/* Error Alert with Friendly Explanations & Retry Controls */}
      {errorState && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
            <span>{errorState.title}</span>
          </div>
          <p className="text-amber-800 leading-relaxed pl-6">
            {errorState.message}
          </p>
          <div className="flex gap-2 pl-6 pt-1">
            {errorState.canRetry && (
              <button
                type="button"
                onClick={handleStartListening}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <RotateCcw size={12} />
                <span>Retry Voice</span>
              </button>
            )}
            <button
              type="button"
              onClick={onFallbackToText}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Keyboard size={12} />
              <span>Use Touch / Keyboard</span>
            </button>
          </div>
        </div>
      )}

      {/* Actions Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-cyan-100">
        <button
          type="button"
          onClick={onFallbackToText}
          className="text-xs font-bold text-slate-600 hover:text-cyan-700 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Keyboard size={15} />
          <span>Switch to typing / touch cards</span>
        </button>

        {showApplyButton && finalTranscript.trim() && (
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Check size={14} />
            <span>Confirm Spoken Answer</span>
          </button>
        )}
      </div>
    </div>
  );
};
