import React, { useState } from 'react';
import { 
  Lock, 
  Stethoscope, 
  ShieldCheck, 
  AlertCircle, 
  KeyRound,
  X
} from 'lucide-react';
import { ApiService } from '../../services/api';

export const DoctorAuthModal = ({ isOpen, onClose, onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter your staff username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.login(username.trim(), password);
      if (res?.success && res?.user) {
        onAuthenticated(res.user);
        onClose();
      } else {
        throw new Error(res?.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to the authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Banner */}
        <div style={{ backgroundColor: '#0A4D68' }} className="p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-cyan-200 hover:text-white p-1 rounded-full bg-cyan-900/40 cursor-pointer"
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
            Server-Verified Credentials for Doctors & Hospital Administrators
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-2 text-xs text-red-700 font-semibold">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                autoFocus
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
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-cyan-700 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#0A4D68' }}
              className="w-full py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound size={16} />
              <span>{loading ? 'Verifying Credentials...' : 'Sign In with Credentials'}</span>
            </button>
          </form>

          {/* Compliance Footer */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-cyan-700" />
              <span>Server-Side RBAC & PBKDF2 Password Hashing</span>
            </span>
            <span className="font-mono text-slate-400">TLS Protected</span>
          </div>

        </div>

      </div>
    </div>
  );
};
