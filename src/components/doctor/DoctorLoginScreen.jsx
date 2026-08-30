import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Lock, 
  KeyRound, 
  Stethoscope, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Search,
  MapPin,
  Hospital
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { ApiService } from '../../services/api';
import { MediMitraLogo } from '../common/MediMitraLogo';

export const DoctorLoginScreen = ({ onBack, onLoginSuccess }) => {
  const { handleUserLogin } = usePatient();

  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [selectedHospitalName, setSelectedHospitalName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('All States');
  const [loading, setLoading] = useState(false);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [hospitalsData, setHospitalsData] = useState([]);
  const [availableStates, setAvailableStates] = useState(['All States']);

  // Fetch hospitals from centralized directory
  const loadHospitals = useCallback(async (querySearch, queryState) => {
    setHospitalsLoading(true);
    try {
      const res = await ApiService.getHospitals({
        search: querySearch,
        state: queryState === 'All States' ? '' : queryState,
        limit: 20
      });
      if (res?.success) {
        setHospitalsData(res.hospitals || []);
        if (res.filters?.states) setAvailableStates(res.filters.states);
      }
    } catch (err) {
      console.warn('Hospital directory load failed:', err);
    } finally {
      setHospitalsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadHospitals(searchTerm, selectedState);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, selectedState, loadHospitals]);

  const selectedHospital = hospitalsData.find(h => h.id === selectedHospitalId) || (
    selectedHospitalId ? { id: selectedHospitalId, name: selectedHospitalName } : null
  );

  // Quick staff credentials for testing demonstration
  const demoStaffProfiles = [
    { username: 'dr.sharma', password: 'Doctor@123', name: 'Dr. Rajesh Sharma, MD', dept: 'Cardiology & General Medicine', hospId: 'hosp-ggh-hyd', hospName: 'Government General Hospital (Osmania)' },
    { username: 'dr.anand', password: 'Doctor@123', name: 'Dr. Anand Verma, MS', dept: 'Orthopedics', hospId: 'hosp-ggh-hyd', hospName: 'Government General Hospital (Osmania)' },
    { username: 'dr.kiran', password: 'Doctor@123', name: 'Dr. Kiran Reddy, MD, DM', dept: 'Cardiology', hospId: 'hosp-apollo-hyd', hospName: 'Apollo Hospitals Jubilee Hills' },
    { username: 'admin.ggh', password: 'Admin@123', name: 'GGH Administrator', dept: 'Administration', hospId: 'hosp-ggh-hyd', hospName: 'Government General Hospital (Osmania)' }
  ];

  const handleSelectDemoProfile = (profile) => {
    setSelectedHospitalId(profile.hospId);
    setSelectedHospitalName(profile.hospName);
    setUsername(profile.username);
    setPassword(profile.password);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHospitalId) {
      setError('Please select your healthcare facility from Step 1 on the left before logging in.');
      return;
    }
    if (!username.trim() || !password.trim()) {
      setError('Please enter your hospital username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.login(username.trim(), password.trim());
      if (res?.success && res?.user) {
        // Enforce hospital match
        if (res.user.hospitalId && res.user.hospitalId !== selectedHospitalId) {
          throw new Error(`Your credentials belong to ${res.user.hospitalName || 'another facility'}. Please select your correct hospital.`);
        }
        handleUserLogin(res.user, res.token);
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        throw new Error(res?.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top Back Button & Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Main Menu</span>
        </button>

        <div className="flex items-center gap-2">
          <MediMitraLogo size="sm" showText={true} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: STEP 1 - Select Hospital (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
              Step 1 of 2
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 font-heading mt-1.5 flex items-center gap-2">
              <Building2 className="text-cyan-700" size={20} />
              <span>Select Your Hospital</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the healthcare facility where you practice.
            </p>
          </div>

          {/* Hospital Search & State Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search hospital, city, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-bold text-slate-500">State:</span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer w-full"
              >
                {availableStates.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hospital List */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {hospitalsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold">
                Loading centralized directory...
              </div>
            ) : hospitalsData.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No hospitals found matching "{searchTerm}".
              </div>
            ) : (
              hospitalsData.map((hosp) => {
                const isSelected = selectedHospitalId === hosp.id;

                return (
                  <button
                    key={hosp.id}
                    type="button"
                    onClick={() => { 
                      setSelectedHospitalId(hosp.id); 
                      setSelectedHospitalName(hosp.name);
                      setError(null); 
                    }}
                    style={{
                      borderColor: isSelected ? '#088395' : '#e2e8f0',
                      backgroundColor: isSelected ? '#f0fdfa' : '#ffffff'
                    }}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all flex items-start justify-between gap-2 group hover:border-cyan-400 cursor-pointer ${
                      isSelected ? 'shadow-sm ring-1 ring-cyan-500/20' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-cyan-800 uppercase block">
                        {hosp.facility_type || 'Healthcare Facility'}
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-cyan-900">
                        {hosp.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                        <span>{hosp.city}, {hosp.state}</span>
                      </p>
                    </div>

                    {isSelected && (
                      <CheckCircle2 size={18} className="text-cyan-700 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: STEP 2 - Hospital Username & Password (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              Step 2 of 2
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 font-heading mt-1.5 flex items-center gap-2">
              <Lock className="text-slate-800" size={20} />
              <span>Hospital Staff Authentication</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedHospital ? (
                <>Logging into: <strong className="text-cyan-900">{selectedHospital.name}</strong></>
              ) : (
                <span className="text-amber-800 font-semibold">⚠️ Please select a hospital from Step 1 on the left</span>
              )}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-red-800 font-semibold">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Hospital Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. dr.sharma"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-semibold focus:bg-white focus:border-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Hospital Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-semibold focus:bg-white focus:border-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#0f2b48' }}
              className="w-full py-3.5 text-white font-bold rounded-2xl text-sm hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
            >
              <KeyRound size={16} />
              <span>{loading ? 'Verifying Hospital Credentials...' : 'Secure Login'}</span>
            </button>
          </form>

          {/* Quick Staff Accounts Demo Helper */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Test Clinician Accounts:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoStaffProfiles.map((p) => (
                <button
                  key={p.username}
                  type="button"
                  onClick={() => handleSelectDemoProfile(p)}
                  className="p-2.5 bg-slate-50 hover:bg-cyan-50 border border-slate-200 rounded-xl text-left text-xs transition-colors group"
                >
                  <div className="font-bold text-slate-800 group-hover:text-cyan-900">{p.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{p.hospName} • {p.dept}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>Server-Side RBAC & PBKDF2 Password Hashing</span>
            </span>
            <span>TLS 256-Bit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
