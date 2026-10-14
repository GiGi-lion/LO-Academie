import React, { useState, useRef, useEffect } from 'react';
import { Course, sortOrganizers } from '../types';
import { Share2, Link2, Check, Mail, ChevronDown } from 'lucide-react';
import { formatPrice } from '../constants';

interface ShareMenuProps {
  course: Course;
  variant?: 'button' | 'icon' | 'badge';
  className?: string;
  align?: 'left' | 'right' | 'top-left' | 'top-right';
}

export const getCanonicalCourseUrl = (courseId: string): string => {
  if (typeof window === 'undefined') {
    return `https://www.lo-academie.nl/cursus/${encodeURIComponent(courseId)}`;
  }
  const origin = window.location.origin.includes('lo-academie.nl')
    ? window.location.origin
    : 'https://www.lo-academie.nl';
  return `${origin}/cursus/${encodeURIComponent(courseId)}`;
};

export const ShareMenu: React.FC<ShareMenuProps> = ({
  course,
  variant = 'button',
  className = '',
  align = 'top-left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const directUrl = getCanonicalCourseUrl(course.id);
  const organizersStr = sortOrganizers(course.organizers).join(', ');
  const dateStr = course.date && course.date.trim() !== ''
    ? new Date(course.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Zonder vaste startdatum';

  const copyToClipboard = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(directUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = directUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
        setIsOpen(false);
      }, 1800);
    } catch (err) {
      console.error('Copy link failed:', err);
    }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Hoi! Kijk eens naar deze scholing op LO Academie:\n"${course.title}"\n${directUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleLinkedIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(directUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    const subject = `Scholingstip LO: ${course.title}`;
    const body = `Beste collega,\n\nIk kwam deze interessante scholing tegen op LO Academie en wil dit graag delen:\n\nScholing: ${course.title}\nOrganisator: ${organizersStr}\nDatum: ${dateStr}\nLocatie: ${course.location}\nKosten: ${formatPrice(course.price)}\n\nBekijk alle informatie en details via de link hieronder:\n${directUrl}\n\nMet vriendelijke groet`;
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setIsOpen(false);
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${course.title} | LO Academie`,
          text: `Bekijk de scholing "${course.title}" op LO Academie:`,
          url: directUrl,
        });
        setIsOpen(false);
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share error:', err);
        }
      }
    }
  };

  // Determine popover position styles
  const getPopoverPlacement = () => {
    switch (align) {
      case 'top-left':
        return 'bottom-full left-0 mb-2';
      case 'top-right':
        return 'bottom-full right-0 mb-2';
      case 'right':
        return 'top-full right-0 mt-2';
      case 'left':
      default:
        return 'top-full left-0 mt-2';
    }
  };

  return (
    <div className={`relative ${variant === 'button' ? 'flex' : 'inline-block'} text-left ${className}`} ref={menuRef}>
      {variant === 'icon' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          className={`p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all ${
            isCopied
              ? 'bg-green-500 text-white scale-110'
              : 'bg-white/95 text-slate-500 hover:text-[#00C1D4] hover:scale-110'
          }`}
          title="Deel scholing via WhatsApp, LinkedIn, E-mail of kopieer link"
          aria-expanded={isOpen}
        >
          {isCopied ? <Check className="w-5 h-5 text-white" /> : <Share2 className="w-5 h-5" />}
        </button>
      )}

      {variant === 'badge' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          className={`px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
            isCopied
              ? 'bg-green-600 text-white'
              : 'bg-black/50 hover:bg-black/70 text-white'
          }`}
          title="Deel scholing"
          aria-expanded={isOpen}
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Gekopieerd!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Delen</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </>
          )}
        </button>
      )}

      {variant === 'button' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          className={`w-full h-11 px-4 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer whitespace-nowrap box-border ${
            isOpen
              ? 'border-[#00C1D4] bg-cyan-50 text-[#009bb0]'
              : isCopied
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300'
          }`}
          title="Deel deze scholing"
          aria-expanded={isOpen}
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 text-green-600 shrink-0" />
              <span className="leading-none">Link gekopieerd!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-[#00C1D4] shrink-0" />
              <span className="leading-none">Deel scholing</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>
      )}

      {/* Dropdown / Popover */}
      {isOpen && (
        <div
          className={`absolute ${getPopoverPlacement()} z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in fade-in zoom-in-95 duration-150`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Scholing delen</p>
            <p className="text-xs font-semibold text-slate-700 truncate">{course.title}</p>
          </div>

          <div className="space-y-1">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-emerald-50 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 flex items-center justify-center text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-colors shrink-0">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24h.02zm-3.53 4.14c-.19 0-.41.07-.63.31-.22.25-.85.83-.85 2.02 0 1.19.87 2.34.99 2.5.12.16 1.7 2.6 4.13 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28-.25-.13-1.44-.71-1.66-.79-.22-.09-.38-.13-.54.12-.16.25-.63.79-.77.95-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.43.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.54-1.31-.74-1.8-.2-.47-.4-.41-.55-.41z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  WhatsApp
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-1.5 py-0.2 rounded">Vaksectie</span>
                </p>
                <p className="text-[11px] text-slate-500 truncate">Deel direct met collega&apos;s</p>
              </div>
            </button>

            {/* LinkedIn */}
            <button
              type="button"
              onClick={handleLinkedIn}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-sky-50 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0a66c2]/15 flex items-center justify-center text-[#0a66c2] group-hover:bg-[#0a66c2] group-hover:text-white transition-colors shrink-0">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 0 0 1.45-1.45 1.45 1.45 0 0 0-1.45-1.45 1.45 1.45 0 0 0-1.45 1.45c0 .8.65 1.45 1.45 1.45m1.39 9.74v-8.37H5.07v8.37h2.78z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800">LinkedIn</p>
                <p className="text-[11px] text-slate-500 truncate">Met automatische voorvertoning</p>
              </div>
            </button>

            {/* E-mail (Vaksectie / Budgetaanvraag) */}
            <button
              type="button"
              onClick={handleEmail}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-indigo-50 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  E-mail
                  <span className="text-[10px] text-indigo-700 bg-indigo-100 font-semibold px-1.5 py-0.2 rounded">Budget / Team</span>
                </p>
                <p className="text-[11px] text-slate-500 truncate">Stuur naar schoolleider of team</p>
              </div>
            </button>

            {/* Directe link kopiëren */}
            <button
              type="button"
              onClick={copyToClipboard}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-100 transition-colors group cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                isCopied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-slate-200 text-slate-600 group-hover:bg-[#7AB800] group-hover:text-white'
              }`}>
                {isCopied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800">
                  {isCopied ? 'Link gekopieerd!' : 'Kopieer link'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">Directe link naar deze scholing</p>
              </div>
            </button>

            {/* Native share on mobile */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full text-center py-1.5 text-[11px] font-semibold text-slate-500 hover:text-[#00C1D4] transition-colors"
                >
                  Meer deelopties via telefoon...
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
