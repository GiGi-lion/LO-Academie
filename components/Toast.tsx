import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div 
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3 bg-[#1e293b] text-white px-6 py-4 rounded-xl shadow-2xl transition-all duration-500 ease-in-out border-l-4 border-[#7AB800]
      ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
    >
      <CheckCircle2 className="w-6 h-6 text-[#7AB800]" />
      <div className="flex flex-col">
          <span className="font-bold text-sm">Succes!</span>
          <span className="text-xs text-slate-300">{message}</span>
      </div>
      <button onClick={onClose} className="ml-4 hover:bg-white/10 p-1 rounded-full transition-colors">
        <X className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
};