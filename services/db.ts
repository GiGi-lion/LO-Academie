import { Course } from '../types';
import { INITIAL_COURSES } from '../constants';
import { supabase } from './supabase';

const mapFromSupabase = (row: any): Course => {
  let organizersArray: string[] = [];
  if (row.organizers) {
    organizersArray = Array.isArray(row.organizers) ? row.organizers : [row.organizers];
  } else if (row.organizer) {
    organizersArray = typeof row.organizer === 'string' ? row.organizer.split(',').map((s: string) => s.trim()) : [row.organizer];
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date || undefined,
    price: row.price,
    memberPrice: row.member_price !== undefined ? row.member_price : row.memberPrice,
    sessions: row.sessions,
    location: row.location || 'Onbekend',
    region: row.region,
    organizers: organizersArray,
    tags: row.tags || [],
    url: row.url || '',
    imageUrl: row.imageUrl || row.image_url || ''
  };
};

const mapToSupabase = (course: Course) => {
  const data: any = {
    title: course.title,
    description: course.description,
    date: course.date && course.date.trim() !== '' ? course.date : null,
    price: course.price !== undefined ? course.price : null,
    member_price: course.memberPrice !== undefined ? course.memberPrice : null,
    sessions: course.sessions !== undefined ? course.sessions : null,
    location: course.location,
    region: course.region,
    organizer: course.organizers ? course.organizers.join(', ') : '',
    tags: course.tags,
    url: course.url,
    imageUrl: course.imageUrl
  };
  
  if (course.id) {
    data.id = course.id;
  }
  
  return data;
};

export const fetchCourses = async (): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('date', { ascending: true });
    
  if (error) throw error;
  
  return data ? data.map(mapFromSupabase) : [];
};

// Functie om naar updates te luisteren
export const subscribeToCourses = (onUpdate: (courses: Course[]) => void) => {
  const loadCourses = async () => {
    try {
      const courses = await fetchCourses();
      onUpdate(courses);
    } catch (e) {
      console.error("Fout bij laden data uit Supabase:", e);
      onUpdate([]);
    }
  };

  loadCourses(); // Direct laden
  
  // Realtime subscription
  const subscription = supabase
    .channel('courses_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
      loadCourses();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Scholing opslaan (Toevoegen of Bewerken)
export const saveCourseToDB = async (course: Course): Promise<Course> => {
  try {
    const isNew = course.isNew;
    // We don't want to save isNew to the database
    const { isNew: _, ...courseDataToMap } = course;
    const courseData = mapToSupabase(courseDataToMap as Course);

    if (isNew) {
      // For new courses, we let Supabase generate the ID
      delete courseData.id;
      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();
      if (error) throw error;
      return mapFromSupabase(data);
    } else {
      delete courseData.id; // Prevent updating primary key
      const { data, error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', course.id)
        .select()
        .single();
      if (error) throw error;
      return mapFromSupabase(data);
    }
  } catch (e) {
    console.error("Error saving course:", e);
    throw e;
  }
};

// Scholing verwijderen
export const deleteCourseFromDB = async (id: string) => {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    // Refresh the courses list immediately after successful deletion
    // The realtime subscription should catch this, but forcing a refresh ensures the UI updates
    return true;
  } catch (e: any) {
    console.error("Error deleting course:", e);
    throw new Error(e.message || "Kan scholing niet verwijderen");
  }
};

// Database vullen met demo data
export const seedDatabase = async () => {
  try {
    // We remove the IDs so Supabase generates new UUIDs
    const coursesToInsert = INITIAL_COURSES.map(course => {
      const { isNew: _, ...courseDataToMap } = course;
      const mapped = mapToSupabase(courseDataToMap);
      delete mapped.id; // Ensure Supabase generates UUID
      return mapped;
    });
    
    const { error } = await supabase
      .from('courses')
      .insert(coursesToInsert);
      
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error seeding database:", e);
    throw e;
  }
};

export const isLiveMode = () => true;