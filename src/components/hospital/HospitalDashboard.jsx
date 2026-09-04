import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  Layers, 
  Stethoscope, 
  Hospital, 
  MapPin, 
  Phone, 
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { ApiService } from '../../services/api';
import { TriageBadge } from '../common/TriageBadge';

export const HospitalDashboard = () => {
  const { 
    hospitals, 
    authenticatedUser, 
    patients,
    refreshQueue 
  } = usePatient();

  // Authoritative hospital ID strictly derived from the authenticated administrator profile
  const authoritativeHospitalId = authenticatedUser?.hospitalId || null;

  const [stats, setStats] = useState(null);
  const [facilityMetadata, setFacilityMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'queue' | 'doctors'

  // Assign Doctor Modal
  const [assignModalPatient, setAssignModalPatient] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Add Department Modal
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptRoom, setNewDeptRoom] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  // Authoritative facility resolution - NEVER use dangerous || hospitals[0] fallback
  const hospital = facilityMetadata 
    || hospitals.find(h => h.id === authoritativeHospitalId) 
    || authenticatedUser?.hospital
    || (authoritativeHospitalId ? {
        id: authoritativeHospitalId,
        name: authenticatedUser?.hospitalName || 'Authorized Healthcare Facility',
        code: authenticatedUser?.hospitalCode || '',
        hfr_id: authenticatedUser?.hospitalCode || 'HFR-AUTH',
        location: 'Official Healthcare Facility',
        city: 'Hyderabad',
        state: 'Telangana',
        phone: authenticatedUser?.phone || '+91 40 2460 0121'
      } : null);

  const fetchStatsAndDoctors = async () => {
    if (!authoritativeHospitalId) return;
    setLoading(true);
    try {
      // 1. Authoritative analytics and facility record from backend
      const statsRes = await ApiService.getHospitalStats(authoritativeHospitalId);
      if (statsRes?.success) {
        setStats(statsRes.stats);
        if (statsRes.hospital) {
          setFacilityMetadata(statsRes.hospital);
        }
      }

      // 2. Fetch full hospital details if not complete
      if (!statsRes?.hospital?.phone || !statsRes?.hospital?.location) {
        try {
          const hospRes = await ApiService.getHospitalById(authoritativeHospitalId);
          if (hospRes?.success && hospRes.hospital) {
            setFacilityMetadata(prev => ({ ...(prev || {}), ...hospRes.hospital }));
          }
        } catch (e) {
          console.warn('[MediMitra] Facility lookup notice:', e.message);
        }
      }

      // 3. Authorized doctors roster strictly for this hospital
      const docRes = await ApiService.getHospitalDoctors(authoritativeHospitalId);
      if (docRes?.success && Array.isArray(docRes.doctors)) {
        setAvailableDoctors(docRes.doctors);
      }
    } catch (err) {
      console.warn('[MediMitra] Could not fetch authoritative hospital stats:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authoritativeHospitalId) {
      fetchStatsAndDoctors();
    }
  }, [authoritativeHospitalId]);

  // Filter hospital patients strictly fail-closed by authoritativeHospitalId
  const hospitalPatients = patients.filter(p => {
    if (!p || !authoritativeHospitalId) return false;
    const pId = p.hospitalId || p.hospital_id || p.hospital?.id;
    const matchesHosp = typeof pId === 'string' && pId.trim() === authoritativeHospitalId.trim();
    const matchesDept = selectedDeptFilter === 'all' || p.departmentId === selectedDeptFilter || p.department === selectedDeptFilter;
    return matchesHosp && matchesDept;
  });

  const waitingPatients = hospitalPatients.filter(p => p.status === 'Waiting');
  const redFlagPatients = hospitalPatients.filter(p => p.triageLevel <= 2 && p.status !== 'Completed');
  const unassignedPatients = hospitalPatients.filter(p => !p.assignedDoctorId && p.status !== 'Completed');
  const completedPatients = hospitalPatients.filter(p => p.status === 'Completed');

  const handleAssignDoctor = async () => {
    if (!assignModalPatient || !selectedDoctorId || !authoritativeHospitalId) return;
    setAssignLoading(true);
    try {
      await ApiService.assignDoctorToCase(authoritativeHospitalId, assignModalPatient.id, selectedDoctorId);
      setAssignModalPatient(null);
      setSelectedDoctorId('');
      refreshQueue();
      fetchStatsAndDoctors();
    } catch (err) {
      console.warn(`[MediMitra] Assignment notice: ${err.message}`);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName || !newDeptCode || !authoritativeHospitalId) return;
    try {
      await ApiService.createDepartment(authoritativeHospitalId, {
        name: newDeptName,
        code: newDeptCode,
        roomNumber: newDeptRoom,
        description: newDeptDesc
      });
      setShowAddDeptModal(false);
      setNewDeptName('');
      setNewDeptCode('');
      setNewDeptRoom('');
      setNewDeptDesc('');
      fetchStatsAndDoctors();
    } catch (err) {
      console.warn(`[MediMitra] Error creating department: ${err.message}`);
    }
  };

  // Fail-closed authentication guard: Non-admin or unauthenticated staff blocked from facility administration
  if (!authenticatedUser || authenticatedUser.role !== 'HOSPITAL_ADMIN' || !authoritativeHospitalId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 shadow-sm">
          <ShieldAlert size={48} className="mx-auto text-red-600 mb-4" />
          <h2 className="text-xl font-extrabold text-red-900 mb-2">Hospital Administrator Authentication Required</h2>
          <p className="text-sm text-red-700 max-w-md mx-auto mb-6">
            You must be authenticated as an authorized Hospital Administrator to access facility analytics, staff rosters, and patient administration queues.
          </p>
          <button
            type="button"
            onClick={() => window.location.hash = '#/doctor/login'}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <Lock size={15} />
            <span>Go to Staff Login</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Hospital Facility Profile Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-cyan-600 rounded-2xl text-white shadow-md">
            <Hospital size={30} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-white">
                {hospital?.name || authenticatedUser?.hospitalName || 'Authorized Healthcare Facility'}
              </h1>
              <span className="bg-cyan-900/80 text-cyan-300 border border-cyan-700 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full">
                HFR ID: {hospital?.hfr_id || hospital?.code || authenticatedUser?.hospitalCode || 'HFR-AUTH'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin size={13} className="text-cyan-400" />
              <span>{hospital?.location || 'Campus'}, {hospital?.city || 'Hyderabad'}, {hospital?.state || 'Telangana'}</span>
              <span>•</span>
              <Phone size={13} className="text-cyan-400" />
              <span>{hospital?.phone || authenticatedUser?.phone || '+91 40 2460 0121'}</span>
            </p>
          </div>
        </div>

        {/* Authoritative Single-Tenant Identity Badge (Arbitrary cross-hospital switching disabled) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800/90 px-3.5 py-2 rounded-2xl border border-slate-700 shadow-inner">
            <ShieldCheck size={18} className="text-emerald-400 mr-2 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Authoritative Facility</span>
              <span className="text-xs text-white font-extrabold truncate max-w-[200px] sm:max-w-xs" title={hospital?.name}>
                {hospital?.name || authenticatedUser?.hospitalName || 'Verified Facility'}
              </span>
            </div>
            <span className="ml-2.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap">
              Single Tenant
            </span>
          </div>

          <button
            type="button"
            onClick={() => { refreshQueue(); fetchStatsAndDoctors(); }}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh statistics & clinical queue"
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Hospital Aggregates Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-cyan-50 text-cyan-700 rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Patients</span>
            <span className="text-xl font-extrabold text-slate-900">{stats?.totalPatients || hospitalPatients.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Waiting in OPD</span>
            <span className="text-xl font-extrabold text-amber-700">{stats?.waitingPatients ?? waitingPatients.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-700 rounded-xl">
            <ShieldAlert size={22} className={redFlagPatients.length > 0 ? 'animate-pulse' : ''} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">High-Risk Red Flags</span>
            <span className="text-xl font-extrabold text-red-600">{stats?.redFlagCases ?? redFlagPatients.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <UserCheck size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Unassigned Cases</span>
            <span className="text-xl font-extrabold text-purple-700">{stats?.unassignedCases ?? unassignedPatients.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Completed Today</span>
            <span className="text-xl font-extrabold text-emerald-700">{stats?.completedCases ?? completedPatients.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            backgroundColor: activeTab === 'overview' ? '#0A4D68' : 'transparent',
            color: activeTab === 'overview' ? '#ffffff' : '#475569'
          }}
          className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm whitespace-nowrap"
        >
          <Layers size={16} />
          <span>Departments Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          style={{
            backgroundColor: activeTab === 'queue' ? '#0A4D68' : 'transparent',
            color: activeTab === 'queue' ? '#ffffff' : '#475569'
          }}
          className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm whitespace-nowrap"
        >
          <Users size={16} />
          <span>Patient Intake Queue & Routing ({hospitalPatients.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('doctors')}
          style={{
            backgroundColor: activeTab === 'doctors' ? '#0A4D68' : 'transparent',
            color: activeTab === 'doctors' ? '#ffffff' : '#475569'
          }}
          className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm whitespace-nowrap"
        >
          <Stethoscope size={16} />
          <span>Doctor Roster ({availableDoctors.length})</span>
        </button>
      </div>

      {/* TAB 1: DEPARTMENTS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-cyan-700" />
              <span>Department Case Loads & Routing</span>
            </h3>

            <button
              type="button"
              onClick={() => setShowAddDeptModal(true)}
              className="px-3.5 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus size={15} />
              <span>Add Department</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(stats?.departmentBreakdown || []).map((dept) => (
              <div 
                key={dept.id} 
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-cyan-400 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      {dept.code}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900">
                      {dept.name}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-xl border border-cyan-200">
                    {dept.room_number || 'Room 101'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Waiting</span>
                    <span className="font-extrabold text-amber-700">{dept.waiting_count || 0}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Red Flags</span>
                    <span className="font-extrabold text-red-600">{dept.red_flag_count || 0}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Unassigned</span>
                    <span className="font-extrabold text-purple-700">{dept.unassigned_count || 0}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDeptFilter(dept.id);
                    setActiveTab('queue');
                  }}
                  className="w-full py-2 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-800 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <span>View Queue</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT INTAKE QUEUE */}
      {activeTab === 'queue' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Hospital Patient Cases
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage case routing and assign unassigned patients to authorized clinicians.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="all">All Departments</option>
                {(stats?.departmentBreakdown || []).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Patient Cases Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Token / Patient</th>
                  <th className="py-3 px-4">Department / Room</th>
                  <th className="py-3 px-4">Reason for Visit</th>
                  <th className="py-3 px-4">Triage Priority</th>
                  <th className="py-3 px-4">Assigned Doctor</th>
                  <th className="py-3 px-4">Case Status</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hospitalPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {p.tokenNumber}
                        </span>
                        <div>
                          <span className="font-extrabold text-slate-900 block">{p.name}</span>
                          <span className="text-[11px] text-slate-400">{p.age} Y / {p.gender}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">{p.department}</span>
                      <span className="text-[11px] text-slate-400">{p.roomNumber}</span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <span className="text-slate-700 font-medium">
                        {p.reasonForVisit || (p.chiefComplaints && p.chiefComplaints[0]) || 'General intake'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <TriageBadge level={p.triageLevel} category={p.triageCategory} color={p.triageColor} size="sm" />
                    </td>

                    <td className="py-3.5 px-4">
                      {p.assignedDoctorName || p.assignedDoctor ? (
                        <span className="font-bold text-slate-800">{p.assignedDoctorName || p.assignedDoctor}</span>
                      ) : (
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'History Verified' ? 'bg-emerald-100 text-emerald-800' :
                        p.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setAssignModalPatient(p);
                          setSelectedDoctorId(p.assignedDoctorId || '');
                        }}
                        className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-xl text-xs font-bold transition-colors"
                      >
                        Assign Doctor
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DOCTOR ROSTER */}
      {activeTab === 'doctors' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Authorized Hospital Clinicians
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Doctors registered at {hospital?.name} with authorized department permissions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableDoctors.map((doc) => (
              <div key={doc.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-700 text-white rounded-2xl font-bold">
                      <Stethoscope size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{doc.full_name}</h4>
                      <span className="text-[11px] font-bold text-slate-500 font-mono">
                        {doc.license_number || 'REG-ACTIVE'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 space-y-1 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Authorized Departments:</span>
                  <div className="flex flex-wrap gap-1">
                    {(doc.authorizedDepartments || []).map(dept => (
                      <span key={dept.id} className="bg-white text-cyan-800 font-bold px-2 py-0.5 rounded-md border border-cyan-200 text-[10px]">
                        {dept.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  <span>Contact: <strong>{doc.email || doc.phone}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ASSIGN DOCTOR MODAL */}
      {assignModalPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-5">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Assign Doctor to Patient Case
              </h3>
              <p className="text-xs text-slate-500">
                Assigning <strong>{assignModalPatient.name}</strong> ({assignModalPatient.tokenNumber} - {assignModalPatient.department})
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Select Authorized Clinician:
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="">-- Choose Doctor --</option>
                {availableDoctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.full_name} ({doc.department || 'Specialist'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalPatient(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignDoctor}
                disabled={!selectedDoctorId || assignLoading}
                style={{ backgroundColor: '#088395' }}
                className="flex-1 py-3 px-4 text-white rounded-xl font-bold text-xs hover:opacity-95 transition-all shadow-md disabled:opacity-50"
              >
                {assignLoading ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD DEPARTMENT MODAL */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateDepartment} className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Create Clinical Department / OPD
              </h3>
              <p className="text-xs text-slate-500">
                Register a new OPD unit for {hospital?.name}
              </p>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ophthalmology / Eye Clinic"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OPHTH"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    placeholder="Room 140"
                    value={newDeptRoom}
                    onChange={(e) => setNewDeptRoom(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Eye disorders, vision checks and cataract evaluation"
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddDeptModal(false)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ backgroundColor: '#088395' }}
                className="flex-1 py-3 px-4 text-white rounded-xl font-bold text-xs hover:opacity-95 transition-all shadow-md"
              >
                Create Department
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
