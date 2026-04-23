export const ORGANIZERS = [
  'ALO Nederland',
  'KVLO',
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
    const priorityA = a === 'ALO Nederland' ? 1 : a === 'KVLO' ? 2 : 3;
    const priorityB = b === 'ALO Nederland' ? 1 : b === 'KVLO' ? 2 : 3;
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
  price?: number | null;
  memberPrice?: number | null;
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
  priceType: string;
}

export type SortOption = 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}