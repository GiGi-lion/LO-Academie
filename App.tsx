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
import { ConfirmModal } from './components/ConfirmModal';
import { Course, SearchFilters, SortOption } from './types';
import { subscribeToCourses, saveCourseToDB, deleteCourseFromDB, isLiveMode, seedDatabase, fetchCourses } from './services/db';
import { supabase } from './services/supabase';
import { Plus, SlidersHorizontal, LayoutGrid, Calendar as CalendarIcon, Map as MapIcon, ShieldCheck, Wifi, WifiOff, UploadCloud, RefreshCw } from 'lucide-react';
import { TAG_MAPPING, normalizeTags } from './utils/tagNormalizer';

type ViewMode = 'list' | 'calendar' | 'map';

const App: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('alo_kvlo_favorites');
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing favorites from localStorage", e);
      return [];
    }
  });

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    region: 'Alle',
    dateStart: '',
    dateEnd: '',
    organizers: [],
    selectedTags: [],
    priceType: 'Alle'
  });
  
  const [sortOption, setSortOption] = useState<SortOption>('date-asc');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | undefined>(undefined);
  const [toast, setToast] = useState<{message: string, isVisible: boolean, type: 'success' | 'error'}>({ message: '', isVisible: false, type: 'success' });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{message: string, onConfirm: () => void} | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);

  // Google Analytics Initialization
  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (!gaId || gaId === "undefined") return;

    // Load gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;
    gtag('js', new Date());
    gtag('config', gaId);
  }, []);

  // Google Analytics Page Tracking
  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaId && gaId !== "undefined" && typeof window !== 'undefined' && (window as any).gtag) {
      const path = viewMode === 'list' ? '/' : `/${viewMode}`;
      (window as any).gtag('config', gaId, {
        page_path: path,
        page_title: `LO Academie - ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}`
      });
    }
  }, [viewMode]);

  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaId && gaId !== "undefined" && selectedCourse && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'view_item', {
        items: [{
          item_id: selectedCourse.id,
          item_name: selectedCourse.title,
          item_category: selectedCourse.region
        }]
      });
    }
  }, [selectedCourse]);

  // Check session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        if (error.message.includes("Refresh Token Not Found") || error.message.includes("Invalid Refresh Token")) {
          // Clear invalid session
          try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('sb-')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
          } catch (e) {}
          supabase.auth.signOut().catch(() => {});
        } else {
          console.error("Supabase getSession error:", error);
        }
      }
      setIsAdmin(!!session);
    }).catch(err => {
      if (err && err.message && (err.message.includes("Refresh Token Not Found") || err.message.includes("Invalid Refresh Token"))) {
        // Suppress
      } else {
        console.error("Supabase getSession exception:", err);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  // Process courses to handle expired dates (hide past dates)
  const processedCourses = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return courses.map(course => {
      if (course.date && course.date.trim() !== '' && course.date < todayStr) {
        return { ...course, date: undefined };
      }
      return course;
    });
  }, [courses]);

  const allTags = useMemo(() => {
    const tagMap = new Map<string, string>();
    processedCourses.forEach(c => {
      c.tags.forEach(t => {
        const lower = t.toLowerCase().trim();
        if (!tagMap.has(lower)) {
          // Capitalize first letter for display
          const displayTag = t.charAt(0).toUpperCase() + t.slice(1);
          tagMap.set(lower, displayTag);
        }
      });
    });
    return Array.from(tagMap.values()).sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
  }, [processedCourses]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, isVisible: true, type });
  };

  const handleAdminToggle = async () => {
    if (isAdmin) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Error signing out:", e);
      }
      showToast("Beheerdersmodus uitgeschakeld", "success");
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    setShowAdminLogin(false);
    showToast("Beheerdersmodus geactiveerd", "success");
  };

  const handleSeedDatabase = async () => {
    setConfirmAction({
      message: "Dit zal alle voorbeeld-scholingen uploaden naar je database. Wil je doorgaan?",
      onConfirm: async () => {
        setIsSeeding(true);
        try {
          await seedDatabase();
          const updatedCourses = await fetchCourses();
          setCourses(updatedCourses);
          showToast("✅ Database succesvol gevuld!", "success");
        } catch (e: any) {
          console.error("Error seeding database:", e);
          showToast(`❌ Fout bij uploaden: ${e.message || 'Onbekende fout'}`, "error");
        } finally {
          setIsSeeding(false);
        }
      }
    });
  };

  const handleNormalizeTags = async () => {
    setConfirmAction({
      message: "Weet je zeker dat je alle tags in de database wilt opschonen en standaardiseren?",
      onConfirm: async () => {
        setIsNormalizing(true);
        try {
          let updatedCount = 0;
          for (const course of courses) {
            const uniqueTags = normalizeTags(course.tags);

            let hasChanges = false;
            if (uniqueTags.length !== course.tags.length) {
              hasChanges = true;
            } else {
              hasChanges = uniqueTags.some((t, i) => t !== course.tags[i]);
            }

            if (hasChanges) {
              await saveCourseToDB({ ...course, tags: uniqueTags });
              updatedCount++;
            }
          }
          
          if (updatedCount > 0) {
            const updatedCourses = await fetchCourses();
            setCourses(updatedCourses);
            showToast(`✅ Succesvol ${updatedCount} scholing(en) opgeschoond!`, "success");
          } else {
            showToast("ℹ️ Alle tags zijn al optimaal, geen wijzigingen nodig.", "success");
          }
        } catch (error: any) {
          console.error("Fout bij opschonen tags:", error);
          showToast(`❌ Fout bij opschonen: ${error.message || 'Onbekende fout'}`, "error");
        } finally {
          setIsNormalizing(false);
        }
      }
    });
  };

  const filteredAndSortedCourses = useMemo(() => {
    let result = processedCourses.filter(course => {
      const matchesQuery = 
        course.title.toLowerCase().includes(filters.query.toLowerCase()) || 
        course.description.toLowerCase().includes(filters.query.toLowerCase()) ||
        course.tags.some(tag => tag.toLowerCase().includes(filters.query.toLowerCase()));
      
      const matchesRegion = filters.region === 'Alle' || course.region === filters.region;
      const matchesDateStart = !filters.dateStart || (course.date && course.date >= filters.dateStart);
      const matchesDateEnd = !filters.dateEnd || (course.date && course.date <= filters.dateEnd);
      const matchesOrganizer = filters.organizers.length === 0 || 
        (course.organizers && course.organizers.some(org => filters.organizers.includes(org)));
      const matchesTags = filters.selectedTags.length === 0 || 
        filters.selectedTags.some(tag => course.tags.some(ct => ct.toLowerCase().trim() === tag.toLowerCase().trim()));
      const matchesFavorite = !showOnlyFavorites || favorites.includes(course.id);
      
      let matchesPrice = true;
      if (filters.priceType === 'Gratis') {
        matchesPrice = course.price === 0;
      } else if (filters.priceType === 'Betaald') {
        matchesPrice = course.price !== undefined && course.price !== null && course.price > 0;
      } else if (filters.priceType === 'Op aanvraag') {
        matchesPrice = course.price === undefined || course.price === null;
      }

      return matchesQuery && matchesRegion && matchesDateStart && matchesDateEnd && matchesOrganizer && matchesTags && matchesFavorite && matchesPrice;
    });

    result.sort((a, b) => {
      const hasDateA = a.date && a.date.trim() !== '';
      const hasDateB = b.date && b.date.trim() !== '';

      if (hasDateA && hasDateB) {
        if (sortOption === 'date-asc') return a.date!.localeCompare(b.date!);
        if (sortOption === 'date-desc') return b.date!.localeCompare(a.date!);
        if (sortOption === 'price-asc') {
          const priceA = a.price ?? Infinity;
          const priceB = b.price ?? Infinity;
          return priceA - priceB;
        }
        if (sortOption === 'price-desc') {
          const priceA = a.price ?? -Infinity;
          const priceB = b.price ?? -Infinity;
          return priceB - priceA;
        }
      } else if (hasDateA && !hasDateB) {
        return -1; // A comes first
      } else if (!hasDateA && hasDateB) {
        return 1; // B comes first
      } else {
        // Both no date, sort alphabetically
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [courses, filters, favorites, showOnlyFavorites, sortOption, isAdmin]);

  const handleSaveCourse = async (savedCourse: Course) => {
    try {
      const uniqueTags = normalizeTags(savedCourse.tags);

      await saveCourseToDB({ ...savedCourse, tags: uniqueTags });
      const updatedCourses = await fetchCourses();
      setCourses(updatedCourses);
      showToast(courseToEdit ? "Scholing bijgewerkt" : "Scholing toegevoegd", "success");
    } catch (e: any) {
      console.error('Error saving course:', e);
      showToast(`Er ging iets mis bij het opslaan: ${e.message || 'Onbekende fout'}`, "error");
      throw e; // Throw so AddCourseModal knows it failed
    }
  };

  const handleDeleteCourse = async (id: string) => {
    setConfirmAction({
      message: "Scholing definitief verwijderen?",
      onConfirm: async () => {
        try {
          await deleteCourseFromDB(id);
          const updatedCourses = await fetchCourses();
          setCourses(updatedCourses);
          showToast("Scholing verwijderd", "success");
          setIsModalOpen(false);
        } catch (e: any) {
          console.error("Delete error:", e);
          showToast(e.message || "Kan scholing niet verwijderen", "error");
        }
      }
    });
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
        type={toast.type}
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
            favoritesCount={favorites.filter(id => courses.some(c => c.id === id)).length}
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
                      <>
                        <button onClick={handleSeedDatabase} disabled={isSeeding} className="text-xs font-bold text-slate-500 hover:text-[#00C1D4] flex items-center gap-1">
                          <UploadCloud className="w-3 h-3" /> Upload Demo
                        </button>
                        <button onClick={handleNormalizeTags} disabled={isNormalizing} className="text-xs font-bold text-slate-500 hover:text-[#00C1D4] flex items-center gap-1">
                          <RefreshCw className={`w-3 h-3 ${isNormalizing ? 'animate-spin' : ''}`} /> Opschonen Tags
                        </button>
                      </>
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
                          onEdit={() => { setCourseToEdit(courses.find(c => c.id === course.id) || course); setIsModalOpen(true); }}
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
        allTags={allTags}
      />

      <CourseDetailModal 
        isOpen={!!selectedCourse} 
        course={selectedCourse} 
        onClose={() => setSelectedCourse(null)} 
      />

      <ConfirmModal
        isOpen={!!confirmAction}
        message={confirmAction?.message || ''}
        onConfirm={async () => {
          if (confirmAction) {
            await confirmAction.onConfirm();
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />

      <AIAssistant courses={processedCourses} onSelectCourse={setSelectedCourse} />
    </div>
  );
};

export default App;