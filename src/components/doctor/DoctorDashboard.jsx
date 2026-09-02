import React, { useState } from 'react';
import { 
  Stethoscope, 
  Users, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Pill, 
  History, 
  Volume2, 
  Printer, 
  Building2, 
  Calendar, 
  AlertTriangle, 
  Sparkles,
  FileCheck2
} from 'lucide-react';
import { PatientQueue } from './PatientQueue';
import { RedFlagAlerts } from './RedFlagAlerts';
import { ClinicalSummary } from './ClinicalSummary';
import { DocumentTimeline } from './DocumentTimeline';
import { PrescriptionEditor } from './PrescriptionEditor';
import { TriageBadge } from '../common/TriageBadge';

const PrintableOpdSlip = React.lazy(() => import('./PrintableOpdSlip').then(m => ({ default: m.PrintableOpdSlip })));
const FhirBundleModal = React.lazy(() => import('./FhirBundleModal').then(m => ({ default: m.FhirBundleModal })));

export const DoctorDashboard = () => {
  const { 
    patients, 
    selectedPatient, 
    selectedPatientId, 
    setSelectedPatientId, 
    speakText,
    authenticatedUser,
    activeHospitalId,
    hospitals
  } = usePatient();

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'timeline' | 'rx'
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showFhirModal, setShowFhirModal] = useState(false);

  const currentHospitalId = authenticatedUser?.hospitalId || activeHospitalId || null;
  const currentHospital = hospitals.find(h => h.id === currentHospitalId) || (currentHospitalId ? { id: currentHospitalId, name: 'Assigned Healthcare Facility' } : hospitals[0]);
  const doctorName = authenticatedUser?.fullName || 'Dr. Rajesh Sharma, MD';
  const doctorDept = authenticatedUser?.department || 'Cardiology & General Medicine';

  const hospitalPatients = patients.filter(p => {
    if (!currentHospitalId) return false;
    const pId = p.hospitalId || p.hospital_id || p.hospital?.id;
    return typeof pId === 'string' && pId.trim() === currentHospitalId.trim();
  });

  const totalPatients = hospitalPatients.length;
  const waitingPatients = hospitalPatients.filter((p) => p.status === 'Waiting' || !p.status).length;
  const verifiedPatients = hospitalPatients.filter((p) => p.status === 'History Verified' || p.verificationStatus === 'History Verified').length;
  const redFlagPatients = hospitalPatients.filter((p) => p.triageLevel <= 2 && p.status !== 'Completed').length;

  const handleCallPatient = () => {
    if (!selectedPatient) return;
    const callSpeech = `Calling token number ${selectedPatient.tokenNumber}, patient ${selectedPatient.name}, to ${selectedPatient.roomNumber || 'Consultation Room 104'}.`;
    speakText(callSpeech);
  };

  const isVerified = selectedPatient?.status === 'History Verified' || selectedPatient?.verificationStatus === 'History Verified';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Hospital Hierarchy & Doctor Profile Banner */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-cyan-700 rounded-2xl text-white shadow-sm">
            <Stethoscope size={24} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold text-white">
                {doctorName}
              </span>
              <span className="bg-cyan-900/90 text-cyan-300 border border-cyan-700 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full">
                {doctorDept}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Building2 size={13} className="text-cyan-400" />
              <span>{currentHospital?.name} ({currentHospital?.city})</span>
              <span className="text-slate-600">|</span>
              <span>Scoped RBAC: Authorized Clinical Records Only</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 font-bold">
            Hospital Code: {currentHospital?.code}
          </span>
        </div>
      </div>
      {/* Top Clinical Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-cyan-50 text-cyan-700 rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total OPD Today</span>
            <span className="text-xl font-extrabold text-slate-900">{totalPatients}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Waiting in Queue</span>
            <span className="text-xl font-extrabold text-amber-700">{waitingPatients}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">History Verified</span>
            <span className="text-xl font-extrabold text-emerald-700">{verifiedPatients}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-700 rounded-xl">
            <ShieldAlert size={22} className={redFlagPatients > 0 ? 'animate-pulse' : ''} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">High-Risk Red Flags</span>
            <span className="text-xl font-extrabold text-red-600">{redFlagPatients}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Queue (4 Cols) */}
        <div className="lg:col-span-4">
          <PatientQueue />
        </div>

        {/* Right Column: Active Patient Clinical Workstation (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedPatient ? (
            <>
              {/* Patient Top Identification Banner */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black font-mono bg-slate-900 text-white px-2.5 py-0.5 rounded-lg">
                        {selectedPatient.tokenNumber}
                      </span>
                      <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                        {selectedPatient.name}
                      </h2>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {selectedPatient.age} Y / {selectedPatient.gender}
                      </span>
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                          <ShieldCheck size={12} /> Verified ✓
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>ABHA: <strong className="font-mono text-cyan-800">{selectedPatient.abhaId}</strong></span>
                      <span>•</span>
                      <span>Phone: <strong>{selectedPatient.phone}</strong></span>
                      <span>•</span>
                      <span>{selectedPatient.department}</span>
                    </div>
                  </div>

                  {/* Top Right Action & Triage */}
                  <div className="flex flex-wrap items-center gap-2">
                    <TriageBadge 
                      level={selectedPatient.triageLevel} 
                      category={selectedPatient.triageCategory} 
                      color={selectedPatient.triageColor} 
                    />

                    <button
                      type="button"
                      onClick={handleCallPatient}
                      className="px-3.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Audio announcement to call patient into room"
                    >
                      <Volume2 size={15} />
                      <span>Call Patient</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowFhirModal(true)}
                      className="px-3.5 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      title="View complete ABDM FHIR R4 document bundle"
                    >
                      <FileCheck2 size={15} />
                      <span>FHIR R4 Bundle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPrintModal(true)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <Printer size={15} />
                      <span>Print Slip</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Red-Flag Alerts */}
              <RedFlagAlerts patient={selectedPatient} />

              {/* Workstation Tab Switcher */}
              <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  style={{
                    backgroundColor: activeTab === 'summary' ? '#0A4D68' : 'transparent',
                    color: activeTab === 'summary' ? '#ffffff' : '#475569'
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <FileText size={16} />
                  <span>Clinical Summary & AI Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  style={{
                    backgroundColor: activeTab === 'timeline' ? '#0A4D68' : 'transparent',
                    color: activeTab === 'timeline' ? '#ffffff' : '#475569'
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <History size={16} />
                  <span>Records & OCR Timeline ({selectedPatient.documents?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('rx')}
                  style={{
                    backgroundColor: activeTab === 'rx' ? '#0A4D68' : 'transparent',
                    color: activeTab === 'rx' ? '#ffffff' : '#475569'
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Pill size={16} />
                  <span>e-Prescription & Diagnosis (Rx)</span>
                </button>
              </div>

              {/* Active Tab Content */}
              {activeTab === 'summary' && (
                <ClinicalSummary patient={selectedPatient} />
              )}

              {activeTab === 'timeline' && (
                <DocumentTimeline patient={selectedPatient} />
              )}

              {activeTab === 'rx' && (
                <PrescriptionEditor 
                  patient={selectedPatient} 
                  onSaveAndPrint={() => setShowPrintModal(true)} 
                />
              )}
            </>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <Stethoscope size={48} className="mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">No Patient Selected</h3>
              <p className="text-xs text-slate-400">Please pick a patient from the live queue on the left.</p>
            </div>
          )}
        </div>
      </div>

      {/* Printable OPD Slip Modal */}
      {showPrintModal && selectedPatient && (
        <PrintableOpdSlip 
          patient={selectedPatient} 
          onClose={() => setShowPrintModal(false)} 
        />
      )}

      {/* ABDM FHIR R4 Bundle Modal */}
      {showFhirModal && selectedPatient && (
        <FhirBundleModal
          patient={selectedPatient}
          isOpen={showFhirModal}
          onClose={() => setShowFhirModal(false)}
        />
      )}
    </div>
  );
};
