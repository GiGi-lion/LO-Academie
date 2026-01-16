import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CourseCard } from './components/CourseCard';
import { SkeletonCard } from './components/SkeletonCard';
import { FilterSidebar } from './components/FilterSidebar';
import { AddCourseModal } from './components/AddCourseModal';
import { CourseDetailModal } from './components/CourseDetailModal';
import { AIAssistant } from './components/AIAssistant';
import { Toast } from './components/Toast';
import { CalendarView } from './components/CalendarView';
import { MapView } from './components/MapView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Course, SearchFilters, SortOption } from './types';
import { subscribeToCourses, saveCourseToDB, deleteCourseFromDB, isLiveMode, seedDatabase } from './services/db';
import { Plus, SlidersHorizontal, LayoutGrid, Calendar as CalendarIcon, Map as MapIcon, ShieldCheck, Wifi, WifiOff, UploadCloud } from 'lucide-react';

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
    // Simulate slight network delay to show off Skeleton UI
    setTimeout(() => {
        const unsubscribe = subscribeToCourses((newCourses) => {
        setCourses(newCourses);
        setIsLoading(false);
        });
    }, 800); 
  }, []);

  useEffect(() => {
    localStorage.setItem('alo_kvlo_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Extract unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    courses.forEach(c => {
      c.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [courses]);

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
    if(!window.confirm("Dit zal alle voorbeeld-scholingen uploaden naar je database. Wil je doorgaan?")) return;
    setIsSeeding(true);
    try {
      await seedDatabase();
      showToast("✅ Database succesvol gevuld!");
    } catch (e: any) {
      showToast("❌ Fout bij uploaden");
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

      <main ref={contentRef} className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 md:pb-16 relative">
        
        {/* Mobile Filter & Search Button (Fixed Bottom Left/Center) */}
        {!showMobileFilters && (
            <div className="md:hidden fixed bottom-6 left-6 right-auto z-50">
                <button 
                    onClick={() => setShowMobileFilters(true)}
                    className="bg-slate-900 text-white px-5 py-4 rounded-full shadow-2xl flex items-center gap-2 font-bold transition-transform active:scale-95 border border-slate-700"
                >
                    <SlidersHorizontal className="w-5 h-5 text-[#00C1D4]" />
                    <span>Filters</span>
                </button>
            </div>
        )}

        {/* Mobile Admin Add Button */}
        {isAdmin && (
             <div className="md:hidden fixed bottom-6 left-32 z-50">
                 <button onClick={openAddModal} className="bg-[#7AB800] text-white p-4 rounded-full shadow-2xl">
                    <Plus className="w-6 h-6" />
                 </button>
             </div>
        )}

        <div className="flex gap-8 items-start">
          
          {/* LEFT COLUMN: Sidebar Filters */}
          <FilterSidebar 
            filters={filters}
            setFilters={setFilters}
            sortOption={sortOption}
            setSortOption={setSortOption}
            allTags={allTags}
            favoritesCount={favorites.length}
            showOnlyFavorites={showOnlyFavorites}
            setShowOnlyFavorites={setShowOnlyFavorites}
            isOpenMobile={showMobileFilters}
            closeMobile={() => setShowMobileFilters(false)}
            resultCount={filteredAndSortedCourses.length}
          />

          {/* RIGHT COLUMN: Content */}
          <div className="flex-1 min-w-0">
            
            {/* View Toggle & Admin Bar (Desktop) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                
               {/* Admin Status */}
               {isAdmin ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-[#7AB800] rounded-lg border border-green-100">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Beheer</span>
                    </div>
                    {isLiveMode() && (
                      <button onClick={handleSeedDatabase} disabled={isSeeding} className="text-xs font-bold text-slate-500 hover:text-[#00C1D4] flex items-center gap-1">
                        <UploadCloud className="w-3 h-3" /> Upload Demo
                      </button>
                    )}
                    <button onClick={openAddModal} className="text-xs font-bold text-[#7AB800] hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Toevoegen
                    </button>
                  </div>
               ) : (
                  // DB Status for non-admins
                  <div className="flex items-center">
                    {!isLiveMode() ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-500/80" title="Demo Modus">
                            <WifiOff className="w-3.5 h-3.5" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-xs font-bold text-green-500/80">
                            <Wifi className="w-3.5 h-3.5" />
                        </div>
                    )}
                  </div>
               )}

               {/* View Switcher */}
               <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex ml-auto">
                  <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-[#00C1D4]/10 text-[#00C1D4]' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Lijst</span>
                  </button>
                  <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-[#7AB800]/10 text-[#7AB800]' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <CalendarIcon className="w-4 h-4" /> <span className="hidden sm:inline">Kalender</span>
                  </button>
                  <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <MapIcon className="w-4 h-4" /> <span className="hidden sm:inline">Kaart</span>
                  </button>
               </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
               </div>
            ) : (
              <>
                {viewMode === 'list' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
                        <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4 text-slate-300">
                            <SlidersHorizontal className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Geen scholingen gevonden</h3>
                        <p className="text-sm text-slate-500">Probeer je filters aan te passen.</p>
                      </div>
                    )}
                  </div>
                )}

                {viewMode === 'calendar' && <CalendarView courses={filteredAndSortedCourses} onSelectCourse={setSelectedCourse} />}
                {viewMode === 'map' && <MapView courses={filteredAndSortedCourses} onSelectCourse={setSelectedCourse} />}
              </>
            )}

          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} LO Academie - Een initiatief van KVLO & ALO Nederland.
          </p>
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