export enum Organizer {
  KVLO = 'KVLO',
  ALO = 'ALO Nederland',
  JOINT = 'Gezamenlijk'
}

export interface Course {
  id: string;
  title: string;
  organizer: Organizer;
  date: string; // ISO date string
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
  organizer: string;
  selectedTags: string[];
}

export type SortOption = 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}