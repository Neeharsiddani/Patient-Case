import React, { useState, useEffect, useMemo } from 'react';
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
  Lock,
  Edit3,
  Key,
  UserX,
  UserPlus,
  ArrowLeftRight,
  FileText,
  CheckCircle,
  XCircle,
  Info,
  History,
  Settings,
  Mail,
  Calendar,
  AlertCircle
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
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'queue' | 'doctors' | 'audit' | 'settings'

  // Queue Filters & Search
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [triageFilter, setTriageFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Doctor Roster State
  const [availableDoctors, setAvailableDoctors] = useState([]);

  // Toast / Notification
  const [toast, setToast] = useState(null); // { type: 'success' | 'error' | 'info', message: '' }
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // 1. Assign Doctor Modal
  const [assignModalPatient, setAssignModalPatient] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // 2. Transfer Patient Modal
  const [transferModalPatient, setTransferModalPatient] = useState(null);
  const [transferTargetDeptId, setTransferTargetDeptId] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  // 3. Operational Case Status Modal
  const [statusModalPatient, setStatusModalPatient] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // 4. View Administrative Patient Record Modal
  const [viewRecordPatientId, setViewRecordPatientId] = useState(null);
  const [recordData, setRecordData] = useState(null);
  const [recordLoading, setRecordLoading] = useState(false);

  // 5. Add Department Modal
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptRoom, setNewDeptRoom] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  // 6. Edit Department Modal
  const [editingDept, setEditingDept] = useState(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptCode, setEditDeptCode] = useState('');
  const [editDeptRoom, setEditDeptRoom] = useState('');
  const [editDeptDesc, setEditDeptDesc] = useState('');
  const [editDeptSubmitting, setEditDeptSubmitting] = useState(false);

  // 7. Toggle Department Status Confirmation Modal
  const [confirmDeptToggle, setConfirmDeptToggle] = useState(null); // { dept, targetStatus }
  const [deptToggleLoading, setDeptToggleLoading] = useState(false);

  // 8. Register Doctor Modal
  const [showRegisterDoctorModal, setShowRegisterDoctorModal] = useState(false);
  const [newDocFullName, setNewDocFullName] = useState('');
  const [newDocUsername, setNewDocUsername] = useState('');
  const [newDocPassword, setNewDocPassword] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocPhone, setNewDocPhone] = useState('');
  const [newDocLicense, setNewDocLicense] = useState('');
  const [newDocQualification, setNewDocQualification] = useState('');
  const [newDocDepartment, setNewDocDepartment] = useState('');
  const [newDocDeptIds, setNewDocDeptIds] = useState([]);
  const [registerDocLoading, setRegisterDocLoading] = useState(false);

  // 9. Edit Doctor Profile & Departments Modal
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editDocFullName, setEditDocFullName] = useState('');
  const [editDocEmail, setEditDocEmail] = useState('');
  const [editDocPhone, setEditDocPhone] = useState('');
  const [editDocLicense, setEditDocLicense] = useState('');
  const [editDocQualification, setEditDocQualification] = useState('');
  const [editDocDepartment, setEditDocDepartment] = useState('');
  const [editDocDeptIds, setEditDocDeptIds] = useState([]);
  const [editDocLoading, setEditDocLoading] = useState(false);

  // 10. Reset Doctor Credentials Modal
  const [resetDoctor, setResetDoctor] = useState(null);
  const [newDoctorPassword, setNewDoctorPassword] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  // 11. Toggle Doctor Status Confirmation Modal
  const [confirmDoctorToggle, setConfirmDoctorToggle] = useState(null); // { doctor, targetStatus }
  const [doctorActiveCasesCount, setDoctorActiveCasesCount] = useState(0);
  const [reassignActiveCasesChoice, setReassignActiveCasesChoice] = useState(true);
  const [doctorToggleLoading, setDoctorToggleLoading] = useState(false);

  // 12. Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  // 13. Hospital Settings State
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    city: '',
    state: '',
    pincode: '',
    description: ''
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Authoritative facility resolution
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
          setSettingsForm({
            name: statsRes.hospital.name || '',
            phone: statsRes.hospital.phone || '',
            email: statsRes.hospital.email || '',
            location: statsRes.hospital.location || '',
            city: statsRes.hospital.city || '',
            state: statsRes.hospital.state || '',
            pincode: statsRes.hospital.pincode || '',
            description: statsRes.hospital.description || ''
          });
        }
      }

      // 2. Fetch full hospital details if not complete
      if (!statsRes?.hospital?.phone || !statsRes?.hospital?.location) {
        try {
          const hospRes = await ApiService.getHospitalById(authoritativeHospitalId);
          if (hospRes?.success && hospRes.hospital) {
            setFacilityMetadata(prev => ({ ...(prev || {}), ...hospRes.hospital }));
            setSettingsForm(prev => ({
              ...prev,
              name: hospRes.hospital.name || prev.name,
              phone: hospRes.hospital.phone || prev.phone,
              email: hospRes.hospital.email || prev.email,
              location: hospRes.hospital.location || prev.location,
              city: hospRes.hospital.city || prev.city,
              state: hospRes.hospital.state || prev.state,
              pincode: hospRes.hospital.pincode || prev.pincode,
              description: hospRes.hospital.description || prev.description
            }));
          }
        } catch (e) {
          console.warn('[MediMitra] Facility lookup notice:', e.message);
        }
      }

      // 3. Authorized doctors roster (including both active and inactive for administrative management)
      const docRes = await ApiService.getHospitalDoctors(authoritativeHospitalId, true);
      if (docRes?.success && Array.isArray(docRes.doctors)) {
        setAvailableDoctors(docRes.doctors);
      }
    } catch (err) {
      console.warn('[MediMitra] Could not fetch authoritative hospital stats:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!authoritativeHospitalId) return;
    setAuditLoading(true);
    try {
      const res = await ApiService.getHospitalAuditLogs(authoritativeHospitalId, {
        limit: 100,
        action: auditActionFilter !== 'all' ? auditActionFilter : undefined
      });
      if (res?.success && Array.isArray(res.logs)) {
        setAuditLogs(res.logs);
      }
    } catch (err) {
      console.warn('[MediMitra] Could not fetch hospital audit logs:', err.message);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (authoritativeHospitalId) {
      fetchStatsAndDoctors();
    }
  }, [authoritativeHospitalId]);

  useEffect(() => {
    if (activeTab === 'audit' && authoritativeHospitalId) {
      fetchAuditLogs();
    }
  }, [activeTab, auditActionFilter, authoritativeHospitalId]);

  // Filter hospital patients strictly fail-closed by authoritativeHospitalId
  const hospitalPatients = useMemo(() => {
    return patients.filter(p => {
      if (!p || !authoritativeHospitalId) return false;
      const pId = p.hospitalId || p.hospital_id || p.hospital?.id;
      return typeof pId === 'string' && pId.trim() === authoritativeHospitalId.trim();
    });
  }, [patients, authoritativeHospitalId]);

  // Multi-Filter & Search applied to hospital patients
  const filteredPatients = useMemo(() => {
    return hospitalPatients.filter(p => {
      // Department filter
      if (selectedDeptFilter !== 'all') {
        const matchId = p.departmentId === selectedDeptFilter;
        const matchName = p.department === selectedDeptFilter;
        if (!matchId && !matchName) return false;
      }
      // Status filter
      if (statusFilter !== 'all') {
        const curStatus = p.status || p.caseStatus;
        if (curStatus !== statusFilter) return false;
      }
      // Triage filter
      if (triageFilter !== 'all') {
        if (String(p.triageLevel) !== String(triageFilter)) return false;
      }
      // Assignment filter
      if (assignedFilter === 'assigned') {
        if (!p.assignedDoctorId && !p.assignedDoctorName && !p.assignedDoctor) return false;
      } else if (assignedFilter === 'unassigned') {
        if (p.assignedDoctorId || p.assignedDoctorName || p.assignedDoctor) return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchToken = p.tokenNumber?.toLowerCase().includes(q);
        const matchAbha = p.abhaId?.toLowerCase().includes(q);
        if (!matchName && !matchToken && !matchAbha) return false;
      }
      return true;
    });
  }, [hospitalPatients, selectedDeptFilter, statusFilter, triageFilter, assignedFilter, searchQuery]);

  const waitingPatients = hospitalPatients.filter(p => p.status === 'Waiting');
  const redFlagPatients = hospitalPatients.filter(p => p.triageLevel <= 2 && p.status !== 'Completed');
  const unassignedPatients = hospitalPatients.filter(p => !p.assignedDoctorId && !p.assignedDoctor && p.status !== 'Completed');
  const completedPatients = hospitalPatients.filter(p => p.status === 'Completed');

  // Available clinical departments in this facility
  const departmentsList = stats?.departmentBreakdown || [];

  // ==========================================
  // HANDLERS: ASSIGN DOCTOR
  // ==========================================
  const handleAssignDoctor = async () => {
    if (!assignModalPatient || !selectedDoctorId || !authoritativeHospitalId) return;
    setAssignLoading(true);
    try {
      const res = await ApiService.assignDoctorToCase(authoritativeHospitalId, assignModalPatient.id, selectedDoctorId);
      if (res?.success) {
        showToast('success', res.message || 'Case assigned successfully.');
        setAssignModalPatient(null);
        setSelectedDoctorId('');
        refreshQueue();
        fetchStatsAndDoctors();
      } else {
        showToast('error', res?.message || 'Failed to assign doctor.');
      }
    } catch (err) {
      showToast('error', err.message || 'Error assigning doctor.');
    } finally {
      setAssignLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: TRANSFER PATIENT DEPARTMENT
  // ==========================================
  const handleTransferPatient = async () => {
    if (!transferModalPatient || !transferTargetDeptId || !authoritativeHospitalId) return;
    setTransferLoading(true);
    try {
      const res = await ApiService.transferPatient(authoritativeHospitalId, transferModalPatient.id, transferTargetDeptId);
      if (res?.success) {
        showToast('success', res.message || 'Patient transferred successfully.');
        setTransferModalPatient(null);
        setTransferTargetDeptId('');
        refreshQueue();
        fetchStatsAndDoctors();
      } else {
        showToast('error', res?.message || 'Failed to transfer patient.');
      }
    } catch (err) {
      showToast('error', err.message || 'Error transferring patient.');
    } finally {
      setTransferLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: OPERATIONAL CASE STATUS
  // ==========================================
  const handleUpdateStatus = async () => {
    if (!statusModalPatient || !selectedStatus || !authoritativeHospitalId) return;
    setStatusLoading(true);
    try {
      const res = await ApiService.updatePatientCaseStatus(authoritativeHospitalId, statusModalPatient.id, selectedStatus);
      if (res?.success) {
        showToast('success', res.message || 'Status updated successfully.');
        setStatusModalPatient(null);
        setSelectedStatus('');
        refreshQueue();
        fetchStatsAndDoctors();
      } else {
        showToast('error', res?.message || 'Failed to update status.');
      }
    } catch (err) {
      showToast('error', err.message || 'Error updating status.');
    } finally {
      setStatusLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: VIEW ADMINISTRATIVE PATIENT RECORD
  // ==========================================
  const handleOpenRecord = async (patient) => {
    setViewRecordPatientId(patient.id);
    setRecordLoading(true);
    setRecordData(null);
    try {
      const res = await ApiService.getPatientAdminRecord(authoritativeHospitalId, patient.id);
      if (res?.success && res.patientRecord) {
        setRecordData(res.patientRecord);
      } else {
        showToast('error', 'Could not load patient administrative record.');
      }
    } catch (err) {
      showToast('error', err.message || 'Error loading patient record.');
    } finally {
      setRecordLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: DEPARTMENT MANAGEMENT
  // ==========================================
  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName || !newDeptCode || !authoritativeHospitalId) return;
    setDeptSubmitting(true);
    try {
      const res = await ApiService.createDepartment(authoritativeHospitalId, {
        name: newDeptName.trim(),
        code: newDeptCode.trim().toUpperCase(),
        roomNumber: newDeptRoom.trim(),
        description: newDeptDesc.trim()
      });
      if (res?.success) {
        showToast('success', res.message || 'Department created successfully.');
        setShowAddDeptModal(false);
        setNewDeptName('');
        setNewDeptCode('');
        setNewDeptRoom('');
        setNewDeptDesc('');
        fetchStatsAndDoctors();
      } else {
        showToast('error', res?.message || 'Failed to create department.');
      }
    } catch (err) {
      showToast('error', err.message || 'Error creating department.');
    } finally {
      setDeptSubmitting(false);
    }
  };

  const handleOpenEditDept = (dept) => {
    setEditingDept(dept);
    setEditDeptName(dept.name || '');
    setEditDeptCode(dept.code || '');
    setEditDeptRoom(dept.room_number || '');
    setEditDeptDesc(dept.description || '');
  };

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    if (!editingDept || !editDeptName || !editDeptCode || !authoritativeHospitalId) return;
    setEditDeptSubmitting(true);
    try {
      const res = await ApiService.updateDepartment(authoritativeHospitalId, editingDept.id, {
        name: editDeptName.trim(),
        code: editDeptCode.trim().toUpperCase(),
        roomNumber: editDeptRoom.trim(),
        description: editDeptDesc.trim()
      });
      if (res?.success) {
        showToast('success', res.message || 'Department updated successfully.');
        setEditingDept(null);
        fetchStatsAndDoctors();
        refreshQueue();
      } else {
        showToast('error', res?.message || 'Failed to update department.');
      }
    } catch (err) {
      showToast('error', err.message || 'Error updating department.');
    } finally {
      setEditDeptSubmitting(false);
    }
  };

  const handleToggleDeptStatus = async () => {
    if (!confirmDeptToggle || !authoritativeHospitalId) return;
    setDeptToggleLoading(true);
    try {
      const res = await ApiService.setDepartmentStatus(authoritativeHospitalId, confirmDeptToggle.dept.id, confirmDeptToggle.targetStatus);
      if (res?.success) {
        showToast('success', res.message || `Department status updated to ${confirmDeptToggle.targetStatus}.`);
        setConfirmDeptToggle(null);
        fetchStatsAndDoctors();
      } else {
        showToast('error', res?.message || 'Failed to update department status.');
      }
    } catch (err) {
      showToast('error', err.message || 'Error changing department status.');
    } finally {
      setDeptToggleLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: DOCTOR & STAFF MANAGEMENT
  // ==========================================
  const handleRegisterDoctor = async (e) => {
    e.preventDefault();
    if (!newDocUsername || !newDocPassword || !newDocFullName || !authoritativeHospitalId) return;
    if (newDocDeptIds.length === 0) {
      showToast('error', 'Please authorize at least one clinical department for this doctor.');
      return;
    }
    setRegisterDocLoading(true);
    try {
      const res = await ApiService.registerDoctor(authoritativeHospitalId, {
        username: newDocUsername.trim().toLowerCase(),
        password: newDocPassword,
        fullName: newDocFullName.trim(),
        email: newDocEmail.trim(),
        phone: newDocPhone.trim(),
        department: newDocDepartment.trim(),
        licenseNumber: newDocLicense.trim(),
        qualification: newDocQualification.trim(),
        departmentIds: newDocDeptIds
      });
      if (res?.success) {
        showToast('success', res.message || 'Doctor registered successfully.');
        setShowRegisterDoctorModal(false);
        setNewDocFullName('');
        setNewDocUsername('');
        setNewDocPassword('');
        setNewDocEmail('');
        setNewDocPhone('');
        setNewDocLicense('');
        setNewDocQualification('');
        setNewDocDepartment('');
        setNewDocDeptIds([]);
        fetchStatsAndDoctors();
      } else {
        showToast('error', res?.message || 'Failed to register doctor.');
      }
    } catch (err) {
      showToast('error', err.message || 'Error registering doctor.');
    } finally {
      setRegisterDocLoading(false);
    }
  };

  const handleOpenEditDoctor = (doc) => {
    setEditingDoctor(doc);
    setEditDocFullName(doc.full_name || '');
    setEditDocEmail(doc.email || '');
    setEditDocPhone(doc.phone || '');
    setEditDocLicense(doc.license_number || '');
    setEditDocQualification(doc.qualification || '');
    setEditDocDepartment(doc.department || '');
    setEditDocDeptIds((doc.authorizedDepartments || []).map(d => d.id));
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    if (!editingDoctor || !editDocFullName || !authoritativeHospitalId) return;
    if (editingDoctor.status === 'ACTIVE' && editDocDeptIds.length === 0) {
      showToast('error', 'An active clinician must have at least one authorized department.');
      return;
    }
    setEditDocLoading(true);
    try {
      const res = await ApiService.updateDoctor(authoritativeHospitalId, editingDoctor.id, {
        fullName: editDocFullName.trim(),
        email: editDocEmail.trim(),
        phone: editDocPhone.trim(),
        department: editDocDepartment.trim(),
        licenseNumber: editDocLicense.trim(),
        qualification: editDocQualification.trim(),
        departmentIds: editDocDeptIds
      });
      if (res?.success) {
        showToast('success', res.message || 'Doctor profile updated successfully.');
        setEditingDoctor(null);
        fetchStatsAndDoctors();
      } else {
        showToast('error', res?.message || 'Failed to update doctor.');
      }
    } catch (err) {
      showToast('error', err.message || 'Error updating doctor profile.');
    } finally {
      setEditDocLoading(false);
    }
  };

  const handleOpenResetPassword = (doc) => {
    setResetDoctor(doc);
    setNewDoctorPassword('');
  };

  const handleResetDoctorPassword = async (e) => {
    e.preventDefault();
    if (!resetDoctor || !newDoctorPassword || newDoctorPassword.length < 6 || !authoritativeHospitalId) {
      showToast('error', 'Password must be at least 6 characters.');
      return;
    }
    setResetPasswordLoading(true);
    try {
      const res = await ApiService.resetDoctorPassword(authoritativeHospitalId, resetDoctor.id, newDoctorPassword);
      if (res?.success) {
        showToast('success', res.message || 'Doctor credentials reset successfully.');
        setResetDoctor(null);
        setNewDoctorPassword('');
      } else {
        showToast('error', res?.message || 'Failed to reset credentials.');
      }
    } catch (err) {
      showToast('error', err.message || 'Error resetting password.');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleOpenToggleDoctorStatus = (doc, targetStatus) => {
    const activeAssignedCases = hospitalPatients.filter(p => p.assignedDoctorId === doc.id && p.status !== 'Completed');
    setConfirmDoctorToggle({ doc, targetStatus });
    setDoctorActiveCasesCount(activeAssignedCases.length);
    setReassignActiveCasesChoice(true);
  };

  const handleToggleDoctorStatus = async () => {
    if (!confirmDoctorToggle || !authoritativeHospitalId) return;
    setDoctorToggleLoading(true);
    try {
      const res = await ApiService.setDoctorStatus(
        authoritativeHospitalId, 
        confirmDoctorToggle.doc.id, 
        confirmDoctorToggle.targetStatus, 
        reassignActiveCasesChoice
      );
      if (res?.success) {
        showToast('success', res.message || 'Doctor status updated successfully.');
        setConfirmDoctorToggle(null);
        fetchStatsAndDoctors();
        refreshQueue();
      } else {
        showToast('error', res?.message || 'Failed to change doctor status.');
      }
    } catch (err) {
      showToast('error', err.message || 'Error changing doctor status.');
    } finally {
      setDoctorToggleLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: HOSPITAL SETTINGS
  // ==========================================
  const handleSaveHospitalSettings = async (e) => {
    e.preventDefault();
    if (!authoritativeHospitalId) return;
    setSettingsSaving(true);
    try {
      const res = await ApiService.updateHospitalSettings(authoritativeHospitalId, settingsForm);
      if (res?.success) {
        showToast('success', 'Hospital configurable metadata updated successfully.');
        if (res.hospital) {
          setFacilityMetadata(res.hospital);
        }
      } else {
        showToast('error', res?.message || 'Failed to update settings.');
      }
    } catch (err) {
      showToast('error', err.message || 'Error updating settings.');
    } finally {
      setSettingsSaving(false);
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

  // Eligible doctors strictly for the assign modal (must be ACTIVE and authorized for patient's department)
  const eligibleDoctorsForModal = useMemo(() => {
    if (!assignModalPatient) return [];
    return availableDoctors.filter(doc => {
      if (doc.status !== 'ACTIVE') return false;
      const depts = doc.authorizedDepartments || [];
      return depts.some(d => d.id === assignModalPatient.departmentId);
    });
  }, [availableDoctors, assignModalPatient]);

  const isAssignModalPatientAyush = useMemo(() => {
    if (!assignModalPatient) return false;
    const name = assignModalPatient.department?.toLowerCase() || '';
    const id = assignModalPatient.departmentId?.toLowerCase() || '';
    return name.includes('ayush') || name.includes('ayurveda') || id.includes('ayush');
  }, [assignModalPatient]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border transition-all shadow-md ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
          'bg-cyan-50 text-cyan-800 border-cyan-200'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <CheckCircle size={16} className="text-emerald-600" />}
            {toast.type === 'error' && <AlertCircle size={16} className="text-red-600" />}
            {toast.type === 'info' && <Info size={16} className="text-cyan-600" />}
            <span>{toast.message}</span>
          </div>
          <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
            <XCircle size={15} />
          </button>
        </div>
      )}

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
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
              <MapPin size={13} className="text-cyan-400" />
              <span>{hospital?.location || 'Official Campus'}, {hospital?.city || 'Hyderabad'}, {hospital?.state || 'Telangana'}</span>
              <span>•</span>
              <Phone size={13} className="text-cyan-400" />
              <span>{hospital?.phone || authenticatedUser?.phone || '+91 40 2460 0121'}</span>
            </p>
          </div>
        </div>

        {/* Authoritative Single-Tenant Identity Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800/90 px-3.5 py-2 rounded-2xl border border-slate-700 shadow-inner">
            <ShieldCheck size={18} className="text-emerald-400 mr-2 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Authoritative Facility</span>
              <span className="text-xs text-white font-extrabold truncate max-w-[180px] sm:max-w-xs" title={hospital?.name}>
                {hospital?.name || authenticatedUser?.hospitalName || 'Verified Facility'}
              </span>
            </div>
            <span className="ml-2.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap">
              Single Tenant
            </span>
          </div>

          <button
            type="button"
            onClick={() => { refreshQueue(); fetchStatsAndDoctors(); if (activeTab === 'audit') fetchAuditLogs(); }}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh statistics, staff, and queues"
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
            <span className="text-xl font-extrabold text-slate-900">{stats?.totalPatients ?? hospitalPatients.length}</span>
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

      {/* Navigation Tabs (Preserving 3 core tabs + Adding Audit History & Hospital Settings) */}
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

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          style={{
            backgroundColor: activeTab === 'audit' ? '#0A4D68' : 'transparent',
            color: activeTab === 'audit' ? '#ffffff' : '#475569'
          }}
          className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm whitespace-nowrap"
        >
          <History size={16} />
          <span>Audit History</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          style={{
            backgroundColor: activeTab === 'settings' ? '#0A4D68' : 'transparent',
            color: activeTab === 'settings' ? '#ffffff' : '#475569'
          }}
          className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm whitespace-nowrap"
        >
          <Settings size={16} />
          <span>Hospital Settings</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DEPARTMENTS OVERVIEW & OPD MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Layers size={18} className="text-cyan-700" />
                <span>Clinical Departments & OPD Workloads</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time operational workloads, room routing, and department activation control.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddDeptModal(true)}
              className="px-3.5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus size={15} />
              <span>Add Department</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentsList.map((dept) => (
              <div 
                key={dept.id} 
                className={`bg-white p-5 rounded-3xl border shadow-sm space-y-3 transition-all ${
                  dept.status === 'INACTIVE' ? 'border-slate-200 opacity-70 bg-slate-50/60' : 'border-slate-200 hover:border-cyan-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        {dept.code}
                      </span>
                      {dept.status === 'INACTIVE' ? (
                        <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                          Disabled
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Active OPD
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                      {dept.name}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-xl border border-cyan-200">
                    {dept.room_number || 'Room TBD'}
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

                {/* Department Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDeptFilter(dept.id);
                      setActiveTab('queue');
                    }}
                    className="flex-1 py-1.5 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-800 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Queue</span>
                    <ChevronRight size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditDept(dept)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
                    title="Edit Department"
                  >
                    <Edit3 size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeptToggle({ dept, targetStatus: dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                      dept.status === 'ACTIVE' 
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200' 
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {dept.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PATIENT INTAKE QUEUE & ROUTING */}
      {/* ========================================================================= */}
      {activeTab === 'queue' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Hospital Patient Intake & Routing Queue
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage operational routing, transfer departments, and assign authorized clinicians.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative min-w-[240px]">
              <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient or token..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* Filters Ribbon */}
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-2">
              <Filter size={14} />
              <span>Filters:</span>
            </div>

            {/* Department Filter */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departmentsList.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Waiting">Waiting</option>
              <option value="Assigned">Assigned</option>
              <option value="History Verified">History Verified</option>
              <option value="In-Consultation">In-Consultation</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Triage Filter */}
            <select
              value={triageFilter}
              onChange={(e) => setTriageFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none"
            >
              <option value="all">All Triage Levels</option>
              <option value="1">P1 - Resuscitation (Red)</option>
              <option value="2">P2 - Emergent (Red)</option>
              <option value="3">P3 - Urgent (Amber)</option>
              <option value="4">P4 - Routine (Green)</option>
            </select>

            {/* Assignment Filter */}
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none"
            >
              <option value="all">All Assignments</option>
              <option value="unassigned">Unassigned Only</option>
              <option value="assigned">Assigned Only</option>
            </select>

            {(selectedDeptFilter !== 'all' || statusFilter !== 'all' || triageFilter !== 'all' || assignedFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDeptFilter('all');
                  setStatusFilter('all');
                  setTriageFilter('all');
                  setAssignedFilter('all');
                  setSearchQuery('');
                }}
                className="text-[11px] font-bold text-cyan-700 hover:text-cyan-900 underline ml-2"
              >
                Reset Filters
              </button>
            )}

            <div className="ml-auto text-xs text-slate-500 font-semibold">
              Showing <strong>{filteredPatients.length}</strong> of <strong>{hospitalPatients.length}</strong> cases
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
                  <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((p) => {
                  const isAyush = p.department?.toLowerCase().includes('ayush') || p.department?.toLowerCase().includes('ayurveda');
                  return (
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
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{p.department}</span>
                          {isAyush && (
                            <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-300 uppercase">
                              AYUSH
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block">{p.roomNumber || 'Room TBD'}</span>
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
                        ) : isAyush ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full inline-block">
                            Awaiting AYUSH clinician assignment
                          </span>
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
                          p.status === 'Assigned' ? 'bg-cyan-100 text-cyan-800' :
                          p.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>

                      {/* Actions Menu */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenRecord(p)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors"
                            title="View Administrative Record"
                          >
                            <FileText size={13} className="inline mr-1" />
                            <span>Record</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAssignModalPatient(p);
                              setSelectedDoctorId(p.assignedDoctorId || '');
                            }}
                            className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            Assign
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setTransferModalPatient(p);
                              setTransferTargetDeptId(p.departmentId || '');
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 text-[11px] font-bold transition-colors"
                            title="Transfer Department"
                          >
                            <ArrowLeftRight size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setStatusModalPatient(p);
                              setSelectedStatus(p.status || 'Waiting');
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 text-[11px] font-bold transition-colors"
                            title="Change Operational Status"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No patient cases match the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DOCTOR ROSTER & STAFF MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'doctors' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Authorized Facility Clinicians & Staff Roster
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Doctors registered at {hospital?.name} with authorized department permissions and credential administration.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRegisterDoctorModal(true)}
              className="px-3.5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
            >
              <UserPlus size={15} />
              <span>Register Doctor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableDoctors.map((doc) => (
              <div 
                key={doc.id} 
                className={`bg-slate-50 p-5 rounded-3xl border space-y-3 transition-all ${
                  doc.status === 'INACTIVE' ? 'border-red-200 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl font-bold text-white ${doc.status === 'INACTIVE' ? 'bg-slate-400' : 'bg-cyan-700'}`}>
                      <Stethoscope size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{doc.full_name}</h4>
                      <span className="text-[11px] font-bold text-slate-500 font-mono block">
                        {doc.license_number || 'REG-ACTIVE'}
                      </span>
                      {doc.qualification && (
                        <span className="text-[10px] text-cyan-800 font-semibold block">
                          {doc.qualification}
                        </span>
                      )}
                    </div>
                  </div>
                  {doc.status === 'INACTIVE' ? (
                    <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full">
                      Disabled
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Authorized Departments:</span>
                  <div className="flex flex-wrap gap-1">
                    {(doc.authorizedDepartments || []).map(dept => {
                      const isDeptAyush = dept.name?.toLowerCase().includes('ayush') || dept.name?.toLowerCase().includes('ayurveda');
                      return (
                        <span key={dept.id} className={`font-bold px-2 py-0.5 rounded-md text-[10px] border ${
                          isDeptAyush 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-white text-cyan-800 border-cyan-200'
                        }`}>
                          {dept.name}
                        </span>
                      );
                    })}
                    {(!doc.authorizedDepartments || doc.authorizedDepartments.length === 0) && (
                      <span className="text-[10px] text-red-600 font-bold">No authorized departments</span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                  <div>Contact: <strong>{doc.email || doc.phone || 'N/A'}</strong></div>
                  <div>Username: <strong className="font-mono text-slate-700">{doc.username}</strong></div>
                </div>

                {/* Doctor Administrative Actions */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleOpenEditDoctor(doc)}
                    className="flex-1 py-1.5 bg-white hover:bg-cyan-50 text-cyan-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenResetPassword(doc)}
                    className="flex-1 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Key size={12} />
                    <span>Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenToggleDoctorStatus(doc, doc.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      doc.status === 'ACTIVE'
                        ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {doc.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUDIT HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <History size={18} className="text-cyan-700" />
                <span>Facility Immutable Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                DPDP Act 2023 compliant audit logs strictly scoped to {hospital?.name}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none"
              >
                <option value="all">All Audit Actions</option>
                <option value="DOCTOR_ASSIGNED_TO_CASE">Doctor Assigned</option>
                <option value="PATIENT_TRANSFERRED_DEPARTMENT">Patient Transferred</option>
                <option value="PATIENT_OPERATIONAL_STATUS_CHANGED">Status Changed</option>
                <option value="DOCTOR_REGISTERED">Doctor Registered</option>
                <option value="DOCTOR_PROFILE_UPDATED">Doctor Profile Updated</option>
                <option value="DOCTOR_STATUS_TOGGLED">Doctor Status Toggled</option>
                <option value="DOCTOR_CREDENTIALS_RESET">Doctor Credentials Reset</option>
                <option value="DEPARTMENT_CREATED">Department Created</option>
                <option value="DEPARTMENT_UPDATED">Department Updated</option>
                <option value="DEPARTMENT_STATUS_TOGGLED">Department Status Toggled</option>
                <option value="HOSPITAL_SETTINGS_UPDATED">Hospital Settings Updated</option>
              </select>

              <button
                type="button"
                onClick={fetchAuditLogs}
                disabled={auditLoading}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={13} className={auditLoading ? 'animate-spin' : ''} />
                <span>Reload</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource Target</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 rounded-r-xl">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{log.userId}</div>
                      <span className="text-[10px] text-slate-400 font-mono font-normal uppercase">{log.userRole}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded-full">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-bold text-[11px] block">{log.resourceType}</span>
                      <span className="text-[10px] font-mono text-slate-400">{log.resourceId || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-[11px] text-slate-600">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}

                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      {auditLoading ? 'Loading audit records...' : 'No audit history found for this facility.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: HOSPITAL SETTINGS & METADATA */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Authoritative Identifiers Box */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Lock size={18} className="text-cyan-400" />
              <h3 className="text-base font-extrabold">Authoritative Facility Data (Protected)</h3>
            </div>
            <p className="text-xs text-slate-400">
              Authoritative identifiers are verified against the National Health Facility Registry (HFR) and cannot be modified by local facility administrators.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Facility ID</span>
                <span className="text-sm font-extrabold font-mono text-white">{hospital?.id}</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Facility Code</span>
                <span className="text-sm font-extrabold font-mono text-cyan-300">{hospital?.code}</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">HFR Identifier</span>
                <span className="text-sm font-extrabold font-mono text-emerald-300">{hospital?.hfr_id || 'HFR-AUTH'}</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Facility Type</span>
                <span className="text-xs font-bold text-slate-200">{hospital?.facility_type || 'General Hospital'}</span>
              </div>
            </div>
          </div>

          {/* Configurable Metadata Form */}
          <form onSubmit={handleSaveHospitalSettings} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Settings size={18} className="text-cyan-700" />
                <span>Hospital-Configurable Profile & Contact Information</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update administrative facility profile details, public contact numbers, and campus address.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="md:col-span-2">
                <label className="block text-slate-700 mb-1">Hospital Display Name</label>
                <input
                  type="text"
                  required
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 mb-1">Campus / Address</label>
                <input
                  type="text"
                  value={settingsForm.location}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={settingsForm.city}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={settingsForm.state}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={settingsForm.pincode}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, pincode: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Facility Description</label>
                <textarea
                  rows={2}
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={settingsSaving}
                style={{ backgroundColor: '#088395' }}
                className="px-6 py-2.5 text-white rounded-xl font-bold text-xs hover:opacity-95 transition-all shadow-md disabled:opacity-50"
              >
                {settingsSaving ? 'Saving...' : 'Save Hospital Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ASSIGN DOCTOR */}
      {/* ========================================================================= */}
      {assignModalPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-5">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Assign Clinician to Patient Case
              </h3>
              <p className="text-xs text-slate-500">
                Assigning <strong>{assignModalPatient.name}</strong> ({assignModalPatient.tokenNumber} - {assignModalPatient.department})
              </p>
            </div>

            {/* AYUSH Alert */}
            {isAssignModalPatientAyush && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-start gap-2 text-xs text-emerald-800">
                <Sparkles size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">AYUSH / Ayurvedic Routing Mode:</strong>
                  Only clinicians authorized for AYUSH departments can be assigned to this case. General medicine or non-AYUSH clinicians cannot be selected.
                </div>
              </div>
            )}

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
                {eligibleDoctorsForModal.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.full_name} ({doc.qualification || doc.department || 'Specialist'})
                  </option>
                ))}
              </select>

              {eligibleDoctorsForModal.length === 0 && (
                <p className="text-xs text-amber-700 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  ⚠️ No active clinician authorized for <strong>{assignModalPatient.department}</strong> was found. Please register or authorize an eligible doctor in Doctor Roster.
                </p>
              )}
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

      {/* ========================================================================= */}
      {/* MODAL 2: TRANSFER PATIENT DEPARTMENT */}
      {/* ========================================================================= */}
      {transferModalPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-5">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Transfer Patient Department / OPD
              </h3>
              <p className="text-xs text-slate-500">
                Operational transfer for <strong>{transferModalPatient.name}</strong> ({transferModalPatient.tokenNumber})
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div>Current Department: <strong>{transferModalPatient.department}</strong></div>
              <div>Current Clinician: <strong>{transferModalPatient.assignedDoctorName || 'Unassigned'}</strong></div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Select Target Department:
              </label>
              <select
                value={transferTargetDeptId}
                onChange={(e) => setTransferTargetDeptId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold focus:bg-white focus:outline-none"
              >
                <option value="">-- Choose Target Department --</option>
                {departmentsList
                  .filter(d => d.status !== 'INACTIVE')
                  .map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.room_number || 'Room TBD'})
                    </option>
                  ))}
              </select>

              <p className="text-[11px] text-slate-500">
                ℹ️ Doctor department authorization will be automatically re-evaluated. If the currently assigned doctor is not authorized for the new department (e.g. AYUSH transfer), the assignment will be safely cleared to Waiting status.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTransferModalPatient(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransferPatient}
                disabled={!transferTargetDeptId || transferTargetDeptId === transferModalPatient.departmentId || transferLoading}
                style={{ backgroundColor: '#088395' }}
                className="flex-1 py-3 px-4 text-white rounded-xl font-bold text-xs hover:opacity-95 transition-all shadow-md disabled:opacity-50"
              >
                {transferLoading ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: OPERATIONAL CASE STATUS */}
      {/* ========================================================================= */}
      {statusModalPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-5">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Update Operational Case Status
              </h3>
              <p className="text-xs text-slate-500">
                Updating status for <strong>{statusModalPatient.name}</strong> ({statusModalPatient.tokenNumber})
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Select Operational Status:
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold focus:bg-white focus:outline-none"
              >
                <option value="Waiting">Waiting</option>
                <option value="Assigned">Assigned</option>
                <option value="In-Consultation">In-Consultation</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>

              <p className="text-[11px] text-slate-500">
                ⚠️ Administrative operational status does NOT alter clinician clinical verification or signed prescription records.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalPatient(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={statusLoading}
                style={{ backgroundColor: '#088395' }}
                className="flex-1 py-3 px-4 text-white rounded-xl font-bold text-xs hover:opacity-95 transition-all shadow-md disabled:opacity-50"
              >
                {statusLoading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: COMPLETE ADMINISTRATIVE PATIENT RECORD */}
      {/* ========================================================================= */}
      {viewRecordPatientId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText size={18} className="text-cyan-700" />
                  <span>Administrative Patient Record</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Read-only administrative routing and metadata view.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewRecordPatientId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <XCircle size={18} />
              </button>
            </div>

            {recordLoading && (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading administrative record...
              </div>
            )}

            {!recordLoading && recordData && (
              <div className="space-y-4 text-xs">
                {/* 1. Administrative Header */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-mono font-black text-cyan-300 bg-slate-800 px-2 py-0.5 rounded text-xs">
                      {recordData.administrativeInfo.tokenNumber}
                    </span>
                    <h4 className="text-base font-extrabold text-white mt-1">
                      {recordData.patientIdentity.name}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {recordData.patientIdentity.age} Y / {recordData.patientIdentity.gender} • ABHA: {recordData.patientIdentity.abhaId || 'N/A'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Operational Status</span>
                    <span className="font-bold text-emerald-300">{recordData.administrativeInfo.operationalStatus}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {recordData.administrativeInfo.department} ({recordData.administrativeInfo.roomNumber || 'Room TBD'})
                    </span>
                  </div>
                </div>

                {/* 2. Patient-Reported Information */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Patient-Reported Intake Information:
                  </span>
                  <div>
                    <strong>Reason for Visit:</strong> {recordData.patientReportedData.reasonForVisit || 'General intake'}
                  </div>
                  {recordData.patientReportedData.chiefComplaints?.length > 0 && (
                    <div>
                      <strong>Chief Complaints:</strong> {recordData.patientReportedData.chiefComplaints.join(', ')}
                    </div>
                  )}
                  {recordData.patientReportedData.drugAllergies?.length > 0 && (
                    <div className="text-red-700 font-bold">
                      Allergies: {recordData.patientReportedData.drugAllergies.join(', ')}
                    </div>
                  )}
                  {recordData.patientReportedData.vitals && (
                    <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                      <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-400 block">BP</span>
                        <span className="font-bold">{recordData.patientReportedData.vitals.bpSystolic}/{recordData.patientReportedData.vitals.bpDiastolic}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-400 block">Pulse</span>
                        <span className="font-bold">{recordData.patientReportedData.vitals.pulse} bpm</span>
                      </div>
                      <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-400 block">SpO2</span>
                        <span className="font-bold">{recordData.patientReportedData.vitals.spo2}%</span>
                      </div>
                      <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-400 block">Temp</span>
                        <span className="font-bold">{recordData.patientReportedData.vitals.temp}°F</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Machine-Extracted Document Metadata (Read-Only) */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Machine-Extracted Document Metadata ({recordData.machineExtractedMetadata.documentCount} items):
                  </span>
                  {recordData.machineExtractedMetadata.documents.map(doc => (
                    <div key={doc.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">{doc.filename}</span>
                        <span className="text-[10px] text-slate-400">{doc.docType} • {doc.hospital || 'Facility'}</span>
                      </div>
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {doc.status}
                      </span>
                    </div>
                  ))}
                  {recordData.machineExtractedMetadata.documentCount === 0 && (
                    <span className="text-slate-400 text-xs italic">No uploaded documents on record.</span>
                  )}
                </div>

                {/* 4. Clinician Verification Status */}
                <div className="bg-cyan-50/60 p-4 rounded-2xl border border-cyan-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-900 block">
                    Clinician Encounter & Verification Status:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-xl border border-cyan-100">
                      <span className="text-[9px] text-slate-400 block">Assigned Clinician</span>
                      <span className="font-bold text-slate-800">{recordData.administrativeInfo.assignedDoctorName || 'None'}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-cyan-100">
                      <span className="text-[9px] text-slate-400 block">Clinical Verification</span>
                      <span className="font-bold text-cyan-800">{recordData.clinicalEncounterStatus.verificationStatus}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-semibold">
                  🛡️ <strong>Clinical Safety Protection:</strong> Clinical diagnosis, drug prescriptions, and AYUSH assessments are strictly controlled by the assigned clinician. Administrators manage queue routing and clinician allocation only.
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewRecordPatientId(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CREATE DEPARTMENT */}
      {/* ========================================================================= */}
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl uppercase"
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
                disabled={deptSubmitting}
                style={{ backgroundColor: '#088395' }}
                className="flex-1 py-3 px-4 text-white rounded-xl font-bold text-xs hover:opacity-95 transition-all shadow-md disabled:opacity-50"
              >
                {deptSubmitting ? 'Creating...' : 'Create Department'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: EDIT DEPARTMENT */}
      {/* ========================================================================= */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUpdateDepartment} className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Edit Clinical Department / OPD
              </h3>
              <p className="text-xs text-slate-500">
                Updating {editingDept.name} ({editingDept.code})
              </p>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={editDeptCode}
                    onChange={(e) => setEditDeptCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={editDeptRoom}
                    onChange={(e) => setEditDeptRoom(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDeptDesc}
                  onChange={(e) => setEditDeptDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editDeptSubmitting}
                style={{ backgroundColor: '#088395' }}
                className="flex-1 py-3 px-4 text-white rounded-xl font-bold text-xs hover:opacity-95 transition-all shadow-md disabled:opacity-50"
              >
                {editDeptSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: CONFIRM DEPARTMENT ENABLE / DISABLE */}
      {/* ========================================================================= */}
      {confirmDeptToggle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                {confirmDeptToggle.targetStatus === 'INACTIVE' ? 'Disable Department?' : 'Enable Department?'}
              </h3>
              <p className="text-xs text-slate-500">
                {confirmDeptToggle.dept.name} ({confirmDeptToggle.dept.code})
              </p>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              {confirmDeptToggle.targetStatus === 'INACTIVE' ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl space-y-1">
                  <p className="font-bold">⚠️ Consequence of Disabling Department:</p>
                  <p>Disabled departments will not accept new patient routing or patient assignments. Historical records and existing consultations remain intact.</p>
                </div>
              ) : (
                <p>Enabling this department will restore it as an active OPD for patient routing and intake assignments.</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeptToggle(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleDeptStatus}
                disabled={deptToggleLoading}
                className={`flex-1 py-2.5 px-4 text-white rounded-xl font-bold text-xs shadow-md transition-all ${
                  confirmDeptToggle.targetStatus === 'INACTIVE' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {deptToggleLoading ? 'Processing...' : confirmDeptToggle.targetStatus === 'INACTIVE' ? 'Disable Department' : 'Enable Department'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: REGISTER DOCTOR */}
      {/* ========================================================================= */}
      {showRegisterDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleRegisterDoctor} className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Register Authorized Clinician
              </h3>
              <p className="text-xs text-slate-500">
                Add an authorized medical practitioner to {hospital?.name}
              </p>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Full Name & Degree</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sudha Murthy, MD"
                  value={newDocFullName}
                  onChange={(e) => setNewDocFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">Username (Login)</label>
                  <input
                    type="text"
                    required
                    placeholder="dr.sudha"
                    value={newDocUsername}
                    onChange={(e) => setNewDocUsername(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newDocPassword}
                    onChange={(e) => setNewDocPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">Registration / License No.</label>
                  <input
                    type="text"
                    placeholder="e.g. TS-MCI-2020-55112"
                    value={newDocLicense}
                    onChange={(e) => setNewDocLicense(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS, MD (General Medicine)"
                    value={newDocQualification}
                    onChange={(e) => setNewDocQualification(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="doctor@hospital.gov.in"
                    value={newDocEmail}
                    onChange={(e) => setNewDocEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9845012345"
                    value={newDocPhone}
                    onChange={(e) => setNewDocPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Primary Specialty Display</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology & General Medicine"
                  value={newDocDepartment}
                  onChange={(e) => setNewDocDepartment(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Department Authorizations Multi-Select */}
              <div>
                <label className="block text-slate-700 mb-1.5">
                  Authorized Clinical Departments: <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl max-h-36 overflow-y-auto">
                  {departmentsList.map(d => {
                    const isChecked = newDocDeptIds.includes(d.id);
                    return (
                      <label key={d.id} className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewDocDeptIds(prev => [...prev, d.id]);
                            } else {
                              setNewDocDeptIds(prev => prev.filter(id => id !== d.id));
                            }
                          }}
                          className="rounded text-cyan-600 focus:ring-cyan-500"
                        />
                        <span className="font-semibold text-slate-800">{d.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRegisterDoctorModal(false)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={registerDocLoading}
                style={{ backgroundColor: '#088395' }}
                className="flex-1 py-3 px-4 text-white rounded-xl font-bold text-xs hover:opacity-95 transition-all shadow-md disabled:opacity-50"
              >
                {registerDocLoading ? 'Registering...' : 'Register Doctor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: EDIT DOCTOR & AUTHORIZATIONS */}
      {/* ========================================================================= */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUpdateDoctor} className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Edit Clinician Profile & Permissions
              </h3>
              <p className="text-xs text-slate-500">
                Updating {editingDoctor.full_name} ({editingDoctor.username})
              </p>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Full Name & Credentials</label>
                <input
                  type="text"
                  required
                  value={editDocFullName}
                  onChange={(e) => setEditDocFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">Registration / License</label>
                  <input
                    type="text"
                    value={editDocLicense}
                    onChange={(e) => setEditDocLicense(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={editDocQualification}
                    onChange={(e) => setEditDocQualification(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editDocEmail}
                    onChange={(e) => setEditDocEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editDocPhone}
                    onChange={(e) => setEditDocPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Department / Specialty String</label>
                <input
                  type="text"
                  value={editDocDepartment}
                  onChange={(e) => setEditDocDepartment(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Department Authorizations Multi-Select */}
              <div>
                <label className="block text-slate-700 mb-1.5">
                  Authorized Clinical Departments: <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl max-h-36 overflow-y-auto">
                  {departmentsList.map(d => {
                    const isChecked = editDocDeptIds.includes(d.id);
                    return (
                      <label key={d.id} className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditDocDeptIds(prev => [...prev, d.id]);
                            } else {
                              setEditDocDeptIds(prev => prev.filter(id => id !== d.id));
                            }
                          }}
                          className="rounded text-cyan-600 focus:ring-cyan-500"
                        />
                        <span className="font-semibold text-slate-800">{d.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingDoctor(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editDocLoading}
                style={{ backgroundColor: '#088395' }}
                className="flex-1 py-3 px-4 text-white rounded-xl font-bold text-xs hover:opacity-95 transition-all shadow-md disabled:opacity-50"
              >
                {editDocLoading ? 'Saving...' : 'Save Profile & Permissions'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 10: RESET DOCTOR PASSWORD */}
      {/* ========================================================================= */}
      {resetDoctor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleResetDoctorPassword} className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Reset Clinician Credentials
              </h3>
              <p className="text-xs text-slate-500">
                Securely resetting password for <strong>Dr. {resetDoctor.full_name}</strong> ({resetDoctor.username})
              </p>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <label className="block text-slate-700">New Password</label>
              <input
                type="password"
                required
                placeholder="Enter new password (min 6 characters)"
                value={newDoctorPassword}
                onChange={(e) => setNewDoctorPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl"
              />
              <p className="text-[11px] text-slate-500">
                ℹ️ Password will be hashed using bcrypt (10 rounds) before SQLite database persistence. Plaintext passwords are never stored.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetDoctor(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetPasswordLoading || newDoctorPassword.length < 6}
                style={{ backgroundColor: '#088395' }}
                className="flex-1 py-3 px-4 text-white rounded-xl font-bold text-xs hover:opacity-95 transition-all shadow-md disabled:opacity-50"
              >
                {resetPasswordLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 11: CONFIRM DOCTOR STATUS TOGGLE */}
      {/* ========================================================================= */}
      {confirmDoctorToggle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                {confirmDoctorToggle.targetStatus === 'INACTIVE' ? `Disable Dr. ${confirmDoctorToggle.doc.full_name}?` : `Enable Dr. ${confirmDoctorToggle.doc.full_name}?`}
              </h3>
              <p className="text-xs text-slate-500">
                Staff username: <strong>{confirmDoctorToggle.doc.username}</strong>
              </p>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              {confirmDoctorToggle.targetStatus === 'INACTIVE' ? (
                <>
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl space-y-1">
                    <p className="font-bold">⚠️ Consequence of Disabling Clinician:</p>
                    <p>Disabled clinicians cannot log in or receive new patient assignments. Historical clinical notes and verified records remain completely intact.</p>
                  </div>

                  {doctorActiveCasesCount > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-2xl space-y-2">
                      <p className="font-bold">
                        Notice: Dr. {confirmDoctorToggle.doc.full_name} has {doctorActiveCasesCount} active assigned patient case(s).
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-red-950">
                        <input
                          type="checkbox"
                          checked={reassignActiveCasesChoice}
                          onChange={(e) => setReassignActiveCasesChoice(e.target.checked)}
                          className="rounded text-red-600 focus:ring-red-500"
                        />
                        <span>Safely return these {doctorActiveCasesCount} active cases to the Waiting queue</span>
                      </label>
                    </div>
                  )}
                </>
              ) : (
                <p>Activating this clinician will restore their login access and allow assigning new patient intake cases to their authorized departments.</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDoctorToggle(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleDoctorStatus}
                disabled={doctorToggleLoading}
                className={`flex-1 py-2.5 px-4 text-white rounded-xl font-bold text-xs shadow-md transition-all ${
                  confirmDoctorToggle.targetStatus === 'INACTIVE' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {doctorToggleLoading ? 'Updating...' : confirmDoctorToggle.targetStatus === 'INACTIVE' ? 'Disable Doctor' : 'Activate Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
