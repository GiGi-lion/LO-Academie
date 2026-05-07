import React, { useState } from 'react';
import { X, Lock, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.session) {
        onLoginSuccess();
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Inloggen mislukt');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#1e293b]/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <Lock className="w-8 h-8 text-[#00C1D4]" />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-2">Beheerder Toegang</h2>
          <p className="text-slate-500 text-sm mb-8 font-medium">
            Log in met je Supabase account om scholingen te beheren.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  E-mailadres
                </label>
                <input 
                  autoFocus
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none transition-all font-bold focus:border-[#00C1D4] focus:ring-4 focus:ring-[#00C1D4]/10"
                  placeholder="admin@loacademie.nl"
                  required
                />
              </div>
              
              <div className="relative group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Wachtwoord
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-bold pr-14 ${
                      error 
                        ? 'border-red-400 ring-4 ring-red-500/10' 
                        : 'border-slate-100 focus:border-[#7AB800] focus:ring-4 focus:ring-[#7AB800]/10'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {error && (
                  <div className="absolute right-14 top-[42px] flex items-center gap-1.5 text-red-500 animate-in fade-in slide-in-from-right-2">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                )}
              </div>
              {error && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-2 text-center animate-bounce">
                  {error}
                </p>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#7AB800] to-[#00C1D4] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#00C1D4]/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? 'Bezig met inloggen...' : 'Inloggen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};