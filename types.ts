export const ORGANIZERS = [
  'KVLO',
  'ALO Nederland',
  'Fontys',
  'HAN',
  'Hanze',
  'HHS',
  'HvA',
  'Windesheim'
];

export const sortOrganizers = (organizers: string[] | undefined): string[] => {
  if (!organizers) return [];
  return [...organizers].sort((a, b) => {
    const priorityA = a === 'KVLO' ? 1 : a === 'ALO Nederland' ? 2 : 3;
    const priorityB = b === 'KVLO' ? 1 : b === 'ALO Nederland' ? 2 : 3;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.localeCompare(b);
  });
};

export interface Course {
  id: string;
  title: string;
  organizers: string[];
  date?: string; // ISO date string, optional
  sessions?: number; // Number of meetings/sessions
  location: string;
  region: string;
  price: number;
  description: string;
  tags: string[];
  url: string;
  imageUrl?: string;
  isNew?: boolean; // New optional property
}

export interface SearchFilters {
  query: string;
  region: string;
  dateStart: string;
  dateEnd: string;
  organizers: string[];
  selectedTags: string[];
}

export type SortOption = 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}