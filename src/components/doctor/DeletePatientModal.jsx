import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { TriageBadge } from '../common/TriageBadge';

export const DeletePatientModal = ({
  patient,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Keyboard accessibility: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !patient) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onConfirm(patient.id);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to remove patient from queue.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={() => {
        if (!isDeleting) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-patient-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-red-50/80 p-5 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 text-red-700 rounded-2xl">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 id="delete-patient-modal-title" className="text-base font-extrabold text-slate-900">
                Remove Patient from Queue
              </h3>
              <p className="text-xs text-red-800 font-medium">
                Permanent Clinical Action
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white/80 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Patient Card Preview */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black font-mono bg-slate-900 text-white px-2 py-0.5 rounded-md">
                {patient.tokenNumber}
              </span>
              <TriageBadge
                level={patient.triageLevel}
                category={patient.triageCategory}
                color={patient.triageColor}
                size="sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900">
                {patient.name}
              </h4>
              <span className="text-xs font-bold text-slate-600">
                {patient.age} Y / {patient.gender}
              </span>
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Department: <strong className="text-slate-800">{patient.department}</strong></span>
              <span className="font-mono text-slate-500">{patient.roomNumber || ''}</span>
            </div>

            {patient.reasonForVisit && (
              <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200 line-clamp-2">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Reason for Visit:</span>
                {patient.reasonForVisit}
              </div>
            )}
          </div>

          {/* Clinical Warning Alert */}
          <div className="bg-amber-50/90 border border-amber-200 p-3 rounded-2xl flex items-start gap-2.5 text-amber-900">
            <AlertTriangle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Are you sure you want to delete this patient?</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                This will permanently delete this patient record and cascade removal of all associated vitals, clinical histories, uploaded documents, and AI drafts from the hospital OPD queue. This action is logged in the hospital audit trail.
              </p>
            </div>
          </div>

          {/* Error Message if API fails */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-2xl flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            id={`confirm-delete-patient-${patient.id}`}
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Delete Patient</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
