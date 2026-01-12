import React from 'react';
import { Course, Organizer } from '../types';
import { Calendar, MapPin, X, ExternalLink, Euro, Tag, Building2, Download } from 'lucide-react';
import { DEFAULT_IMAGES } from '../constants';

interface CourseDetailModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({ course, isOpen, onClose }) => {
  if (!isOpen || !course) return null;

  const isKVLO = course.organizer === Organizer.KVLO;
  const isALO = course.organizer === Organizer.ALO;
  
  // Fallback image logic same as card
  const fallbackIndex = course.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % DEFAULT_IMAGES.length;
  const displayImage = course.imageUrl || DEFAULT_IMAGES[fallbackIndex];

  const addToCalendar = () => {
    // Create ICS content
    const startTime = course.date.replace(/-/g, '') + 'T090000'; // Assuming 09:00 start for simplicity
    const endTime = course.date.replace(/-/g, '') + 'T170000';   // Assuming 17:00 end
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:${course.title}`,
      `DESCRIPTION:${course.description}\\n\\nOrganisator: ${course.organizer}\\nMeer info: ${course.url}`,
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
          className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Hero Image Section */}
        <div className="relative h-64 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
          <img 
            src={displayImage} 
            alt={course.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-6 left-6 right-6 z-20">
             <div className="flex gap-2 mb-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border backdrop-blur-sm bg-white/95 
                  ${isKVLO ? 'text-[#5a8700] border-[#7AB800]' : isALO ? 'text-[#008d9b] border-[#00C1D4]' : 'text-purple-700 border-purple-200'}`}>
                  {course.organizer}
                </span>
                {course.isNew && (
                  <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-red-500 text-white shadow-lg shadow-red-500/30">
                      Nieuw
                  </span>
                )}
             </div>
            <h2 className="text-3xl font-black text-white leading-tight shadow-sm">
              {course.title}
            </h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* Key Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 bg-white rounded-lg shadow-sm text-[#00C1D4]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Datum</p>
                <p className="font-semibold text-slate-800">
                  {new Date(course.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 bg-white rounded-lg shadow-sm text-[#7AB800]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Locatie & Regio</p>
                <p className="font-semibold text-slate-800">{course.location} ({course.region})</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 bg-white rounded-lg shadow-sm text-slate-600">
                <Euro className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Kosten</p>
                <p className="font-semibold text-slate-800">
                  {course.price === 0 ? 'Gratis deelname' : `€${course.price},- per persoon`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 bg-white rounded-lg shadow-sm text-purple-500">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Organisator</p>
                <p className="font-semibold text-slate-800">{course.organizer}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                Over deze scholing
              </h3>
              <p className="text-slate-600 leading-relaxed text-base">
                {course.description}
                <br /><br />
                Tijdens deze bijeenkomst gaan we dieper in op de theorie en koppelen we dit direct aan de praktijk. 
                Er is veel ruimte voor eigen inbreng en casuïstiek. Geschikt voor zowel beginnende als ervaren docenten.
              </p>
            </div>

            <div>
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                Onderwerpen
              </h3>
              <div className="flex flex-wrap gap-2">
                {course.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#f1f5f9] text-slate-600 border border-slate-200">
                    <Tag className="w-3 h-3 text-slate-400" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
           
           <button 
             onClick={addToCalendar}
             className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white hover:border-[#00C1D4] hover:text-[#00C1D4] transition-colors flex items-center justify-center gap-2 group"
           >
             <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
             Zet in Agenda
           </button>

           <div className="flex gap-3 w-full sm:w-auto">
             <button 
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white hover:border-slate-300 transition-colors"
             >
               Sluiten
             </button>
             <a 
               href={course.url}
               target="_blank"
               rel="noopener noreferrer"
               className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-[#7AB800] to-[#6da500] text-white font-bold hover:shadow-lg hover:shadow-green-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
             >
               Bekijk & Meld aan <ExternalLink className="w-4 h-4" />
             </a>
           </div>
        </div>

      </div>
    </div>
  );
};