import { Course, Organizer } from './types';

export const REGIONS = ['Noord', 'Oost', 'Zuid', 'West', 'Landelijk', 'Online'];

// Nieuwe set sfeerbeelden voor fallbacks - Puur gericht op school/educatie/sport
export const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=80&w=400', // School gymzaal
  'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=400', // Team/Samenwerking
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=400', // Atletiekbaan
  'https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&q=80&w=400', // Sportveld buiten
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=400', // Klaslokaal/Theorie
  'https://images.unsplash.com/photo-1472224371017-08207f84aaae?auto=format&fit=crop&q=80&w=400', // Grasveld/Natuur
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
    imageUrl: 'https://images.unsplash.com/photo-1562771379-e71d2b1283f5?auto=format&fit=crop&q=80&w=400', // Grote sporthal (leeg/schoon)
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
    imageUrl: 'https://images.unsplash.com/photo-1532444458054-01a7dd3e9fca?auto=format&fit=crop&q=80&w=400' // Stopwatch/Tijdwaarneming
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
    imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=400' // Notitieboek/Agenda
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
    imageUrl: 'https://images.unsplash.com/photo-1616961862865-c9b433c6a96b?auto=format&fit=crop&q=80&w=400' // Klimwand/Spelend kind
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
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400' // Duidelijke EHBO tas/koffer
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
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400' // Natuur/Rust/Yoga-sfeer
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
    imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=400' // Congreszaal/Presentatie
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
    imageUrl: 'https://images.unsplash.com/photo-1565692694301-3c46d37ceb96?auto=format&fit=crop&q=80&w=400' // Juichende mensen/Viering
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
    imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=400' // Kinderen rennend op schoolplein
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
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=400' // Vergadering/Overleg
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
    imageUrl: 'https://images.unsplash.com/photo-1552674605-469523f54050?auto=format&fit=crop&q=80&w=400' // Urban sportcourt buiten
  }
];