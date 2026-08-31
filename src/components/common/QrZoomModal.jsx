import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const QrZoomModal = ({ 
  isOpen, 
  onClose, 
  value, 
  title = 'Digital OPD Token Pass', 
  subtitle, 
  tokenNumber, 
  patientName 
}) => {
  if (!isOpen) return null;

  const rawValue = typeof value === 'string' ? value : JSON.stringify(value || {});

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 relative transform transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
          aria-label="Close QR preview"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="space-y-1 pt-1">
          <div className="inline-flex items-center gap-1.5 bg-cyan-100 text-cyan-900 text-xs font-bold px-3 py-1 rounded-full">
            <ShieldCheck size={14} className="text-cyan-700" />
            <span>{title}</span>
          </div>
          {tokenNumber && (
            <h3 className="text-2xl font-black font-mono text-slate-900 mt-2">
              #{tokenNumber}
            </h3>
          )}
          {patientName && (
            <p className="text-sm font-extrabold text-slate-800">
              {patientName}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {/* Large Enlarged Scannable QR Code */}
        <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center mx-auto shadow-inner">
          <div className="bg-white p-3 rounded-xl shadow-md">
            <QRCodeSVG 
              value={rawValue} 
              size={230}
              level="H"
              includeMargin={false}
            />
          </div>
        </div>

        {/* Scan Helper Footer */}
        <div className="space-y-3 pt-1">
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Point any phone camera, Google Lens, or OPD scanner at this screen to scan instantly.
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: '#088395' }}
            className="w-full py-2.5 px-4 text-white rounded-xl font-bold text-sm shadow hover:opacity-90 transition-all cursor-pointer"
          >
            Close QR Preview
          </button>
        </div>
      </div>
    </div>
  );
};
