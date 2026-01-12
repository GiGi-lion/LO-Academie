import React, { useState } from 'react';
import { X, Lock, ShieldAlert } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Voor deze demo gebruiken we het wachtwoord "admin"
    if (password === 'admin') {
      onLoginSuccess();
      setPassword('');
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
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
            Voer het beheerder wachtwoord in om scholingen toe te voegen of te wijzigen.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Wachtwoord (Demo: admin)
              </label>
              <div className="relative group">
                <input 
                  autoFocus
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-bold ${
                    error 
                      ? 'border-red-400 ring-4 ring-red-500/10' 
                      : 'border-slate-100 focus:border-[#7AB800] focus:ring-4 focus:ring-[#7AB800]/10'
                  }`}
                  placeholder="••••••••"
                />
                {error && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-red-500 animate-in fade-in slide-in-from-right-2">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                )}
              </div>
              {error && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-2 text-center animate-bounce">
                  Onjuist wachtwoord, probeer het opnieuw
                </p>
              )}
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-[#7AB800] to-[#00C1D4] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#00C1D4]/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
            >
              Inloggen
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};