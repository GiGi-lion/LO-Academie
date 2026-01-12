import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CourseCard } from './components/CourseCard';
import { AddCourseModal } from './components/AddCourseModal';
import { CourseDetailModal } from './components/CourseDetailModal';
import { AIAssistant } from './components/AIAssistant';
import { Toast } from './components/Toast';
import { CalendarView } from './components/CalendarView';
import { MapView } from './components/MapView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Course, SearchFilters, SortOption } from './types';
import { REGIONS } from './constants';
import { subscribeToCourses, saveCourseToDB, deleteCourseFromDB, isLiveMode, seedDatabase } from './services/db';
import { Search, ChevronDown, Plus, Heart, SlidersHorizontal, LayoutGrid, Calendar as CalendarIcon, Map as MapIcon, ShieldCheck, Wifi, WifiOff, UploadCloud } from 'lucide-react';

type ViewMode = 'list' | 'calendar' | 'map';

const App: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('alo_kvlo_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    region: 'Alle',
    dateStart: '',
    dateEnd: '',
    organizer: 'Alle',
    selectedTags: []
  });
  
  const [sortOption, setSortOption] = useState<SortOption>('date-asc');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | undefined>(undefined);
  const [toast, setToast] = useState<{message: string, isVisible: boolean}>({ message: '', isVisible: false });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  // Subscribe to DB updates
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToCourses((newCourses) => {
      setCourses(newCourses);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('alo_kvlo_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
      showToast("Beheerdersmodus uitgeschakeld");
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    setShowAdminLogin(false);
    showToast("Beheerdersmodus geactiveerd");
  };

  const handleSeedDatabase = async () => {
    if(!window.confirm("Dit zal alle voorbeeld-scholingen uploaden naar je database (bestaande items met dezelfde ID worden overschreven). Wil je doorgaan?")) {
      return;
    }

    setIsSeeding(true);
    try {
      console.log("Starten met uploaden van data...");
      await seedDatabase();
      console.log("Upload voltooid.");
      showToast("✅ Database succesvol gevuld met voorbeelden!");
    } catch (e: any) {
      console.error("Fout tijdens uploaden:", e);
      showToast("❌ Fout bij uploaden: " + (e.message || "Onbekende fout"));
      alert("Er ging iets mis bij het uploaden naar de database. Check de console voor details.\n\nMelding: " + (e.message || "Geen details"));
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredAndSortedCourses = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    let result = courses.filter(course => {
      // Verberg verlopen scholingen tenzij in beheer-modus
      if (course.date < todayStr && !isAdmin) return false;

      const matchesQuery = 
        course.title.toLowerCase().includes(filters.query.toLowerCase()) || 
        course.description.toLowerCase().includes(filters.query.toLowerCase()) ||
        course.tags.some(tag => tag.toLowerCase().includes(filters.query.toLowerCase()));
      
      const matchesRegion = filters.region === 'Alle' || course.region === filters.region;
      const matchesDateStart = !filters.dateStart || course.date >= filters.dateStart;
      const matchesDateEnd = !filters.dateEnd || course.date <= filters.dateEnd;
      const matchesOrganizer = filters.organizer === 'Alle' || course.organizer === filters.organizer;
      const matchesTags = filters.selectedTags.length === 0 || 
        filters.selectedTags.some(tag => course.tags.includes(tag));
      const matchesFavorite = !showOnlyFavorites || favorites.includes(course.id);

      return matchesQuery && matchesRegion && matchesDateStart && matchesDateEnd && matchesOrganizer && matchesTags && matchesFavorite;
    });

    result.sort((a, b) => {
      if (sortOption === 'date-asc') return a.date.localeCompare(b.date);
      if (sortOption === 'date-desc') return b.date.localeCompare(a.date);
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      return 0;
    });

    return result;
  }, [courses, filters, favorites, showOnlyFavorites, sortOption, isAdmin]);

  const handleSaveCourse = async (savedCourse: Course) => {
    try {
      await saveCourseToDB(savedCourse);
      showToast(courseToEdit ? "Scholing bijgewerkt" : "Scholing toegevoegd");
    } catch (e) {
      console.error(e);
      showToast("Er ging iets mis bij het opslaan");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if(window.confirm("Scholing definitief verwijderen?")) {
      try {
        await deleteCourseFromDB(id);
        showToast("Scholing verwijderd");
        setIsModalOpen(false);
      } catch (e) {
        console.error(e);
        showToast("Kan scholing niet verwijderen");
      }
    }
  };

  const openAddModal = () => {
    setCourseToEdit(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      <Header isAdmin={isAdmin} onToggleAdmin={handleAdminToggle} />
      
      <AdminLoginModal 
        isOpen={showAdminLogin} 
        onClose={() => setShowAdminLogin(false)} 
        onLoginSuccess={handleLoginSuccess}
      />
      
      <Hero courseCount={courses.length} onScrollToContent={() => contentRef.current?.scrollIntoView({ behavior: 'smooth' })} />

      <main ref={contentRef} className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 md:pb-16">
        
        {/* Mobile Action Bar */}
        <div className="md:hidden mb-4 flex gap-2">
            <button 
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex-1 bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-slate-700 shadow-sm"
            >
                <SlidersHorizontal className="w-5 h-5 text-[#00C1D4]" />
                {showMobileFilters ? 'Filters Sluiten' : 'Zoekfilters'}
            </button>
            {isAdmin && (
              <button onClick={openAddModal} className="bg-[#7AB800] text-white p-3 rounded-xl shadow-lg">
                <Plus className="w-6 h-6" />
              </button>
            )}
        </div>

        {/* Search & Filter Bar */}
        <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-10 md:-mt-12 relative z-20 transition-all ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Zoek scholing..." 
                    className="w-full pl-12 pr-4 py-3 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#00C1D4] outline-none bg-slate-50"
                    value={filters.query}
                    onChange={e => setFilters({...filters, query: e.target.value})}
                  />
              </div>
              <div className="relative md:w-56">
                 <select 
                   className="w-full h-full pl-4 pr-10 py-3 border border-slate-100 rounded-xl appearance-none bg-white text-sm font-medium text-slate-700 cursor-pointer"
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 flex items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-2">Van</span>
                <input type="date" className="bg-transparent text-sm outline-none flex-1" value={filters.dateStart} onChange={e => setFilters({...filters, dateStart: e.target.value})} />
                <span className="text-[10px] font-bold text-slate-400 uppercase mx-2">Tot</span>
                <input type="date" className="bg-transparent text-sm outline-none flex-1" value={filters.dateEnd} onChange={e => setFilters({...filters, dateEnd: e.target.value})} />
              </div>

              <select className="px-4 py-2.5 border border-slate-100 rounded-xl bg-white text-sm" value={filters.region} onChange={e => setFilters({...filters, region: e.target.value})}>
                <option value="Alle">Alle Regio's</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              <select className="px-4 py-2.5 border border-slate-100 rounded-xl bg-white text-sm" value={filters.organizer} onChange={e => setFilters({...filters, organizer: e.target.value})}>
                <option value="Alle">Alle Organisatoren</option>
                <option value="KVLO">KVLO</option>
                <option value="ALO Nederland">ALO Nederland</option>
              </select>
            </div>

            <div className="flex justify-between items-center pt-2">
               <div className="flex gap-2">
                 <button
                  onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    showOnlyFavorites ? 'bg-red-50 text-red-500 border-red-100' : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-red-500' : ''}`} />
                  Mijn Favorieten ({favorites.length})
                </button>
                {/* Database Status Indicator */}
                {!isLiveMode() ? (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100" title="Voeg Firebase config toe in services/db.ts om live te gaan">
                    <WifiOff className="w-3.5 h-3.5" />
                    Demo Modus
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-green-50 text-green-600 border border-green-100">
                    <Wifi className="w-3.5 h-3.5" />
                    Live Verbonden
                  </div>
                )}
               </div>
              
              <div className="hidden md:flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-[#00C1D4]' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-md ${viewMode === 'calendar' ? 'bg-white shadow-sm text-[#7AB800]' : 'text-slate-400'}`}><CalendarIcon className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('map')} className={`p-2 rounded-md ${viewMode === 'map' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400'}`}><MapIcon className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Quick Action Bar */}
        {isAdmin && (
          <div className="mb-8 p-6 bg-white border-2 border-dashed border-[#7AB800]/40 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-green-500/5 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-2xl text-[#7AB800]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Beheerdersmodus Actief</h4>
                <p className="text-xs text-slate-500 font-medium">Beheer bestaande scholingen of voeg een nieuwe toe.</p>
              </div>
            </div>
            <div className="flex gap-3">
              {isLiveMode() && (
                <button 
                  onClick={handleSeedDatabase}
                  disabled={isSeeding}
                  className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <UploadCloud className="w-5 h-5" /> {isSeeding ? 'Bezig...' : 'Upload Demo Data'}
                </button>
              )}
              <button 
                onClick={openAddModal}
                className="bg-[#7AB800] text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#6da500] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-green-500/20 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Scholing Toevoegen
              </button>
            </div>
          </div>
        )}

        {/* Results Container */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7AB800]"></div>
          </div>
        ) : viewMode === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedCourses.length > 0 ? (
              filteredAndSortedCourses.map(course => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  isFavorite={favorites.includes(course.id)}
                  onToggleFavorite={toggleFavorite}
                  onClick={setSelectedCourse}
                  isAdmin={isAdmin}
                  onEdit={() => { setCourseToEdit(course); setIsModalOpen(true); }}
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                 <div className="inline-flex p-6 bg-slate-100 rounded-full mb-4 text-slate-400">
                    <Search className="w-10 h-10" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2">Geen scholingen gevonden</h3>
                 <p className="text-slate-500">Pas je filters aan of probeer een andere zoekterm.</p>
              </div>
            )}
          </div>
        )}

        {!isLoading && viewMode === 'calendar' && <CalendarView courses={filteredAndSortedCourses} onSelectCourse={setSelectedCourse} />}
        {!isLoading && viewMode === 'map' && <MapView courses={filteredAndSortedCourses} onSelectCourse={setSelectedCourse} />}
      </main>

      <footer className="bg-white border-t border-slate-100 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} LO Academie - Een initiatief van KVLO & ALO Nederland.
          </p>
          <div className="mt-2 text-xs text-slate-300">
            Status: {isLiveMode() ? 'Live Database Verbonden' : 'Lokale Demo Modus'}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddCourseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveCourse}
        onDelete={handleDeleteCourse}
        courseToEdit={courseToEdit}
      />

      <CourseDetailModal 
        isOpen={!!selectedCourse} 
        course={selectedCourse} 
        onClose={() => setSelectedCourse(null)} 
      />

      <AIAssistant courses={courses} />
    </div>
  );
};

export default App;