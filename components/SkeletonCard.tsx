import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-full overflow-hidden relative">
      <div className="animate-pulse flex flex-col h-full">
        {/* Image Placeholder */}
        <div className="h-48 bg-slate-200 w-full relative">
           <div className="absolute bottom-4 left-4 w-16 h-6 bg-slate-300 rounded"></div>
        </div>

        <div className="p-5 flex-1 flex flex-col space-y-4">
          {/* Date & Location */}
          <div className="flex gap-2">
            <div className="h-3 bg-slate-200 rounded w-1/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/4"></div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
            <div className="h-6 bg-slate-200 rounded w-1/2"></div>
          </div>

          {/* Description */}
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-slate-200 rounded w-full"></div>
            <div className="h-3 bg-slate-200 rounded w-full"></div>
            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
          </div>

          {/* Footer (Price & Button) */}
          <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
            <div className="h-6 bg-slate-200 rounded w-16"></div>
            <div className="h-4 bg-slate-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};