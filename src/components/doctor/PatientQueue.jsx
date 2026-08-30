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
  Stethoscope
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { TriageBadge } from '../common/TriageBadge';

export const PatientQueue = () => {
  const { 
    patients, 
    selectedPatientId, 
    setSelectedPatientId 
  } = usePatient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTriage, setFilterTriage] = useState('ALL'); // 'ALL' | 'RED' | 'YELLOW' | 'GREEN'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Waiting' | 'History Verified' | 'Completed'

  const filteredPatients = patients.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.abhaId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchTriage =
      filterTriage === 'ALL' ||
      (filterTriage === 'RED' && p.triageLevel <= 2) ||
      (filterTriage === 'YELLOW' && p.triageLevel === 3) ||
      (filterTriage === 'GREEN' && p.triageLevel >= 4);

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'Waiting' && (p.status === 'Waiting' || !p.status)) ||
      (statusFilter === 'History Verified' && p.status === 'History Verified') ||
      (statusFilter === 'Completed' && p.status === 'Completed');

    return matchSearch && matchTriage && matchStatus;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[900px]">
      {/* Queue Header & Search */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-cyan-700" size={18} />
            <h3 className="font-bold text-slate-900 text-sm">
              Live Patient Queue ({filteredPatients.length})
            </h3>
          </div>
          <span className="text-[10px] font-extrabold text-cyan-800 bg-cyan-100 px-2.5 py-0.5 rounded-full border border-cyan-200">
            Realtime ABDM Queue
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

        {/* Status Filters */}
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {['ALL', 'Waiting', 'History Verified', 'Completed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                backgroundColor: statusFilter === st ? '#0A4D68' : '#ffffff',
                color: statusFilter === st ? '#ffffff' : '#475569'
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200 whitespace-nowrap transition-colors"
            >
              {st === 'ALL' ? 'All Status' : st}
            </button>
          ))}
        </div>

        {/* Triage Urgency Filters */}
        <div className="flex gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterTriage('ALL')}
            style={{
              backgroundColor: filterTriage === 'ALL' ? '#334155' : '#ffffff',
              color: filterTriage === 'ALL' ? '#ffffff' : '#475569'
            }}
            className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200"
          >
            All Triage
          </button>
          <button
            type="button"
            onClick={() => setFilterTriage('RED')}
            style={{
              backgroundColor: filterTriage === 'RED' ? '#dc2626' : '#ffffff',
              color: filterTriage === 'RED' ? '#ffffff' : '#b91c1c'
            }}
            className="px-2 py-0.5 rounded text-[10px] font-bold border border-red-200"
          >
            🔴 Red Flags
          </button>
          <button
            type="button"
            onClick={() => setFilterTriage('YELLOW')}
            style={{
              backgroundColor: filterTriage === 'YELLOW' ? '#d97706' : '#ffffff',
              color: filterTriage === 'YELLOW' ? '#ffffff' : '#b45309'
            }}
            className="px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200"
          >
            🟡 Urgent
          </button>
          <button
            type="button"
            onClick={() => setFilterTriage('GREEN')}
            style={{
              backgroundColor: filterTriage === 'GREEN' ? '#16a34a' : '#ffffff',
              color: filterTriage === 'GREEN' ? '#ffffff' : '#15803d'
            }}
            className="px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200"
          >
            🟢 Routine
          </button>
        </div>
      </div>

      {/* Patient Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
        {filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No patients match current filters.
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
                      {p.registrationTime}
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
                      <span>Rejected (Re-Intake)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Clock size={11} />
                      <span>Waiting Doctor Review</span>
                    </span>
                  )}
                </div>

                {/* Patient Name, Age, Gender & ABHA */}
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                      {p.name}
                    </h4>
                    <span className="text-[11px] font-bold text-slate-600">
                      {p.age} Y / {p.gender}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    ABHA: <span className="text-cyan-800 font-bold">{p.abhaId}</span>
                  </p>
                </div>

                {/* Chief Complaint */}
                <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100 font-semibold line-clamp-2">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Chief Complaint:</span>
                  {p.chiefComplaints?.[0] || 'General Medical Intake'}
                </div>

                {/* Bottom Row: Red-Flag Triage Badge & Wait Time */}
                <div className="flex items-center justify-between pt-1">
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
