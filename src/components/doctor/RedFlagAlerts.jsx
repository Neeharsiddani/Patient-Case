import React from 'react';
import { ShieldAlert, AlertTriangle, Zap, Pill, Activity } from 'lucide-react';

export const RedFlagAlerts = ({ patient }) => {
  if (!patient || !patient.redFlags || patient.redFlags.length === 0) {
    return null;
  }

  const isEmergent = patient.triageLevel <= 2;

  return (
    <div
      style={{
        borderColor: isEmergent ? '#f87171' : '#fcd34d',
        backgroundColor: isEmergent ? '#fef2f2' : '#fffbeb'
      }}
      className="p-4 rounded-2xl border-2 shadow-sm space-y-2 relative overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={20} className={isEmergent ? 'text-red-600 animate-pulse' : 'text-amber-600'} />
          <h4 className={`text-xs font-black uppercase tracking-wider ${isEmergent ? 'text-red-900' : 'text-amber-900'}`}>
            Clinical Decision Support: {patient.redFlags.length} Red-Flag Risk Factor(s) Detected
          </h4>
        </div>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isEmergent ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'}`}>
          ESI LEVEL {patient.triageLevel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {patient.redFlags.map((flag, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-start gap-2 ${
              isEmergent
                ? 'bg-white/90 border-red-200 text-red-800'
                : 'bg-white/90 border-amber-200 text-amber-900'
            }`}
          >
            <AlertTriangle size={14} className={isEmergent ? 'text-red-600 flex-shrink-0 mt-0.5' : 'text-amber-600 flex-shrink-0 mt-0.5'} />
            <span className="leading-snug">{flag}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
