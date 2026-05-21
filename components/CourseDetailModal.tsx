import React, { useState, useEffect } from 'react';
import { Course, sortOrganizers } from '../types';
import { Calendar, MapPin, X, ExternalLink, Euro, Tag, Building2, Download, Clock } from 'lucide-react';
import { DEFAULT_IMAGES, formatPrice } from '../constants';

interface CourseDetailModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({ course, isOpen, onClose }) => {
  const [imageError, setImageError] = useState(false);
  const [noUrlNotice, setNoUrlNotice] = useState(false);

  // Reset error state when a new course is opened
  useEffect(() => {
    if (isOpen) {
      setImageError(false);
      setNoUrlNotice(false);
    }
  }, [isOpen, course?.id]);

  if (!isOpen || !course) return null;

  const hasNoUrl = !course.url || course.url === '#' || course.url.trim() === '' || course.url.trim() === 'https://';

  const handleRegisterClick = (e: React.MouseEvent) => {
    if (hasNoUrl) {
      e.preventDefault();
      setNoUrlNotice(true);
      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        setNoUrlNotice(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  };

  const isKVLO = course.organizers?.includes('KVLO');
  const isALO = course.organizers?.includes('ALO Nederland');
  
  // Fallback image logic same as card
  const fallbackIndex = course.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % DEFAULT_IMAGES.length;
  
  // Use fallback if no imageUrl is provided OR if loading failed
  const displayImage = (!imageError && course.imageUrl) ? course.imageUrl : DEFAULT_IMAGES[fallbackIndex];

  const addToCalendar = () => {
    if (!course.date || course.date.trim() === '') {
      alert("Kan niet toevoegen aan agenda: geen datum bekend.");
      return;
    }
    // Create ICS content
    const startDate = new Date(course.date);
    
    const formatIcsDate = (date: Date) => date.toISOString().split('T')[0].replace(/-/g, '');
    
    const startTime = formatIcsDate(startDate) + 'T090000'; // Assuming 09:00 start for simplicity
    const endTime = formatIcsDate(startDate) + 'T170000';   // Assuming 17:00 end
    
    let description = `${course.description}\\n\\nOrganisator: ${sortOrganizers(course.organizers).join(', ')}\\nMeer info: ${course.url}`;
    if (course.sessions && course.sessions > 1) {
      description += `\\n\\nLet op: Dit is de eerste van in totaal ${course.sessions} bijeenkomsten.`;
    }
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:${course.title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${course.location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-[#1e293b]/60 backdrop-blur-sm transition-opacity" />

      {/* Modal Content */}
      <div 
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Scrollable Area containing Image and Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero Image Section */}
          <div className="relative h-48 shrink-0 bg-slate-200">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
            <img 
              src={displayImage} 
              alt={course.title} 
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute bottom-6 left-6 right-6 z-20">
               <div className="flex flex-wrap gap-2 mb-3">
                  {sortOrganizers(course.organizers).map((org, index) => {
                    const orgBadgeColor = org === 'KVLO' 
                      ? 'bg-[#ecfccb] text-[#4d7c0f] border-[#84cc16]' 
                      : org === 'ALO Nederland' 
                        ? 'bg-[#cffafe] text-[#0891b2] border-[#06b6d4]'
                        : 'bg-[#f3e8ff] text-[#7e22ce] border-[#d8b4fe]';
                    return (
                    <span key={index} className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border shadow-sm ${orgBadgeColor}`}>
                      {org}
                    </span>
                  )})}
                  {course.isNew && (
                    <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-red-500 text-white shadow-lg shadow-red-500/30">
                        Nieuw
                    </span>
                  )}
               </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight shadow-sm">
                {course.title}
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            
            {/* Key Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 bg-white rounded-lg shadow-sm text-[#00C1D4]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Datum</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {course.date && course.date.trim() !== '' ? new Date(course.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Zonder startdatum'}
                    {course.sessions && course.sessions > 0 && (
                      <span className="ml-1 text-xs text-slate-500 font-normal">
                        ({course.sessions}x)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 bg-white rounded-lg shadow-sm text-[#7AB800]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Locatie & Regio</p>
                  <p className="text-sm font-semibold text-slate-800">{course.location} <span className="text-slate-500 font-normal">({course.region})</span></p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-600">
                  <Euro className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Kosten</p>
                  <div className="text-sm font-semibold text-slate-800">
                    {course.price === 0 ? (
                      <span className="text-green-600 font-bold uppercase tracking-wider">Gratis deelname</span>
                    ) : course.price === undefined || course.price === null ? (
                      <span className="text-slate-500 italic">Kosten op aanvraag</span>
                    ) : (
                      <div className="flex flex-col">
                        {isKVLO && course.memberPrice !== undefined && course.memberPrice !== null ? (
                          <>
                            <span>{formatPrice(course.memberPrice)} p.p.</span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Niet-KVLO-leden: {formatPrice(course.price)}
                            </span>
                          </>
                        ) : (
                          <span>{formatPrice(course.price)} p.p.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 bg-white rounded-lg shadow-sm text-purple-500">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Organisator</p>
                  <p className="text-sm font-semibold text-slate-800 line-clamp-1" title={sortOrganizers(course.organizers).join(', ')}>
                    {sortOrganizers(course.organizers).join(', ')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                  Over deze scholing
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                  {course.description}
                </p>
              </div>

              <div>
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  Onderwerpen
                </h3>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[#f1f5f9] text-slate-600 border border-slate-200">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notice Banner */}
        {noUrlNotice && (
          <div className="mx-6 mb-2 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-200 shadow-sm shrink-0">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="font-extrabold text-sm text-slate-800">Meer informatie volgt</p>
              <p className="text-xs text-slate-600 mt-1">Meer informatie volgt en inschrijving is nu nog niet mogelijk.</p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
           
           {course.date && course.date.trim() !== '' ? (
             <button 
               onClick={addToCalendar}
               className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white hover:border-[#00C1D4] hover:text-[#00C1D4] transition-colors flex items-center justify-center gap-2 group"
             >
               <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
               Zet in Agenda
             </button>
           ) : (
             <div />
           )}

           <div className="flex gap-3 w-full sm:w-auto">
             <button 
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white hover:border-slate-300 transition-colors"
             >
               Sluiten
             </button>
             {hasNoUrl ? (
               <button 
                 onClick={handleRegisterClick}
                 className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-[#7AB800] to-[#6da500] text-white font-bold hover:shadow-lg hover:shadow-green-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
               >
                 Bekijk & Meld aan <ExternalLink className="w-4 h-4" />
               </button>
             ) : (
               <a 
                 href={course.url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-[#7AB800] to-[#6da500] text-white font-bold hover:shadow-lg hover:shadow-green-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
               >
                 Bekijk & Meld aan <ExternalLink className="w-4 h-4" />
               </a>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};