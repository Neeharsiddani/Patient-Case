import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';

export const AudioPrompt = ({ promptText, label = 'Audio Assist' }) => {
  const { speakText } = usePatient();
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
    speakText(promptText);
    setTimeout(() => {
      setIsPlaying(false);
    }, 4000);
  };

  return (
    <button
      type="button"
      onClick={handlePlay}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: '9999px',
        backgroundColor: '#ecfeff',
        color: '#088395',
        border: '1px solid #a5f3fc',
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      title="Click to hear spoken voice guidance"
      className="card-hover"
    >
      <Volume2 size={16} className={isPlaying ? 'animate-bounce' : ''} />
      <span>{label}</span>
      <Sparkles size={12} color="#088395" />
    </button>
  );
};
