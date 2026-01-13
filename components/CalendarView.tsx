import React, { useState } from 'react';
import { Course, Organizer } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarViewProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ courses, onSelectCourse }) => {
  // Smart Initialization: Start at the month of the first upcoming course, or first course in list, or today.
  const [currentDate, setCurrentDate] = useState(() => {
    if (courses.length === 0) return new Date();

    const now = new Date();
    // Sort courses by date
    const sortedCourses = [...courses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Find first course in the future
    const firstUpcoming = sortedCourses.find(c => new Date(c.date) >= now);
    
    if (firstUpcoming) {
        return new Date(firstUpcoming.date);
    }
    
    // If no upcoming courses (all past), show the month of the last course
    if (sortedCourses.length > 0) {
        return new Date(sortedCourses[sortedCourses.length - 1].date);
    }

    return now;
  });

  // Helper to get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
  };

  const days = getDaysInMonth(currentDate);
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sun
  
  // Adjust so Monday is first day (0 = Mon, 6 = Sun)
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

  const getCoursesForDate = (date: Date) => {
    return courses.filter(c => {
      const cDate = new Date(c.date);
      return cDate.getDate() === date.getDate() && 
             cDate.getMonth() === date.getMonth() && 
             cDate.getFullYear() === date.getFullYear();
    });
  };

  const weekDays = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300 min-h-[600px] flex flex-col">
      
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 capitalize flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#00C1D4]" />
            {monthName}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-50 last:border-none">
            {day}
          </div>
        ))}
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-50">
        {/* Empty cells for start offset */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-slate-50 border-r border-b border-slate-100/50 min-h-[100px]" />
        ))}

        {days.map(date => {
            const daysCourses = getCoursesForDate(date);
            const isToday = new Date().toDateString() === date.toDateString();

            return (
                <div key={date.toISOString()} className="bg-white border-r border-b border-slate-100 relative group transition-colors hover:bg-slate-50/50 overflow-hidden p-1 min-h-[100px] flex flex-col">
                    <span className={`self-end w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full mb-1
                        ${isToday ? 'bg-[#7AB800] text-white' : 'text-slate-400'}`}>
                        {date.getDate()}
                    </span>
                    
                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[85px] custom-scrollbar flex-1">
                        {daysCourses.map(course => (
                            <button 
                                key={course.id}
                                onClick={() => onSelectCourse(course)}
                                className={`text-[10px] text-left px-2 py-1.5 rounded border truncate font-bold transition-all shadow-sm hover:shadow-md
                                    ${course.organizer === Organizer.KVLO 
                                        ? 'bg-[#7AB800]/10 text-[#5a8700] border-[#7AB800]/20 hover:bg-[#7AB800]/20' 
                                        : course.organizer === Organizer.ALO
                                            ? 'bg-[#00C1D4]/10 text-[#008d9b] border-[#00C1D4]/20 hover:bg-[#00C1D4]/20'
                                            : 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200'
                                    }`}
                                title={course.title}
                            >
                                {course.title}
                            </button>
                        ))}
                    </div>
                </div>
            );
        })}
        
        {/* Fill remaining cells to complete the grid visually if needed, strictly optional but looks nicer */}
        {Array.from({ length: 42 - (days.length + startOffset) }).map((_, i) => (
             <div key={`end-empty-${i}`} className="bg-slate-50 border-r border-b border-slate-100/50 min-h-[100px]" />
        ))}
      </div>
    </div>
  );
};