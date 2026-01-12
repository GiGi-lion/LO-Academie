import React, { useState, useEffect } from 'react';
import { Course, Organizer } from '../types';
import { MapPin, Calendar, ArrowRight, Heart, Share2, Check, Pencil } from 'lucide-react';
import { DEFAULT_IMAGES } from '../constants';

interface CourseCardProps {
  course: Course;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick: (course: Course) => void;
  isAdmin?: boolean;
  onEdit?: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, isFavorite, onToggleFavorite, onClick, isAdmin, onEdit }) => {
  const [hasError, setHasError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const isKVLO = course.organizer === Organizer.KVLO;
  const isALO = course.organizer === Organizer.ALO;

  useEffect(() => {
    setHasError(false);
  }, [course.imageUrl]);

  const fallbackIndex = course.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % DEFAULT_IMAGES.length;
  const displayImage = !hasError && course.imageUrl ? course.imageUrl : DEFAULT_IMAGES[fallbackIndex];

  const badgeColor = isKVLO 
    ? 'bg-[#7AB800]/10 text-[#5a8700] border-[#7AB800]/20' 
    : isALO 
      ? 'bg-[#00C1D4]/10 text-[#008d9b] border-[#00C1D4]/20'
      : 'bg-purple-100 text-purple-700 border-purple-200';

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const shareUrl = course.url !== '#' ? course.url : window.location.href;
    const shareText = `Check deze scholing op LO Academie: ${course.title}`;
    const textToCopy = `${course.title}\n${shareUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LO Academie',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Share error:', err);
      }
    }

    // Fallback: Clipboard. Handle "Document not focused" and other browser restrictions.
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // We use a prompt if focus might be an issue, but usually a direct click is fine.
        // We try the standard API first.
        await navigator.clipboard.writeText(textToCopy);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard API failed, using legacy execCommand', err);
      try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        } else {
          // Final fallback: alert the URL so user can copy manually if all else fails
          window.prompt("Kopieer de link hieronder:", textToCopy);
        }
      } catch (fallbackErr) {
        console.error('All copy methods failed', fallbackErr);
        window.prompt("Kopieer de link hieronder:", textToCopy);
      }
    }
  };

  return (
    <div 
      onClick={() => onClick(course)}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden hover:-translate-y-1 relative cursor-pointer"
    >
      
      {/* Actions (Heart & Share) */}
      <div className="absolute top-4 right-4 z-40 flex gap-2">
         <button 
          onClick={handleShare}
          className={`p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all ${
            isCopied ? 'bg-green-500 text-white scale-110' : 'bg-white/95 text-slate-500 hover:text-[#00C1D4] hover:scale-110'
          }`}
          title={isCopied ? "Gekopieerd!" : "Delen"}
        >
          {isCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
        </button>

        <button 
          onClick={(e) => {
            e.stopPropagation(); 
            e.preventDefault();
            onToggleFavorite(course.id);
          }}
          className="p-2.5 rounded-full bg-white/95 backdrop-blur-md shadow-lg hover:scale-110 transition-all"
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'
            }`} 
          />
        </button>
      </div>

      {/* Admin Edit Button */}
      {isAdmin && onEdit && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onEdit();
          }}
          className="absolute top-4 left-4 z-40 p-2.5 rounded-full bg-white/95 backdrop-blur-md shadow-lg text-slate-600 hover:bg-[#00C1D4] hover:text-white transition-all border border-slate-100"
          title="Scholing bewerken"
        >
          <Pencil className="w-5 h-5" />
        </button>
      )}

      <div className="relative h-48 overflow-hidden bg-slate-200">
        <img 
          src={displayImage} 
          alt={course.title} 
          onError={() => setHasError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        
        <div className="absolute bottom-4 left-4 z-20">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/90 border shadow-sm ${badgeColor}`}>
                {course.organizer}
            </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <Calendar className="w-3 h-3" />
            {new Date(course.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
            <span className="mx-1">•</span>
            <MapPin className="w-3 h-3" />
            {course.location}
        </div>

        <h3 className="text-lg font-extrabold text-slate-800 mb-2 leading-tight group-hover:text-[#00C1D4] transition-colors line-clamp-2">
          {course.title}
        </h3>

        <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">
          {course.description}
        </p>

        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
            <span className="font-black text-lg text-[#7AB800]">
                {course.price === 0 ? 'Gratis' : `€${course.price},-`}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-[#00C1D4] group-hover:gap-2 transition-all">
                Details <ArrowRight className="w-3.5 h-3.5" />
            </div>
        </div>
      </div>
    </div>
  );
};