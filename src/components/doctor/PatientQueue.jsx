import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Users, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  UserCheck, 
  Building2,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Stethoscope,
  Layers
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { TriageBadge } from '../common/TriageBadge';
import { isPatientInHospital } from '../../utils/hospitalResolver';

export { isPatientInHospital };

export const PatientQueue = () => {
  const { 
    patients, 
    selectedPatientId, 
    setSelectedPatientId,
    authenticatedUser,
    activeHospitalId,
    queueLoading,
    queueError,
    refreshQueue
  } = usePatient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [activeFilterTab, setActiveFilterTab] = useState('ALL'); // 'ALL' | 'WAITING' | 'RED_FLAG' | 'ASSIGNED_TO_ME' | 'VERIFIED'

  const currentHospId = authenticatedUser?.hospitalId || activeHospitalId || null;

  // 1. Strict Fail-Closed Hospital Isolation
  const hospitalScopedPatients = patients.filter((p) => isPatientInHospital(p, currentHospId));

  // Get distinct departments from doctor's authorized departments or patient list
  const authorizedDepts = authenticatedUser?.authorizedDepartments || [];
  const distinctDepts = authorizedDepts.length > 0 
    ? authorizedDepts 
    : [...new Set(hospitalScopedPatients.map(p => p.department).filter(Boolean))].map(d => ({ id: d, name: d }));

  const filteredPatients = hospitalScopedPatients.filter((p) => {
    // 2. Department Filter
    if (filterDept !== 'ALL') {
      const matchDept = p.departmentId === filterDept || p.department === filterDept;
      if (!matchDept) return false;
    }

    // 3. Search Filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchSearch =
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.tokenNumber && p.tokenNumber.toLowerCase().includes(q)) ||
        (p.abhaId && p.abhaId.toLowerCase().includes(q)) ||
        (p.reasonForVisit && p.reasonForVisit.toLowerCase().includes(q)) ||
        (p.department && p.department.toLowerCase().includes(q));

      if (!matchSearch) return false;
    }

    // 4. Quick Category Filters
    if (activeFilterTab === 'WAITING') {
      return p.status === 'Waiting' || p.caseStatus === 'Waiting for Review';
    }
    if (activeFilterTab === 'RED_FLAG') {
      return p.triageLevel <= 2 && p.status !== 'Completed';
    }
    if (activeFilterTab === 'ASSIGNED_TO_ME') {
      return authenticatedUser ? p.assignedDoctorId === authenticatedUser.id : Boolean(p.assignedDoctorId);
    }
    if (activeFilterTab === 'VERIFIED') {
      return p.status === 'History Verified' || p.verificationStatus === 'History Verified';
    }

    return true;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[900px]">
      {/* Queue Header & Search */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-cyan-700" size={18} />
            <h3 className="font-bold text-slate-900 text-sm">
              Clinical Queue ({filteredPatients.length})
            </h3>
          </div>
          <span className="text-[10px] font-extrabold text-cyan-800 bg-cyan-100 px-2.5 py-0.5 rounded-full border border-cyan-200">
            {authenticatedUser?.hospitalName ? `${authenticatedUser.hospitalName}` : 'Hospital OPD Queue'}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Patient Name, Token, ABHA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:border-cyan-600 outline-none shadow-inner"
          />
        </div>

        {/* Department Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-slate-400 flex-shrink-0" />
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 focus:border-cyan-600 outline-none"
          >
            <option value="ALL">All Authorized Departments</option>
            {distinctDepts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Quick Filter Tabs (All, Waiting for Review, Red Flag, Assigned to Me, History Verified) */}
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {[
            { id: 'ALL', label: 'All Cases' },
            { id: 'WAITING', label: 'Waiting for Review' },
            { id: 'RED_FLAG', label: '🔴 Red Flag' },
            { id: 'ASSIGNED_TO_ME', label: 'Assigned to Me' },
            { id: 'VERIFIED', label: '✓ Verified' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilterTab(tab.id)}
              style={{
                backgroundColor: activeFilterTab === tab.id ? '#0A4D68' : '#ffffff',
                color: activeFilterTab === tab.id ? '#ffffff' : '#475569'
              }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-200 whitespace-nowrap transition-colors"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
        {queueLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs space-y-2">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-cyan-700 border-t-transparent"></div>
            <p>Loading clinical queue...</p>
          </div>
        ) : queueError ? (
          <div className="p-6 text-center text-red-600 text-xs space-y-3 bg-red-50/50 rounded-2xl m-2 border border-red-200">
            <AlertCircle size={20} className="mx-auto text-red-500" />
            <p className="font-semibold">{queueError}</p>
            {refreshQueue && (
              <button
                type="button"
                onClick={refreshQueue}
                className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition shadow"
              >
                Retry Loading
              </button>
            )}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-1">
            <p className="font-semibold text-slate-600">No patients are currently waiting.</p>
            <p className="text-[11px] text-slate-400">
              {hospitalScopedPatients.length === 0
                ? 'No active patient cases found for this healthcare facility.'
                : 'No patient cases match the active search and department filters.'}
            </p>
          </div>
        ) : (
          filteredPatients.map((p) => {
            const isSelected = selectedPatientId === p.id;
            const isRed = p.triageLevel <= 2;
            const isVerified = p.status === 'History Verified' || p.verificationStatus === 'History Verified';
            const isCompleted = p.status === 'Completed';
            const isRejected = p.status === 'Rejected' || p.verificationStatus === 'Rejected';

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                style={{
                  backgroundColor: isSelected ? '#ecfeff' : isRed && !isCompleted && !isVerified ? '#fff5f5' : '#ffffff',
                  borderColor: isSelected ? '#088395' : isRed && !isCompleted && !isVerified ? '#fecaca' : '#e2e8f0'
                }}
                className="p-3.5 rounded-2xl border-2 cursor-pointer transition-all hover:border-cyan-400 relative card-hover space-y-2"
              >
                {/* Top Row: Token ID, Time & Status Pill */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                      {p.tokenNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {p.registrationTime || 'Today'}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      <ShieldCheck size={12} />
                      <span>History Verified ✓</span>
                    </span>
                  ) : isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300">
                      <CheckCircle2 size={12} />
                      <span>Completed</span>
                    </span>
                  ) : isRejected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-800 bg-red-100 px-2 py-0.5 rounded-full border border-red-300">
                      <XCircle size={12} />
                      <span>Rejected</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Clock size={11} />
                      <span>Waiting for Review</span>
                    </span>
                  )}
                </div>

                {/* Patient Name, Age, Gender & Department */}
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                      {p.name}
                    </h4>
                    <span className="text-[11px] font-bold text-slate-600">
                      {p.age} Y / {p.gender}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>Dept: <strong className="text-cyan-900">{p.department}</strong></span>
                    <span className="font-mono text-slate-400">{p.roomNumber}</span>
                  </div>
                </div>

                {/* Chief Complaint / Reason for Visit */}
                <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100 font-semibold line-clamp-2">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Reason for Visit:</span>
                  {p.reasonForVisit || p.chiefComplaints?.[0] || 'General Medical Intake'}
                </div>

                {/* Assigned Doctor / Clinician */}
                <div className="flex items-center justify-between text-[10px] pt-1 text-slate-500">
                  <div className="flex items-center gap-1">
                    <Stethoscope size={11} className="text-cyan-700" />
                    <span>{p.assignedDoctorName || p.assignedDoctor || 'Assigned Clinician'}</span>
                  </div>
                  <span className="font-mono text-cyan-900 font-bold">{p.abhaId ? p.abhaId.slice(-9) : ''}</span>
                </div>

                {/* Bottom Row: Red-Flag Triage Badge & Wait Time */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <TriageBadge level={p.triageLevel} category={p.triageCategory} color={p.triageColor} size="sm" />
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Wait: <strong className="text-cyan-900">{p.waitTime}</strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
