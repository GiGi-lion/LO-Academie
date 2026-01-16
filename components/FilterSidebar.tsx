import React, { useState } from 'react';
import { Search, MapPin, Calendar, Tag, Heart, ChevronDown, ChevronUp, X, RotateCcw, Filter, ArrowUpDown, Building2 } from 'lucide-react';
import { REGIONS } from '../constants';
import { SearchFilters, SortOption } from '../types';

interface FilterSidebarProps {
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  sortOption: SortOption;
  setSortOption: (opt: SortOption) => void;
  allTags: string[];
  favoritesCount: number;
  showOnlyFavorites: boolean;
  setShowOnlyFavorites: (show: boolean) => void;
  isOpenMobile: boolean;
  closeMobile: () => void;
  resultCount: number;
}

const FilterSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  isOpenDefault?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, isOpenDefault = false, children }) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);

  return (
    <div className="border-b border-slate-100 last:border-0 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left group mb-3"
      >
        <span className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2.5">
          {icon} {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-[#00C1D4]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-[#00C1D4]" />
        )}
      </button>
      {isOpen && <div className="animate-in slide-in-from-top-1 duration-200">{children}</div>}
    </div>
  );
};

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  setFilters,
  sortOption,
  setSortOption,
  allTags,
  favoritesCount,
  showOnlyFavorites,
  setShowOnlyFavorites,
  isOpenMobile,
  closeMobile,
  resultCount
}) => {
  
  const resetFilters = () => {
    setFilters({
      query: '',
      region: 'Alle',
      dateStart: '',
      dateEnd: '',
      organizer: 'Alle',
      selectedTags: []
    });
    setShowOnlyFavorites(false);
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => {
      const isSelected = prev.selectedTags.includes(tag);
      return {
        ...prev,
        selectedTags: isSelected 
          ? prev.selectedTags.filter(t => t !== tag) 
          : [...prev.selectedTags, tag]
      };
    });
  };

  const content = (
    <div className="space-y-1">
      {/* Header for Mobile */}
      <div className="flex md:hidden justify-between items-center mb-6 pb-4 border-b border-slate-100">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#00C1D4]" /> Filters
        </h2>
        <button onClick={closeMobile} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Active Filters Summary */}
      <div className="flex justify-between items-center py-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {resultCount} Resultaten
        </span>
        <button 
          onClick={resetFilters}
          className="text-xs font-bold text-[#00C1D4] hover:underline flex items-center gap-1 px-2 py-1 rounded hover:bg-[#00C1D4]/10 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Favorites Toggle - Always Visible */}
      <div className="py-4 border-b border-slate-100">
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all border shadow-sm ${
              showOnlyFavorites 
                ? 'bg-red-50 text-red-500 border-red-100 ring-2 ring-red-100' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Heart className={`w-4 h-4 ${showOnlyFavorites ? 'fill-red-500' : ''}`} />
              Mijn Favorieten
            </span>
            <span className="bg-white/50 px-2 py-0.5 rounded-md text-xs border border-transparent">
              {favoritesCount}
            </span>
          </button>
      </div>

      {/* 1. Zoeken */}
      <FilterSection title="Zoeken" icon={<Search className="w-4 h-4 text-[#7AB800]" />} isOpenDefault={false}>
        <div className="relative mt-2">
          <input 
            type="text" 
            placeholder="Titel, omschrijving..." 
            className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00C1D4] outline-none text-sm font-medium shadow-sm"
            value={filters.query}
            onChange={e => setFilters({...filters, query: e.target.value})}
          />
        </div>
      </FilterSection>

      {/* 2. Onderwerpen */}
      {allTags.length > 0 && (
        <FilterSection title="Onderwerpen" icon={<Tag className="w-4 h-4 text-slate-400" />} isOpenDefault={false}>
          <div className="flex flex-wrap gap-2 mt-2">
             {allTags.map(tag => {
                const isSelected = filters.selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border text-left
                      ${isSelected 
                          ? 'bg-slate-800 text-white border-slate-800' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    {tag}
                  </button>
                );
             })}
          </div>
        </FilterSection>
      )}

      {/* 3. Datum */}
      <FilterSection title="Datum" icon={<Calendar className="w-4 h-4 text-orange-500" />} isOpenDefault={false}>
        <div className="space-y-2 mt-2">
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">Van</span>
                <input 
                    type="date" 
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-1 focus:ring-purple-500 outline-none" 
                    value={filters.dateStart} 
                    onChange={e => setFilters({...filters, dateStart: e.target.value})} 
                />
            </div>
             <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">Tot</span>
                <input 
                    type="date" 
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-1 focus:ring-purple-500 outline-none" 
                    value={filters.dateEnd} 
                    onChange={e => setFilters({...filters, dateEnd: e.target.value})} 
                />
            </div>
        </div>
      </FilterSection>

      {/* 4. Regio */}
      <FilterSection title="Regio" icon={<MapPin className="w-4 h-4 text-[#00C1D4]" />} isOpenDefault={false}>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button 
             onClick={() => setFilters({...filters, region: 'Alle'})}
             className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors border ${filters.region === 'Alle' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
          >
            Alle
          </button>
          {REGIONS.map(r => (
            <button 
              key={r}
              onClick={() => setFilters({...filters, region: r})}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors border ${filters.region === r ? 'bg-[#00C1D4] text-white border-[#00C1D4]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* 5. Organisator */}
      <FilterSection title="Organisator" icon={<Building2 className="w-4 h-4 text-purple-500" />} isOpenDefault={false}>
         <div className="flex flex-col gap-2 mt-2">
            {['Alle', 'KVLO', 'ALO Nederland'].map(org => (
               <label key={org} className="flex items-center gap-3 cursor-pointer group p-1 hover:bg-slate-50 rounded-lg">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${filters.organizer === org ? 'bg-[#7AB800] border-[#7AB800]' : 'bg-white border-slate-300 group-hover:border-[#7AB800]'}`}>
                      {filters.organizer === org && <div className="w-2 h-2 bg-white rounded-sm" />}
                  </div>
                  <input 
                    type="radio" 
                    name="organizer" 
                    className="hidden"
                    checked={filters.organizer === org}
                    onChange={() => setFilters({...filters, organizer: org})}
                  />
                  <span className={`text-sm font-medium ${filters.organizer === org ? 'text-slate-800' : 'text-slate-500'}`}>{org === 'Alle' ? 'Alles tonen' : org}</span>
               </label>
            ))}
         </div>
      </FilterSection>

      {/* 6. Sorteren */}
      <FilterSection title="Sorteren" icon={<ArrowUpDown className="w-4 h-4 text-slate-500" />} isOpenDefault={false}>
          <div className="relative mt-2">
            <select 
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl appearance-none text-sm font-medium text-slate-600 focus:ring-2 focus:ring-[#7AB800] outline-none shadow-sm cursor-pointer"
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SortOption)}
            >
              <option value="date-asc">Datum (Eerstvolgende)</option>
              <option value="date-desc">Datum (Nieuwste toegevoegd)</option>
              <option value="price-asc">Prijs (Laag - Hoog)</option>
              <option value="price-desc">Prijs (Hoog - Laag)</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
        </div>
      </FilterSection>

    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar - REMOVED internal scroll, now flows naturally */}
      <div className="hidden md:block w-72 shrink-0">
         <div className="sticky top-28 pb-10 pr-4">
            {content}
         </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-[150] md:hidden transition-all duration-300 ${isOpenMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isOpenMobile ? 'opacity-100' : 'opacity-0'}`} onClick={closeMobile} />
        <div className={`absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl p-6 overflow-y-auto transition-transform duration-300 ${isOpenMobile ? 'translate-x-0' : 'translate-x-full'}`}>
            {content}
        </div>
      </div>
    </>
  );
};