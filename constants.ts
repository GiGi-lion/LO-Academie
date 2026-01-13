import { Course, Organizer } from './types';

export const REGIONS = ['Noord', 'Oost', 'Zuid', 'West', 'Landelijk', 'Online'];

export const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=400', // Sporthal
  'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=400', // Team/Groep
  'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&q=80&w=400', // Gymzaal materiaal
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=400', // Atletiekbaan
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=400', // Basketbal
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=400', // Klaslokaal/Studie
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'alo-studiedag-jan',
    title: 'Landelijke studiedag KVLO en ALO Nederland',
    organizer: Organizer.JOINT,
    date: '2026-01-26',
    location: 'ALO Amsterdam',
    region: 'West',
    price: 150,
    description: 'Inschrijving geopend! Gezamenlijke studiedag op de ALO Amsterdam.',
    tags: ['Studiedag', 'Landelijk', 'Kennisdeling'],
    url: 'https://www.kvlo.nl/kalender/bijeenkomst/detail.aspx?Id=B9CEF428-BBB0-4AE1-8804-A6819124C2AF',
    imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=400', // Grote Sporthal
    isNew: true
  },
  {
    id: 'kvlo-bsm-feb',
    title: 'Cursus Van start met BSM of LO2',
    organizer: Organizer.KVLO,
    date: '2026-02-02',
    location: 'Zeist',
    region: 'Landelijk',
    price: 295,
    description: 'Voor docenten die starten met BSM of LO2.',
    tags: ['VO', 'BSM', 'LO2'],
    url: 'https://www.kvlo.nl',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=400' // Atletiekbaan
  },
  {
    id: 'kvlo-coord-feb',
    title: 'Starterscursus vakgroepcoördinator bewegingsonderwijs po',
    organizer: Organizer.KVLO,
    date: '2026-02-03',
    location: 'Zeist',
    region: 'Landelijk',
    price: 295,
    description: 'Basiscursus voor nieuwe vakgroepcoördinatoren in het PO.',
    tags: ['PO', 'Coördinator', 'Management'],
    url: 'https://www.kvlo.nl',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=400' // Planning/Notitieboek
  },
  {
    id: 'alo-mrt-feb',
    title: 'Cursus Motorische Remedial Teaching',
    organizer: Organizer.ALO,
    date: '2026-02-04',
    location: 'CALO Windesheim, Zwolle',
    region: 'Landelijk',
    price: 450,
    description: 'Aangeboden door ALO Nederland. Specialistische cursus MRT.',
    tags: ['PO', 'Zorg', 'MRT'],
    url: 'https://www.alo.nl',
    imageUrl: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1ef4d?auto=format&fit=crop&q=80&w=400' // Kind balanceren/spelen
  },
  {
    id: 'kvlo-ehbo-feb',
    title: 'EHBO cursus afdeling Leiden',
    organizer: Organizer.KVLO,
    date: '2026-02-04',
    location: 'Vlietland College',
    region: 'West',
    price: 95,
    description: 'EHBO cursus (en 11/2) bij Vlietland College.',
    tags: ['Afdeling', 'Veiligheid', 'EHBO'],
    url: 'https://www.kvlo.nl',
    imageUrl: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80&w=400' // Medische kit/EHBO
  },
  {
    id: 'alo-heedfulness-feb',
    title: 'Cursus Heedfulness: Van stress naar energie & veerkracht',
    organizer: Organizer.ALO,
    date: '2026-02-05',
    location: 'HAN ALO, Nijmegen',
    region: 'Landelijk',
    price: 225,
    description: 'Aangeboden door ALO Nederland. Focus op energie en veerkracht voor docenten.',
    tags: ['Vitaliteit', 'Docent', 'Welzijn'],
    url: 'https://www.alo.nl',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400' // Natuur/Rust
  },
  {
    id: 'kvlo-symposium-mrt',
    title: 'Symposium WerkPlekCheck',
    organizer: Organizer.KVLO,
    date: '2026-03-05',
    location: 'Expo Houten',
    region: 'Landelijk',
    price: 125,
    description: 'Schrijf je nu in! Alles over de veilige werkplek.',
    tags: ['Veiligheid', 'Symposium', 'Arbo'],
    url: 'https://www.kvlo.nl',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400' // Gymzaal materiaal/ringen
  },
  {
    id: 'kvlo-award-mrt',
    title: 'Beweegrijke School Award po',
    organizer: Organizer.JOINT,
    date: '2026-03-18',
    location: 'Fontys Sport en Bewegen, Eindhoven',
    region: 'Zuid',
    price: 0,
    description: 'Uitreiking van de Beweegrijke School Award voor het PO.',
    tags: ['PO', 'Award', 'Innovatie'],
    url: 'https://www.kvlo.nl',
    imageUrl: 'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?auto=format&fit=crop&q=80&w=400' // Trofee/Goud
  },
  {
    id: 'kvlo-insp-mrt',
    title: 'Inspiratiedag Beweegrijke Basisscholen',
    organizer: Organizer.JOINT,
    date: '2026-03-18',
    location: 'Fontys Sport en Bewegen, Eindhoven',
    region: 'Zuid',
    price: 95,
    description: 'Inspiratiedag bij Fontys Eindhoven.',
    tags: ['PO', 'Inspiratie', 'Praktijk'],
    url: 'https://www.kvlo.nl',
    imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=400' // Spelende kinderen/Kleurrijk
  },
  {
    id: 'kvlo-netwerk-mrt',
    title: 'Bijeenkomst netwerk vakgroepcoördinatoren po',
    organizer: Organizer.KVLO,
    date: '2026-03-24',
    location: 'Zeist',
    region: 'Landelijk',
    price: 0,
    description: 'Netwerkbijeenkomst voor coördinatoren.',
    tags: ['PO', 'Netwerk', 'Coördinator'],
    url: 'https://www.kvlo.nl',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400' // Mensen in overleg
  },
  {
    id: 'alo-ruimte-mrt',
    title: 'Cursus Bewegen in de Openbare Ruimte',
    organizer: Organizer.ALO,
    date: '2026-03-24',
    location: 'HAN ALO, Nijmegen',
    region: 'Landelijk',
    price: 250,
    description: 'Aangeboden door ALO Nederland. Bewegen buiten de gymzaal.',
    tags: ['Outdoor', 'Urban', 'Trends'],
    url: 'https://www.alo.nl',
    imageUrl: 'https://images.unsplash.com/photo-1552674605-469523f54050?auto=format&fit=crop&q=80&w=400' // Urban sportcourt
  }
];