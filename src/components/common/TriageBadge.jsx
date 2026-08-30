import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const TriageBadge = ({ level, category, color, size = 'md' }) => {
  const isRed = color === 'red' || level <= 2;
  const isYellow = color === 'yellow' || level === 3;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs font-semibold',
    lg: 'px-4 py-1.5 text-sm font-bold'
  };

  if (isRed) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          borderRadius: '9999px',
          backgroundColor: '#fef2f2',
          color: '#b91c1c',
          border: '1px solid #fecaca',
          fontWeight: 700
        }}
        className={`${sizeClasses[size]} pulse-emergency`}
      >
        <ShieldAlert size={size === 'sm' ? 12 : 15} />
        <span>ESI Level {level}: {category || 'Priority Emergent'}</span>
      </span>
    );
  }

  if (isYellow) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          borderRadius: '9999px',
          backgroundColor: '#fffbeb',
          color: '#b45309',
          border: '1px solid #fde68a',
          fontWeight: 600
        }}
        className={sizeClasses[size]}
      >
        <AlertTriangle size={size === 'sm' ? 12 : 15} />
        <span>ESI Level {level}: {category || 'Urgent'}</span>
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '9999px',
        backgroundColor: '#f0fdf4',
        color: '#15803d',
        border: '1px solid #bbf7d0',
        fontWeight: 600
      }}
      className={sizeClasses[size]}
    >
      <CheckCircle2 size={size === 'sm' ? 12 : 15} />
      <span>ESI Level {level}: {category || 'Routine OPD'}</span>
    </span>
  );
};
