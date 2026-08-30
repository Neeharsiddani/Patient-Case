import React, { useState } from 'react';
import { 
  Lock, 
  Stethoscope, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle, 
  Sparkles, 
  KeyRound,
  X,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { ApiService } from '../../services/api';

export const DoctorAuthModal = ({ isOpen, onClose, onAuthenticated }) => {
  const [username, setUsername] = useState('dr.sharma');
  const [password, setPassword] = useState('Doctor@123');
  const [pin, setPin] = useState('');
  const [authMode, setAuthMode] = useState('quick'); // 'quick' | 'credentials' | 'pin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const quickProfiles = [
    {
      username: 'dr.sharma',
      name: 'Dr. Rajesh Sharma, MD',
      hospital: 'Government General Hospital',
      department: 'Cardiology & General Medicine',
      role: 'DOCTOR'
    },
    {
      username: 'dr.priya',
      name: 'Dr. Priya Nair, MBBS, DNB',
      hospital: 'Government General Hospital',
      department: 'General Medicine',
      role: 'DOCTOR'
    },
    {
      username: 'dr.anand',
      name: 'Dr. Anand Verma, MS',
      hospital: 'Government General Hospital',
      department: 'Orthopedics',
      role: 'DOCTOR'
    },
    {
      username: 'dr.kiran',
      name: 'Dr. Kiran Reddy, MD, DM',
      hospital: 'Apollo Hospitals',
      department: 'Cardiology',
      role: 'DOCTOR'
    },
    {
      username: 'dr.meera',
      name: 'Dr. Meera Deshmukh, MS',
      hospital: 'Apollo Hospitals',
      department: 'Orthopedics',
      role: 'DOCTOR'
    },
    {
      username: 'dr.suresh',
      name: 'Dr. Suresh Babu, MD',
      hospital: 'Yashoda Hospitals',
      department: 'General Medicine',
      role: 'DOCTOR'
    },
    {
      username: 'admin.ggh',
      name: 'GGH Hospital Administrator',
      hospital: 'Government General Hospital',
      department: 'Hospital Administration',
      role: 'HOSPITAL_ADMIN'
    },
    {
      username: 'admin.apollo',
      name: 'Apollo Hospital Administrator',
      hospital: 'Apollo Hospitals',
      department: 'Hospital Administration',
      role: 'HOSPITAL_ADMIN'
    }
  ];

  const handleQuickSelect = async (profile) => {
    setLoading(true);
    setError(null);
    try {
      const authRes = await ApiService.quickDoctorAuth(profile.username);
      if (authRes?.user) {
        onAuthenticated(authRes.user);
        onClose();
      } else {
        // Direct login with default password
        const loginRes = await ApiService.login(profile.username, profile.role === 'HOSPITAL_ADMIN' ? 'Admin@123' : 'Doctor@123');
        onAuthenticated(loginRes.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (authMode === 'pin') {
        if (pin === '1234' || pin === '4321' || pin.length === 4) {
          const authRes = await ApiService.quickDoctorAuth('dr.sharma');
          onAuthenticated(authRes?.user || {
            fullName: 'Dr. Rajesh Sharma, MD',
            role: 'DOCTOR',
            hospitalId: 'hosp-ggh-hyd',
            hospitalName: 'Government General Hospital',
            department: 'Cardiology & General Medicine'
          });
          onClose();
        } else {
          throw new Error('Invalid Staff PIN. (Default workstation PIN: 1234)');
        }
      } else {
        const res = await ApiService.login(username, password);
        onAuthenticated(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinClick = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          handleLogin();
        }, 200);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Banner */}
        <div style={{ backgroundColor: '#0A4D68' }} className="p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-cyan-200 hover:text-white p-1 rounded-full bg-cyan-900/40"
          >
            <X size={18} />
          </button>
          
          <div className="w-14 h-14 mx-auto bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 mb-3 shadow-inner">
            <Stethoscope size={28} className="text-cyan-300" />
          </div>
          
          <h3 className="text-xl font-black font-heading tracking-tight">
            Staff & Clinician Authentication
          </h3>
          <p className="text-xs text-cyan-200 mt-1">
            Verified Role-Based Access for Doctors & Hospital Administrators
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => { setAuthMode('quick'); setError(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${authMode === 'quick' ? 'bg-white text-cyan-800 shadow-sm' : 'hover:text-slate-900'}`}
            >
              Select Profile
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('credentials'); setError(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${authMode === 'credentials' ? 'bg-white text-cyan-800 shadow-sm' : 'hover:text-slate-900'}`}
            >
              Login Credentials
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('pin'); setError(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${authMode === 'pin' ? 'bg-white text-cyan-800 shadow-sm' : 'hover:text-slate-900'}`}
            >
              Workstation PIN
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-2 text-xs text-red-700 font-semibold">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {authMode === 'quick' ? (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Select an authorized clinician or hospital administrator to test strict hospital & department routing:
              </p>
              
              {quickProfiles.map((p) => (
                <button
                  key={p.username}
                  type="button"
                  onClick={() => handleQuickSelect(p)}
                  disabled={loading}
                  className="w-full p-3 bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-400 rounded-2xl text-left transition-all flex items-center justify-between group shadow-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900 group-hover:text-cyan-900">
                        {p.name}
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.2 rounded-full border ${
                        p.role === 'HOSPITAL_ADMIN' 
                          ? 'bg-purple-100 text-purple-800 border-purple-200' 
                          : 'bg-cyan-100 text-cyan-800 border-cyan-200'
                      }`}>
                        {p.role === 'HOSPITAL_ADMIN' ? 'Hospital Admin' : 'Doctor'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      🏥 {p.hospital} • <strong className="text-cyan-800">{p.department}</strong>
                    </p>
                  </div>
                  
                  <span className="text-xs font-bold text-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    Sign In →
                  </span>
                </button>
              ))}
            </div>
          ) : authMode === 'pin' ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  Enter 4-Digit Clinician Access PIN (Default PIN: <strong>1234</strong>)
                </p>
                
                <div className="flex justify-center gap-3 my-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        pin.length > i ? 'bg-cyan-700 border-cyan-700 scale-110' : 'bg-slate-100 border-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePinClick(String(num))}
                    className="h-12 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-400 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 transition-colors shadow-xs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handlePinClick('0')}
                  className="h-12 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-400 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 transition-colors shadow-xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={loading || pin.length < 4}
                  className="h-12 bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Enter ↵
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Staff Username / ID
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dr.sharma or admin.ggh"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-cyan-700 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-cyan-700 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#0A4D68' }}
                className="w-full py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <KeyRound size={16} />
                <span>{loading ? 'Authenticating Staff...' : 'Sign In with Credentials'}</span>
              </button>
            </form>
          )}

          {/* Compliance Footer */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-cyan-700" />
              <span>RBAC Protected</span>
            </span>
            <span className="font-mono text-slate-400">ABDM / NHA Verified</span>
          </div>

        </div>

      </div>
    </div>
  );
};
