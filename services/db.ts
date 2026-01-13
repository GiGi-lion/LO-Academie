import { Course } from '../types';
import { INITIAL_COURSES } from '../constants';

// Dit bestand beheert de data-opslag.
// Momenteel draait de applicatie in 'Demo Modus' met LocalStorage.
// Er zijn geen externe database-connecties of API-keys nodig in dit bestand.

const LOCAL_EVENT = 'local-storage-update';

// Functie om naar updates te luisteren
export const subscribeToCourses = (onUpdate: (courses: Course[]) => void) => {
  const loadLocal = () => {
    try {
      const saved = localStorage.getItem('local_courses');
      const courses = saved ? JSON.parse(saved) : INITIAL_COURSES;
      onUpdate(courses);
    } catch (e) {
      console.error("Fout bij laden data:", e);
      onUpdate(INITIAL_COURSES);
    }
  };

  loadLocal(); // Direct laden
  
  const handleStorageEvent = () => loadLocal();
  window.addEventListener(LOCAL_EVENT, handleStorageEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(LOCAL_EVENT, handleStorageEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
};

// Scholing opslaan (Toevoegen of Bewerken)
export const saveCourseToDB = async (course: Course) => {
  const saved = localStorage.getItem('local_courses');
  const current = saved ? JSON.parse(saved) : INITIAL_COURSES;
  
  const exists = current.some((c: Course) => c.id === course.id);
  let next;
  
  if (exists) {
    next = current.map((c: Course) => c.id === course.id ? course : c);
  } else {
    next = [course, ...current];
  }
  
  localStorage.setItem('local_courses', JSON.stringify(next));
  window.dispatchEvent(new Event(LOCAL_EVENT));
};

// Scholing verwijderen
export const deleteCourseFromDB = async (id: string) => {
  const saved = localStorage.getItem('local_courses');
  const current = saved ? JSON.parse(saved) : INITIAL_COURSES;
  const next = current.filter((c: Course) => c.id !== id);
  
  localStorage.setItem('local_courses', JSON.stringify(next));
  window.dispatchEvent(new Event(LOCAL_EVENT));
};

// Database vullen met demo data
export const seedDatabase = async () => {
  localStorage.setItem('local_courses', JSON.stringify(INITIAL_COURSES));
  window.dispatchEvent(new Event(LOCAL_EVENT));
  return true;
};

export const isLiveMode = () => false;