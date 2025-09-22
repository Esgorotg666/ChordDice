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
