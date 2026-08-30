import React from 'react';

/**
 * MediMitra Professional Healthcare Brand Logo
 * 
 * Concept:
 * - A modern medical cross combined with an embracing human caring/shield motif.
 * - Represents: Healthcare + Technology + Trusted Patient Assistance (Mitra = Friend).
 * - Highly recognizable at small navbar sizes (28px) and large hero displays (64px).
 */
export const MediMitraLogo = ({ 
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  showText = true, 
  showTagline = false,
  variant = 'dark', // 'dark' (for white bg) | 'light' (for dark bg)
  className = '' 
}) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-base', tag: 'text-[9px]' },
    md: { icon: 40, text: 'text-xl', tag: 'text-[11px]' },
    lg: { icon: 52, text: 'text-2xl', tag: 'text-xs' },
    xl: { icon: 64, text: 'text-3xl', tag: 'text-sm' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon Emblem */}
      <div 
        style={{
          width: currentSize.icon,
          height: currentSize.icon,
          background: 'linear-gradient(135deg, #0A4D68 0%, #088395 50%, #059669 100%)',
        }}
        className="rounded-2xl flex items-center justify-center p-2 shadow-md shadow-cyan-900/20 relative flex-shrink-0 group transition-transform hover:scale-105"
      >
        {/* Modern Vector SVG: Medical Cross + Caring Human Hands / Heart Motif */}
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full text-white"
        >
          {/* Central Stylized Medical Cross */}
          <rect x="38" y="16" width="24" height="68" rx="8" fill="white" opacity="0.95" />
          <rect x="16" y="38" width="68" height="24" rx="8" fill="white" opacity="0.95" />
          
          {/* Subtle Human/Care Heart Sparkle in Center */}
          <circle cx="50" cy="50" r="7" fill="#088395" />
          
          {/* Protective Mitra Human Arc / Care Accent (Bottom Arc) */}
          <path 
            d="M26 68C32 78 40 84 50 84C60 84 68 78 74 68" 
            stroke="#6ee7b7" 
            strokeWidth="6" 
            strokeLinecap="round" 
          />
          
          {/* Companion Halo / Trusted Sparkle (Top Arc) */}
          <circle cx="50" cy="24" r="3.5" fill="#a7f3d0" />
        </svg>
      </div>

      {/* Brand Wordmark & Tagline */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-black font-heading tracking-tight leading-tight ${currentSize.text} ${variant === 'light' ? 'text-white' : 'text-slate-900'}`}>
            <span>Medi</span>
            <span style={{ color: '#088395' }}>Mitra</span>
          </div>

          {showTagline && (
            <span className={`font-semibold tracking-normal mt-0.5 ${currentSize.tag} ${variant === 'light' ? 'text-cyan-200' : 'text-slate-500'}`}>
              Your Health, Ready for Care
            </span>
          )}
        </div>
      )}
    </div>
  );
};
