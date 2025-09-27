export interface ColorGroup {
  name: string;
  keys: string[];
  class: string;
}

export const colorGroups: ColorGroup[] = [
  { name: 'Red', keys: ['A♭', 'A'], class: 'key-ab-a' },
  { name: 'Orange', keys: ['B♭', 'B'], class: 'key-bb-b' },
  { name: 'Yellow', keys: ['C', 'D♭'], class: 'key-c-db' },
  { name: 'Green', keys: ['D', 'E♭'], class: 'key-d-eb' },
  { name: 'Blue', keys: ['E', 'F'], class: 'key-e-f' },
  { name: 'Purple', keys: ['F♯', 'G'], class: 'key-fs-g' },
  { name: 'Dark Red', keys: ['A♭m', 'Am'], class: 'key-abm-am' },
  { name: 'Dark Orange', keys: ['B♭m', 'Bm'], class: 'key-bbm-bm' }
];

export const chordTypes = [
  'Major',
  'Minor', 
  '6th', 
  '7th', 
  '9th', 
  'Minor 6th', 
  'Minor 7th', 
  'Major 7th', 
  'Diminished', 
  'Augmented', 
  'Suspended'
];

export const exoticNumbers: Record<number, string> = {
  1: 'Diminished',
  2: 'Augmented', 
  3: 'Suspended',
  4: 'Major 7th',
  5: '9th'
};

export const getAllKeys = (): string[] => {
  return [
    'A♭', 'A', 'B♭', 'B', 'C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G',
    'A♭m', 'Am', 'B♭m', 'Bm', 'Cm', 'D♭m', 'Dm', 'E♭m', 'Em', 'Fm', 'F♯m', 'Gm'
  ];
};

export const pentatonicScale = [
  { degree: 1, name: 'Root', interval: 'Unison' },
  { degree: 2, name: 'Whole Step', interval: 'Major 2nd' },
  { degree: 3, name: 'Major 3rd', interval: 'Major 3rd' },
  { degree: 5, name: 'Perfect 5th', interval: 'Perfect 5th' },
  { degree: 6, name: 'Major 6th', interval: 'Major 6th' }
];

export interface ChordDiagram {
  name: string;
  positions: (number | 'X')[];  // 6 strings: E A D G B E (low to high)
  fingers?: number[];  // Finger positions (1-4)
  fret?: number;  // Starting fret for barre chords
}

// Common guitar chord diagrams
export const chordDiagrams: Record<string, ChordDiagram> = {
  // Major chords
  'C': { name: 'C Major', positions: ['X', 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  'D': { name: 'D Major', positions: ['X', 'X', 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  'E': { name: 'E Major', positions: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  'F': { name: 'F Major', positions: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], fret: 1 },
  'G': { name: 'G Major', positions: [3, 2, 0, 0, 3, 3], fingers: [3, 2, 0, 0, 4, 4] },
  'A': { name: 'A Major', positions: ['X', 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'B': { name: 'B Major', positions: ['X', 2, 4, 4, 4, 2], fingers: [0, 1, 3, 3, 3, 1], fret: 2 },

  // Minor chords  
  'Am': { name: 'A Minor', positions: ['X', 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  'Dm': { name: 'D Minor', positions: ['X', 'X', 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  'Em': { name: 'E Minor', positions: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  'Fm': { name: 'F Minor', positions: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], fret: 1 },
  'Gm': { name: 'G Minor', positions: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], fret: 3 },
  'Bm': { name: 'B Minor', positions: ['X', 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], fret: 2 },
  'Cm': { name: 'C Minor', positions: ['X', 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], fret: 3 },

  // 7th chords - Dominant
  'C7': { name: 'C Dominant 7', positions: ['X', 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  'D7': { name: 'D Dominant 7', positions: ['X', 'X', 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  'E7': { name: 'E Dominant 7', positions: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  'F7': { name: 'F Dominant 7', positions: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], fret: 1 },
  'G7': { name: 'G Dominant 7', positions: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  'A7': { name: 'A Dominant 7', positions: ['X', 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  'B7': { name: 'B Dominant 7', positions: ['X', 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },

  // Major 7th chords
  'CM7': { name: 'C Major 7', positions: ['X', 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  'DM7': { name: 'D Major 7', positions: ['X', 'X', 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1] },
  'EM7': { name: 'E Major 7', positions: [0, 2, 1, 1, 0, 0], fingers: [0, 2, 1, 1, 0, 0] },
  'FM7': { name: 'F Major 7', positions: [1, 3, 3, 2, 1, 0], fingers: [1, 3, 4, 2, 1, 0], fret: 1 },
  'GM7': { name: 'G Major 7', positions: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1] },
  'AM7': { name: 'A Major 7', positions: ['X', 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
  'BM7': { name: 'B Major 7', positions: ['X', 2, 4, 3, 4, 2], fingers: [0, 1, 3, 2, 4, 1], fret: 2 },

  // Minor 7th chords
  'Am7': { name: 'A Minor 7', positions: ['X', 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  'Dm7': { name: 'D Minor 7', positions: ['X', 'X', 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  'Em7': { name: 'E Minor 7', positions: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
  'Fm7': { name: 'F Minor 7', positions: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], fret: 1 },
  'Gm7': { name: 'G Minor 7', positions: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], fret: 3 },
  'Bm7': { name: 'B Minor 7', positions: ['X', 2, 0, 2, 0, 2], fingers: [0, 2, 0, 3, 0, 4] },
  'Cm7': { name: 'C Minor 7', positions: ['X', 3, 1, 3, 1, 3], fingers: [0, 3, 1, 4, 1, 2], fret: 3 },

  // Suspended chords
  'Asus': { name: 'A Suspended', positions: ['X', 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'Csus': { name: 'C Suspended', positions: ['X', 3, 3, 0, 1, 1], fingers: [0, 2, 3, 0, 1, 1] },
  'Dsus': { name: 'D Suspended', positions: ['X', 'X', 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
  'Esus': { name: 'E Suspended', positions: [0, 2, 2, 2, 0, 0], fingers: [0, 1, 1, 1, 0, 0] },
  'Fsus': { name: 'F Suspended', positions: [1, 3, 3, 3, 1, 1], fingers: [1, 2, 3, 4, 1, 1], fret: 1 },
  'Gsus': { name: 'G Suspended', positions: [3, 3, 0, 0, 1, 3], fingers: [3, 4, 0, 0, 1, 3] },

  // Sharp/Flat root variants
  'F#': { name: 'F# Major', positions: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], fret: 2 },
  'F#m': { name: 'F# Minor', positions: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], fret: 2 },
  'Bb': { name: 'Bb Major', positions: ['X', 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], fret: 1 },
  'Bbm': { name: 'Bb Minor', positions: ['X', 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], fret: 1 },
  'C#': { name: 'C# Major', positions: ['X', 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], fret: 4 },
  'C#m': { name: 'C# Minor', positions: ['X', 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], fret: 4 },
  'Eb': { name: 'Eb Major', positions: ['X', 'X', 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3] },
  'Ebm': { name: 'Eb Minor', positions: ['X', 'X', 1, 3, 4, 2], fingers: [0, 0, 1, 3, 4, 2] },

  // 9th chords
  'C9': { name: 'C Dominant 9', positions: ['X', 3, 2, 3, 3, 3], fingers: [0, 2, 1, 3, 4, 4] },
  'D9': { name: 'D Dominant 9', positions: ['X', 5, 4, 5, 5, 5], fingers: [0, 2, 1, 3, 4, 4] },
  'E9': { name: 'E Dominant 9', positions: [0, 2, 0, 1, 0, 2], fingers: [0, 2, 0, 1, 0, 3] },
  'G9': { name: 'G Dominant 9', positions: [3, 2, 0, 2, 0, 1], fingers: [4, 3, 0, 2, 0, 1] },

  // 6th chords
  'C6': { name: 'C Major 6th', positions: ['X', 3, 2, 2, 1, 0], fingers: [0, 3, 2, 2, 1, 0] },
  'D6': { name: 'D Major 6th', positions: ['X', 'X', 0, 2, 0, 2], fingers: [0, 0, 0, 2, 0, 3] },
  'E6': { name: 'E Major 6th', positions: [0, 2, 2, 1, 2, 0], fingers: [0, 2, 3, 1, 4, 0] },
  'F6': { name: 'F Major 6th', positions: [1, 3, 3, 2, 3, 1], fingers: [1, 2, 3, 1, 4, 1], fret: 1 },
  'G6': { name: 'G Major 6th', positions: [3, 2, 0, 0, 0, 0], fingers: [3, 2, 0, 0, 0, 0] },
  'A6': { name: 'A Major 6th', positions: ['X', 0, 2, 2, 2, 2], fingers: [0, 0, 1, 1, 1, 1] },

  // Minor 6th chords  
  'Am6': { name: 'A Minor 6th', positions: ['X', 0, 2, 2, 1, 2], fingers: [0, 0, 2, 3, 1, 4] },
  'Dm6': { name: 'D Minor 6th', positions: ['X', 'X', 0, 2, 0, 1], fingers: [0, 0, 0, 2, 0, 1] },
  'Em6': { name: 'E Minor 6th', positions: [0, 2, 2, 0, 2, 0], fingers: [0, 1, 2, 0, 3, 0] },

  // Diminished chords
  'C°': { name: 'C Diminished', positions: ['X', 3, 4, 2, 4, 2], fingers: [0, 2, 4, 1, 3, 1] },
  'D°': { name: 'D Diminished', positions: ['X', 'X', 0, 1, 0, 1], fingers: [0, 0, 0, 1, 0, 2] },
  'F#°': { name: 'F# Diminished', positions: [2, 'X', 1, 2, 1, 'X'], fingers: [2, 0, 1, 3, 1, 0] },

  // Augmented chords  
  'C+': { name: 'C Augmented', positions: ['X', 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0] },
  'F#+': { name: 'F# Augmented', positions: [2, 'X', 4, 3, 3, 'X'], fingers: [1, 0, 4, 2, 3, 0] },
  'G+': { name: 'G Augmented', positions: [3, 2, 1, 0, 0, 3], fingers: [4, 3, 2, 0, 0, 1] }
};

// Musical Mode Definitions for advanced theory
export interface ModeDef {
  id: string;
  name: string;
  quality: 'major' | 'minor' | 'diminished';
  intervals: number[]; // Semitone intervals from root
  degreeFormula: string[]; // Scale degrees (1, 2, b3, etc.)
  characteristicDegrees: number[]; // Degrees that define the mode
  avoidDegrees?: number[]; // Degrees to avoid emphasizing
  preferredPentatonic: 'major' | 'minor';
  color: string; // For visualization
  description: string;
  parentMajor: number; // Which degree of major scale this mode starts from
}

// The 7 modes of the major scale
export const modes: ModeDef[] = [
  {
    id: 'ionian',
    name: 'Ionian',
    quality: 'major',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degreeFormula: ['1', '2', '3', '4', '5', '6', '7'],
    characteristicDegrees: [1, 3, 5],
    preferredPentatonic: 'major',
    color: 'rgb(59, 130, 246)', // Blue
    description: 'The major scale - bright and happy',
    parentMajor: 1
  },
  {
    id: 'dorian',
    name: 'Dorian',
    quality: 'minor',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degreeFormula: ['1', '2', '♭3', '4', '5', '6', '♭7'],
    characteristicDegrees: [6], // Natural 6th makes it distinctive
    preferredPentatonic: 'minor',
    color: 'rgb(34, 197, 94)', // Green
    description: 'Minor with natural 6th - jazzy and sophisticated',
    parentMajor: 2
  },
  {
    id: 'phrygian',
    name: 'Phrygian',
    quality: 'minor',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    degreeFormula: ['1', '♭2', '♭3', '4', '5', '♭6', '♭7'],
    characteristicDegrees: [2], // Flat 2nd creates Spanish/exotic sound
    preferredPentatonic: 'minor',
    color: 'rgb(168, 85, 247)', // Purple
    description: 'Dark and exotic - Spanish/Mediterranean flavor',
    parentMajor: 3
  },
  {
    id: 'lydian',
    name: 'Lydian',
    quality: 'major',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    degreeFormula: ['1', '2', '3', '♯4', '5', '6', '7'],
    characteristicDegrees: [4], // Sharp 4th creates dreamy quality
    preferredPentatonic: 'major',
    color: 'rgb(249, 115, 22)', // Orange
    description: 'Major with sharp 4th - dreamy and floating',
    parentMajor: 4
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian',
    quality: 'major',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degreeFormula: ['1', '2', '3', '4', '5', '6', '♭7'],
    characteristicDegrees: [7], // Flat 7th gives bluesy/rock feel
    preferredPentatonic: 'major',
    color: 'rgb(239, 68, 68)', // Red
    description: 'Major with flat 7th - bluesy and dominant',
    parentMajor: 5
  },
  {
    id: 'aeolian',
    name: 'Aeolian',
    quality: 'minor',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degreeFormula: ['1', '2', '♭3', '4', '5', '♭6', '♭7'],
    characteristicDegrees: [1, 3, 5],
    preferredPentatonic: 'minor',
    color: 'rgb(107, 114, 128)', // Gray
    description: 'Natural minor scale - melancholy and emotional',
    parentMajor: 6
  },
  {
    id: 'locrian',
    name: 'Locrian',
    quality: 'diminished',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    degreeFormula: ['1', '♭2', '♭3', '4', '♭5', '♭6', '♭7'],
    characteristicDegrees: [5], // Flat 5th creates unstable, diminished sound
    avoidDegrees: [1], // Root is often avoided due to instability
    preferredPentatonic: 'minor',
    color: 'rgb(75, 85, 99)', // Dark gray
    description: 'Unstable and dissonant - rarely used as tonal center',
    parentMajor: 7
  }
];

// Core chromatic notes (using sharps to match fretboard mapping)
export const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

// Normalize note names for consistent comparison
export const normalizeNote = (note: string): string => {
  return note.replace(/♯/g, '#').replace(/♭/g, 'b').replace(/\s/g, '');
};

// Transpose a note by semitones
export const transpose = (rootNote: string, semitones: number): string => {
  const normalized = normalizeNote(rootNote);
  let rootIndex = NOTES.findIndex(note => normalizeNote(note) === normalized);
  
  if (rootIndex === -1) {
    // Handle enharmonic equivalents
    const enharmonics: Record<string, string> = {
      'Db': 'C♯', 'Eb': 'D♯', 'Gb': 'F♯', 'Ab': 'G♯', 'Bb': 'A♯'
    };
    const equivalent = enharmonics[normalized] || enharmonics[normalized.replace('b', '♭')];
    if (equivalent) {
      rootIndex = NOTES.findIndex(note => normalizeNote(note) === normalizeNote(equivalent));
    }
  }
  
  if (rootIndex === -1) return rootNote; // Return original if not found
  
  const newIndex = (rootIndex + semitones + 12) % 12;
  return NOTES[newIndex];
};

// Build scale notes from root and intervals
export const buildScaleByIntervals = (root: string, intervals: number[]): string[] => {
  return intervals.map(interval => transpose(root, interval));
};

// Convert degree formula to actual notes
export const degreeToNote = (root: string, degreeFormula: string[]): string[] => {
  const degreeToSemitones: Record<string, number> = {
    '1': 0, '♭2': 1, '2': 2, '♭3': 3, '3': 4, '4': 5, '♯4': 6, '♭5': 6, '5': 7,
    '♯5': 8, '♭6': 8, '6': 9, '♯6': 10, '♭7': 10, '7': 11
  };
  
  return degreeFormula.map(degree => {
    const semitones = degreeToSemitones[degree];
    return semitones !== undefined ? transpose(root, semitones) : root;
  });
};

// Check if array A is a subset of array B
export const isSubset = (a: string[], b: string[]): boolean => {
  const normalizedB = b.map(normalizeNote);
  return a.every(note => normalizedB.includes(normalizeNote(note)));
};

// Generate related scales for a given mode
export const generateRelatedScales = (mode: ModeDef, root: string): Array<{name: string, notes: string[], type: string}> => {
  const modeNotes = buildScaleByIntervals(root, mode.intervals);
  const relatedScales: Array<{name: string, notes: string[], type: string}> = [];
  
  // Major pentatonic (1 2 3 5 6)
  if (mode.preferredPentatonic === 'major') {
    const majorPenta = [root, transpose(root, 2), transpose(root, 4), transpose(root, 7), transpose(root, 9)];
    if (isSubset(majorPenta, modeNotes)) {
      relatedScales.push({name: 'Major Pentatonic', notes: majorPenta, type: 'pentatonic'});
    }
  }
  
  // Minor pentatonic (1 ♭3 4 5 ♭7)
  if (mode.preferredPentatonic === 'minor') {
    const minorPenta = [root, transpose(root, 3), transpose(root, 5), transpose(root, 7), transpose(root, 10)];
    if (isSubset(minorPenta, modeNotes)) {
      relatedScales.push({name: 'Minor Pentatonic', notes: minorPenta, type: 'pentatonic'});
    }
  }
  
  // Triad arpeggio
  let triadNotes: string[];
  if (mode.quality === 'major') {
    triadNotes = [root, transpose(root, 4), transpose(root, 7)]; // 1 3 5
  } else if (mode.quality === 'minor') {
    triadNotes = [root, transpose(root, 3), transpose(root, 7)]; // 1 ♭3 5
  } else { // diminished
    triadNotes = [root, transpose(root, 3), transpose(root, 6)]; // 1 ♭3 ♭5
  }
  
  if (isSubset(triadNotes, modeNotes)) {
    relatedScales.push({name: `${mode.quality.charAt(0).toUpperCase() + mode.quality.slice(1)} Triad`, notes: triadNotes, type: 'arpeggio'});
  }
  
  // Seventh arpeggio - derive 7th interval from mode notes
  let seventhNotes: string[];
  const seventhDegreeNote = modeNotes[6]; // 7th degree note from the mode
  if (mode.quality === 'major') {
    seventhNotes = [...triadNotes, seventhDegreeNote]; // Natural 7th from mode
  } else if (mode.quality === 'minor') {
    seventhNotes = [...triadNotes, seventhDegreeNote]; // ♭7th from mode
  } else { // diminished (Locrian - should be m7♭5)
    seventhNotes = [...triadNotes, seventhDegreeNote]; // ♭7th from mode for half-diminished
  }
  
  if (isSubset(seventhNotes, modeNotes)) {
    relatedScales.push({name: `${mode.quality.charAt(0).toUpperCase() + mode.quality.slice(1)} 7th`, notes: seventhNotes, type: 'arpeggio'});
  }
  
  // Hexatonic (6-note scale removing avoid degree if present)
  if (mode.avoidDegrees && mode.avoidDegrees.length > 0) {
    const hexatonicNotes = modeNotes.filter((_, index) => !mode.avoidDegrees!.includes(index + 1));
    if (hexatonicNotes.length === 6) {
      relatedScales.push({name: 'Hexatonic (avoid removed)', notes: hexatonicNotes, type: 'hexatonic'});
    }
  }
  
  // Return 2-3 random scales
  const shuffled = relatedScales.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(3, Math.max(2, shuffled.length)));
};

export const getChordDiagram = (chordName: string): ChordDiagram | null => {
  // Handle empty/null input
  if (!chordName) return null;
  
  // Initial cleanup and Unicode conversion
  let normalized = chordName.replace(/\s+/g, '')
    .replace(/♯/g, '#')  // Convert musical sharp symbol to #
    .replace(/♭/g, 'b'); // Convert musical flat symbol to b
  
  console.log(`Looking up chord diagram for: "${chordName}" -> initial: "${normalized}"`);
  
  // Parse root note and quality using regex
  const match = normalized.match(/^([A-G][#b]?)(.*)/);
  if (!match) {
    console.log(`Invalid chord format: "${normalized}"`);
    return null;
  }
  
  const root = match[1];
  let quality = match[2];
  
  // Normalize quality/suffix aliases
  const qualityAliases: Record<string, string> = {
    // Major variants
    'MAJ': '',
    'MAJOR': '',
    'M': '',
    
    // Major 7th variants (important fix!)
    'MAJ7': 'M7',
    'MAJOR7': 'M7',
    'Δ7': 'M7',
    
    // Minor variants
    'MIN': 'm',
    'MINOR': 'm',
    '-': 'm',
    
    // Minor 7th variants
    'MIN7': 'm7',
    'MINOR7': 'm7',
    '-7': 'm7',
    
    // Suspended variants
    'SUS2': 'sus',
    'SUS4': 'sus',
    'SUSPENDED': 'sus',
    
    // Diminished variants
    'DIM': '°',
    'DIMINISHED': '°',
    
    // Augmented variants
    'AUG': '+',
    'AUGMENTED': '+',
    
    // Dominant 7th (keep as-is)
    'DOM7': '7',
    'DOMINANT7': '7'
  };
  
  // Apply quality aliases
  const upperQuality = quality.toUpperCase();
  const normalizedQuality = qualityAliases[upperQuality] !== undefined ? qualityAliases[upperQuality] : quality;
  
  const finalChord = root + normalizedQuality;
  console.log(`Parsed: root="${root}", quality="${quality}" -> normalized: "${finalChord}"`);
  
  // Try exact match first
  if (chordDiagrams[finalChord]) {
    console.log(`Found exact match for: ${finalChord}`);
    return chordDiagrams[finalChord];
  }
  
  // Try priority fallbacks for common variations
  const priorityFallbacks = [
    // For 7th chords, try different variants
    finalChord.replace(/M7$/i, '7'),  // Major 7 -> Dominant 7 fallback
    finalChord.replace(/7$/, 'M7'),   // Dominant 7 -> Major 7 fallback
    
    // For sus chords, try specific sus types
    finalChord.replace(/sus$/, 'sus2'),
    finalChord.replace(/sus$/, 'sus4'),
    
    // Try without numbers (9th, 6th -> base chord)
    finalChord.replace(/[69]$/, ''),
    
    // Try base major/minor
    root,           // Major
    root + 'm',     // Minor
    root + '7'      // Dominant 7
  ];
  
  for (const fallback of priorityFallbacks) {
    if (fallback && chordDiagrams[fallback]) {
      console.log(`Found fallback match: "${fallback}" for "${finalChord}"`);
      return chordDiagrams[fallback];
    }
  }
  
  console.log(`No diagram found for: "${chordName}" (final: "${finalChord}")`);
  return null;
};
