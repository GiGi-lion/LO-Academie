import React, { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';

interface HeaderProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isAdmin, onToggleAdmin }) => {
  const [aloError, setAloError] = useState(false);
  const [kvloError, setKvloError] = useState(false);

  return (
    <header className="bg-white border-b-4 border-transparent bg-clip-border sticky top-0 z-50 shadow-sm" style={{ borderImage: 'linear-gradient(to right, #7AB800, #00C1D4) 1' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 sm:h-24">
          
          {/* Site Logo */}
          <div className="flex items-center z-10 py-2">
             <img 
               src="https://www.alo.nl/custom/uploads/2026/01/Logo-LO-Academie.png" 
               alt="LO Academie Scholingskalender" 
               className="h-14 sm:h-20 w-auto object-contain"
             />
          </div>

          {/* Right side: Logos & Admin Toggle */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button 
              onClick={onToggleAdmin}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all border ${
                isAdmin 
                  ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#00C1D4] hover:text-[#00C1D4]'
              }`}
            >
              {isAdmin ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              <span className="hidden xs:inline">{isAdmin ? 'Beheer Actief' : 'Beheer'}</span>
            </button>

            <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

            <div className="flex items-center gap-2 sm:gap-4">
              <a href="https://www.alo.nl" target="_blank" rel="noopener noreferrer" className="block group">
                {!aloError ? (
                  <img 
                    src="https://www.alo.nl/custom/uploads/2026/01/ALO_Logo2018_rgb_groen_pos_01.png" 
                    alt="ALO Nederland" 
                    className="h-6 sm:h-10 w-auto object-contain opacity-80 group-hover:opacity-100 transition-all"
                    onError={() => setAloError(true)}
                  />
                ) : (
                  <span className="text-[10px] font-bold text-[#00C1D4]">ALO</span>
                )}
              </a>
              <a href="https://www.kvlo.nl" target="_blank" rel="noopener noreferrer" className="block group">
                {!kvloError ? (
                  <img 
                    src="https://www.alo.nl/custom/uploads/2026/01/logo-KVLO-2.png" 
                    alt="KVLO" 
                    className="h-6 sm:h-10 w-auto object-contain opacity-80 group-hover:opacity-100 transition-all"
                    onError={() => setKvloError(true)}
                  />
                ) : (
                  <span className="text-[10px] font-bold text-[#7AB800]">KVLO</span>
                )}
              </a>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};