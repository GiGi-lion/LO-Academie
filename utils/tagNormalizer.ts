export const TAG_MAPPING: Record<string, string> = {
  // Bewegingsonderwijs / Sportonderwijs
  'bewegingsonderwijs': 'Bewegingsonderwijs',
  'beweegonderwijs': 'Bewegingsonderwijs',
  'sportonderwijs': 'Bewegingsonderwijs',
  'gymles': 'Bewegingsonderwijs',
  'lichamelijke opvoeding': 'Bewegingsonderwijs',
  'lo': 'Bewegingsonderwijs',

  // Klimmen
  'klimmen': 'Klimmen',
  'sportklimmen': 'Klimmen',
  'boulderen': 'Klimmen',
  'toprope': 'Klimmen',

  // Beleid
  'beweegbeleid': 'Organisatiebeleid',
  'sportbeleid': 'Organisatiebeleid',
  'organisatiebeleid': 'Organisatiebeleid',
  'beleid': 'Organisatiebeleid',

  // Talent
  'beweegtalent': 'Talentontwikkeling',
  'talentontwikkeling': 'Talentontwikkeling',

  // Voeding
  'sportvoeding': 'Voeding',
  'voeding': 'Voeding',

  // Veiligheid
  'sociale veiligheid': 'Veiligheid',
  'veiligheid': 'Veiligheid',

  // Leiderschap / Leidinggevende
  'leiderschap': 'Leiderschap',
  'leidinggevende': 'Leiderschap',
  'leiding geven': 'Leiderschap',
  'management': 'Leiderschap',

  // Examenvakken
  'examenvakken': 'Examenvakken (BSM/LO2)',
  'bsm': 'Examenvakken (BSM/LO2)',
  'lo2': 'Examenvakken (BSM/LO2)',

  // Dynamische schooldag
  'bewegen in en om de school': 'Dynamische schooldag',
  'dynamische schooldag': 'Dynamische schooldag',

  // Coaching
  'beweegcoach': 'Coaching',
  'coaching': 'Coaching',
  'sportcoaching': 'Coaching',
  'voetbalcoach': 'Coaching',
  'leefstijlcoaching': 'Coaching',

  // Gezondheid / Leefstijl
  'gezonde leefstijl': 'Gezonde leefstijl',
  'gezondheid': 'Gezonde leefstijl',
  'leefstijl': 'Gezonde leefstijl',

  // Groepsdynamica
  'groepsdynamica': 'Groepsdynamica',
  'groepsdynamiek': 'Groepsdynamica',
  'klassenklimaat': 'Groepsdynamica',

  // Racketsporten
  'racketsporten': 'Racketsporten',
  'padel': 'Racketsporten',
  'pickelball': 'Racketsporten',
  'pickleball': 'Racketsporten',

  // EHBO
  'ehbo': 'EHBO',
  'reanimatie': 'EHBO',
  'bhv': 'EHBO',

  // Zwemmen
  'zwemmen': 'Zwemmen',
  'zwemonderwijs': 'Zwemmen',
  'schoolzwemmen': 'Zwemmen',

  // Turnen
  'turnen': 'Turnen',
  'gymnastiek': 'Turnen',

  // Atletiek
  'atletiek': 'Atletiek',
  'hardlopen': 'Atletiek',

  // Vechtsport
  'vechtsport': 'Vechtsport',
  'zelfverdediging': 'Vechtsport',
  'judo': 'Vechtsport',
  'boksen': 'Vechtsport',

  // Dans
  'dans': 'Dans',
  'dansen': 'Dans',

  // Yoga
  'yoga': 'Yoga',
  'mindfulness': 'Yoga',

  // Overig
  'mentale training': 'Mentale training',
  'motoriek': 'Motoriek',
  'motorische vaardigheden': 'Motoriek',
  'motorisch leren': 'Motoriek',
  'professionele ontwikkeling': 'Professionele ontwikkeling'
};

export const normalizeTag = (tag: string): string => {
  const lowerTag = tag.toLowerCase().trim();
  
  if (TAG_MAPPING[lowerTag]) {
    return TAG_MAPPING[lowerTag];
  }
  
  // Capitalize first letter, rest lowercase
  return tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
};

export const normalizeTags = (tags: string[]): string[] => {
  if (!tags) return [];
  
  const normalized = tags.map(normalizeTag);
  
  // Remove duplicates
  return Array.from(new Set(normalized));
};
