// @ts-ignore
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, writeBatch } from 'firebase/firestore';
import { Course } from '../types';
import { INITIAL_COURSES } from '../constants';

// ------------------------------------------------------------------
// STAP 1: DATABASE CONFIGURATIE
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDrUwDymkHBGMHOZeJcqvwCAkfShnM6s9I",
  authDomain: "lo-academie.firebaseapp.com",
  projectId: "lo-academie",
  storageBucket: "lo-academie.firebasestorage.app",
  messagingSenderId: "1059548313822",
  appId: "1:1059548313822:web:f814dee441b2bb0f8a2a4f",
  measurementId: "G-3GR9Z8VL42"
};

// ------------------------------------------------------------------

// Interne logica om te bepalen of we Live zijn of in Demo modus
let db: any = null;
const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "VUL_HIER_JE_API_KEY";

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("✅ Verbonden met Firebase Database");
  } catch (e) {
    console.error("❌ Firebase connectie fout:", e);
  }
} else {
  console.log("⚠️ Geen Firebase config gevonden. App draait in lokale demo-modus.");
}

// Custom event voor lokale updates zodat de UI reageert zonder database
const LOCAL_EVENT = 'local-storage-update';

// Functie om naar updates te luisteren (Real-time!)
export const subscribeToCourses = (onUpdate: (courses: Course[]) => void) => {
  if (isConfigured && db) {
    // LIVE MODUS: Luister naar Firestore
    const q = query(collection(db, "courses"));
    return onSnapshot(q, (snapshot: any) => {
      const courses = snapshot.docs.map((doc: any) => doc.data() as Course);
      onUpdate(courses);
    }, (error: any) => {
      console.error("Fout bij ophalen data. Heb je de database aangemaakt in 'Test Mode'?", error);
    });
  } else {
    // DEMO MODUS: Luister naar LocalStorage events
    const loadLocal = () => {
      const saved = localStorage.getItem('local_courses');
      const courses = saved ? JSON.parse(saved) : INITIAL_COURSES;
      onUpdate(courses);
    };

    loadLocal(); // Direct laden
    
    const handleStorageEvent = () => loadLocal();
    window.addEventListener(LOCAL_EVENT, handleStorageEvent);
    // Luister ook naar storage events van andere tabbladen
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener(LOCAL_EVENT, handleStorageEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }
};

// Scholing opslaan (Toevoegen of Bewerken)
export const saveCourseToDB = async (course: Course) => {
  if (isConfigured && db) {
    // LIVE MODUS
    await setDoc(doc(db, "courses", course.id), course);
  } else {
    // DEMO MODUS
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
  }
};

// Scholing verwijderen
export const deleteCourseFromDB = async (id: string) => {
  if (isConfigured && db) {
    // LIVE MODUS
    await deleteDoc(doc(db, "courses", id));
  } else {
    // DEMO MODUS
    const saved = localStorage.getItem('local_courses');
    const current = saved ? JSON.parse(saved) : INITIAL_COURSES;
    const next = current.filter((c: Course) => c.id !== id);
    
    localStorage.setItem('local_courses', JSON.stringify(next));
    window.dispatchEvent(new Event(LOCAL_EVENT));
  }
};

// NIEUW: Functie om de database te vullen met demo data
export const seedDatabase = async () => {
  if (!isConfigured || !db) {
    throw new Error("Geen database connectie. Controleer config.");
  }
  
  try {
    const batch = writeBatch(db);
    INITIAL_COURSES.forEach(course => {
      const docRef = doc(db, "courses", course.id);
      batch.set(docRef, course);
    });
    
    // Explicit return of the promise
    return await batch.commit();
  } catch (e) {
    console.error("Fout bij seeden van database:", e);
    throw e;
  }
};

export const isLiveMode = () => isConfigured && !!db;