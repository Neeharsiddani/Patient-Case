import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, AlertCircle } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';

export const AudioPrompt = ({ promptText, label = 'Audio Assist' }) => {
  const { speakText, language } = usePatient();
  const [isPlaying, setIsPlaying] = useState(false);
  const [notice, setNotice] = useState(null);

  const handlePlay = () => {
    setNotice(null);
    const result = speakText(promptText, language, {
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
      onStatus: (status) => {
        if (!status.supported) {
          setIsPlaying(false);
          setNotice(status.message || 'Audio guidance not supported for this language.');
          setTimeout(() => setNotice(null), 6000);
        }
      }
    });

    if (result && !result.supported) {
      setIsPlaying(false);
      setNotice(result.message || 'Voice audio not available on this browser.');
      setTimeout(() => setNotice(null), 6000);
    }
  };

  return (
    <div className="relative inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handlePlay}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          backgroundColor: isPlaying ? '#088395' : '#ecfeff',
          color: isPlaying ? '#ffffff' : '#088395',
          border: '1px solid #a5f3fc',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        title="Click to hear spoken voice guidance in selected language"
        className="card-hover shadow-xs"
      >
        <Volume2 size={16} className={isPlaying ? 'animate-bounce' : ''} />
        <span>{isPlaying ? 'Speaking...' : label}</span>
        <Sparkles size={12} color={isPlaying ? '#ffffff' : '#088395'} />
      </button>

      {notice && (
        <div className="absolute top-full mt-1.5 right-0 z-20 w-64 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold rounded-xl p-2.5 shadow-md flex items-start gap-1.5 animate-in fade-in">
          <AlertCircle size={14} className="text-amber-700 mt-0.5 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}
    </div>
  );
};
