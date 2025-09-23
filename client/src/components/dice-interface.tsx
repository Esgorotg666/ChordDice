import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { colorGroups, exoticNumbers } from "@/lib/music-data";

interface DiceInterfaceProps {
  onResult: (result: { type: 'single' | 'riff'; chord?: string; colorName?: string; progression?: string[] }) => void;
}

type Genre = 'any' | 'jazz' | 'blues' | 'rock' | 'pop' | 'folk';

const genres: { value: Genre; label: string; description: string }[] = [
  { value: 'any', label: 'Any Style', description: 'Random chord combinations' },
  { value: 'jazz', label: 'Jazz', description: 'Complex 7ths, 9ths, ii-V-I progressions' },
  { value: 'blues', label: 'Blues', description: 'Dominant 7ths, I-IV-V progressions' },
  { value: 'rock', label: 'Rock', description: 'Power chords, simple triads' },
  { value: 'pop', label: 'Pop', description: 'Catchy progressions like vi-IV-I-V' },
  { value: 'folk', label: 'Folk', description: 'Simple triads, traditional patterns' }
];

export default function DiceInterface({ onResult }: DiceInterfaceProps) {
  const [currentMode, setCurrentMode] = useState<'single' | 'riff'>('single');
  const [selectedGenre, setSelectedGenre] = useState<Genre>('any');
  const [isRolling, setIsRolling] = useState(false);
  const [colorDiceValue, setColorDiceValue] = useState(4);
  const [numberDiceValue, setNumberDiceValue] = useState(4);

  const formatChord = (key: string, type: string) => {
    const chordSuffixes: Record<string, string> = {
      'Major': '',
      'Minor': 'm',
      '6th': '6',
      '7th': '7',
      '9th': '9',
      'Minor 6th': 'm6',
      'Minor 7th': 'm7',
      'Major 7th': 'M7',
      'Diminished': '°',
      'Augmented': '+',
      'Suspended': 'sus',
      // Add all exotic chord types for consistency
      ...Object.fromEntries(
        Object.values(exoticNumbers).map(exotic => [exotic, exotic === 'Major 7th' ? 'M7' : 
          exotic === 'Diminished' ? '°' : 
          exotic === 'Augmented' ? '+' :
          exotic === 'Suspended' ? 'sus' :
          exotic === '9th' ? '9' : exotic])
      )
    };

    return key + (chordSuffixes[type] || '');
  };

  const normalizeNote = (note: string): string => {
    // Convert flats to sharps for consistent internal processing
    const flatToSharp: Record<string, string> = {
      'A♭': 'G#', 'Ab': 'G#',
      'B♭': 'A#', 'Bb': 'A#', 
      'D♭': 'C#', 'Db': 'C#',
      'E♭': 'D#', 'Eb': 'D#',
      'G♭': 'F#', 'Gb': 'F#'
    };
    return flatToSharp[note] || note;
  };

  const getChordRoot = (keyString: string): string => {
    // Extract the root note by removing any trailing quality indicators
    const root = keyString.replace(/m$/, '');
    return normalizeNote(root);
  };

  const isMinorKey = (keyString: string): boolean => {
    return keyString.endsWith('m');
  };

  const getGenreProgressions = (genre: Genre, rootNote: string, isMinor: boolean = false): string[] => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = notes.indexOf(rootNote);
    
    if (rootIndex === -1) {
      console.error(`Invalid root note: ${rootNote}`);
      return [rootNote]; // Fallback to just the root
    }
    
    const buildChord = (semitones: number, quality: string = ''): string => {
      const noteIndex = (rootIndex + semitones + 12) % 12; // Safe from negative numbers
      const note = notes[noteIndex];
      return note + quality;
    };

    switch (genre) {
      case 'jazz':
        if (isMinor) {
          // ii°-V7-i for minor jazz
          return [
            buildChord(2, 'm7b5'), // ii° (half-diminished)
            buildChord(7, '7'),    // V7
            buildChord(0, 'm'),    // i (minor tonic)
            buildChord(8, '7')     // ♭VI7 (dominant)
          ];
        } else {
          // ii-V-I progression with 7ths (major)
          return [
            buildChord(2, 'm7'),   // ii7
            buildChord(7, '7'),    // V7
            buildChord(0, 'M7'),   // IM7
            buildChord(9, 'm7')    // vi7
          ];
        }
      case 'blues':
        // Same for major/minor blues - dominant 7ths
        return [
          buildChord(0, '7'),    // I7
          buildChord(5, '7'),    // IV7
          buildChord(0, '7'),    // I7
          buildChord(7, '7')     // V7
        ];
      case 'rock':
        if (isMinor) {
          // i-VII-VI-VII (minor rock)
          return [
            buildChord(0, 'm'),    // i
            buildChord(10),        // ♭VII
            buildChord(8),         // ♭VI
            buildChord(10)         // ♭VII
          ];
        } else {
          // I-V-vi-IV (major rock)
          return [
            buildChord(0),         // I
            buildChord(7),         // V
            buildChord(9, 'm'),    // vi
            buildChord(5)          // IV
          ];
        }
      case 'pop':
        if (isMinor) {
          // i-♭VI-♭III-♭VII (minor pop)
          return [
            buildChord(0, 'm'),    // i
            buildChord(8),         // ♭VI
            buildChord(3),         // ♭III
            buildChord(10)         // ♭VII
          ];
        } else {
          // vi-IV-I-V (major pop)
          return [
            buildChord(9, 'm'),    // vi
            buildChord(5),         // IV
            buildChord(0),         // I
            buildChord(7)          // V
          ];
        }
      case 'folk':
        if (isMinor) {
          // i-♭VII-♭VI-♭VII (minor folk)
          return [
            buildChord(0, 'm'),    // i
            buildChord(10),        // ♭VII
            buildChord(8),         // ♭VI
            buildChord(10)         // ♭VII
          ];
        } else {
          // I-vi-IV-V (major folk)
          return [
            buildChord(0),         // I
            buildChord(9, 'm'),    // vi
            buildChord(5),         // IV
            buildChord(7)          // V
          ];
        }
      default:
        // Random exotic chords for "any"
        const exoticTypes = Object.values(exoticNumbers);
        return Array.from({length: 4}, () => 
          rootNote + (exoticTypes[Math.floor(Math.random() * exoticTypes.length)] || '')
        );
    }
  };

  const generateChord = (colorRoll: number, numberRoll: number) => {
    const colorGroup = colorGroups[colorRoll - 1];
    const selectedKey = colorGroup.keys[Math.floor(Math.random() * colorGroup.keys.length)];
    const rootNote = getChordRoot(selectedKey);
    const minor = isMinorKey(selectedKey);
    
    if (selectedGenre === 'any') {
      // Original logic for "any" genre - use formatChord for consistency
      let chordType: string;
      if (exoticNumbers[numberRoll as keyof typeof exoticNumbers]) {
        chordType = exoticNumbers[numberRoll as keyof typeof exoticNumbers];
      } else {
        chordType = 'Major';
      }
      return {
        chord: formatChord(rootNote, chordType),
        colorName: colorGroup.name
      };
    } else {
      // For genre-specific single chords, use the first chord from the progression
      const progression = getGenreProgressions(selectedGenre, rootNote, minor);
      return {
        chord: progression[0],
        colorName: colorGroup.name
      };
    }
  };

  const generateRiff = (colorRoll: number, numberRoll: number) => {
    const colorGroup = colorGroups[colorRoll - 1];
    const selectedKey = colorGroup.keys[Math.floor(Math.random() * colorGroup.keys.length)];
    const rootNote = getChordRoot(selectedKey);
    const minor = isMinorKey(selectedKey);
    
    if (selectedGenre === 'any') {
      // Use dice semantics consistently - first chord uses initial dice, then roll for others
      const progression: string[] = [];
      
      // First chord uses the passed dice rolls
      let chordType: string;
      if (exoticNumbers[numberRoll as keyof typeof exoticNumbers]) {
        chordType = exoticNumbers[numberRoll as keyof typeof exoticNumbers];
      } else {
        chordType = 'Major';
      }
      progression.push(formatChord(rootNote, chordType));
      
      // Remaining chords use new random dice rolls
      for (let i = 1; i < 4; i++) {
        const randomColorRoll = Math.floor(Math.random() * 8) + 1;
        const randomNumberRoll = Math.floor(Math.random() * 8) + 1;
        const randomColorGroup = colorGroups[randomColorRoll - 1];
        const randomKey = randomColorGroup.keys[Math.floor(Math.random() * randomColorGroup.keys.length)];
        const randomRoot = getChordRoot(randomKey);
        
        // Use dice roll to select exotic type consistently with single mode
        let randomChordType: string;
        if (exoticNumbers[randomNumberRoll as keyof typeof exoticNumbers]) {
          randomChordType = exoticNumbers[randomNumberRoll as keyof typeof exoticNumbers];
        } else {
          randomChordType = 'Major';
        }
        progression.push(formatChord(randomRoot, randomChordType));
      }
      return progression;
    } else {
      // Use genre-specific progressions
      return getGenreProgressions(selectedGenre, rootNote, minor);
    }
  };

  const rollDice = () => {
    if (isRolling) return;
    
    setIsRolling(true);

    setTimeout(() => {
      const colorRoll = Math.floor(Math.random() * 8) + 1;
      const numberRoll = Math.floor(Math.random() * 8) + 1;
      
      setColorDiceValue(colorRoll);
      setNumberDiceValue(numberRoll);

      const { chord, colorName } = generateChord(colorRoll, numberRoll);

      if (currentMode === 'single') {
        onResult({ type: 'single', chord, colorName });
      } else {
        const progression = generateRiff(colorRoll, numberRoll);
        onResult({ type: 'riff', progression });
      }
      
      setIsRolling(false);
    }, 1000);
  };

  const colorGroup = colorGroups[colorDiceValue - 1];

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h2 className="text-lg font-semibold mb-4 text-center">Roll the Dice</h2>
      
      {/* Genre Selection */}
      <div className="mb-4">
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Musical Genre</label>
        <Select value={selectedGenre} onValueChange={(value: Genre) => setSelectedGenre(value)}>
          <SelectTrigger className="w-full" data-testid="select-genre">
            <SelectValue placeholder="Select a genre" />
          </SelectTrigger>
          <SelectContent>
            {genres.map((genre) => (
              <SelectItem key={genre.value} value={genre.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{genre.label}</span>
                  <span className="text-xs text-muted-foreground">{genre.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Dice Display */}
      <div className="flex justify-center space-x-6 mb-6">
        {/* Color Die */}
        <div className="text-center">
          <div 
            className={`dice-face w-16 h-16 rounded-lg flex items-center justify-center mb-2 ${isRolling ? 'animate-dice-roll' : ''}`}
            data-testid="dice-color"
          >
            <div className={`w-8 h-8 rounded ${colorGroup.class}`}></div>
          </div>
          <span className="text-xs text-muted-foreground">Color Die</span>
        </div>
        
        {/* Number Die */}
        <div className="text-center">
          <div 
            className={`dice-face w-16 h-16 rounded-lg flex items-center justify-center mb-2 ${isRolling ? 'animate-dice-roll' : ''}`}
            data-testid="dice-number"
          >
            <span className="text-xl font-bold text-foreground">{numberDiceValue}</span>
          </div>
          <span className="text-xs text-muted-foreground">Number Die</span>
        </div>
      </div>

      {/* Game Mode Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button
          variant={currentMode === 'single' ? 'default' : 'secondary'}
          className="py-3 px-4 font-medium transition-all transform active:scale-95 min-h-[48px]"
          onClick={() => setCurrentMode('single')}
          data-testid="button-single-roll"
        >
          <i className="fas fa-dice-one mr-2"></i>Single Roll
        </Button>
        <Button
          variant={currentMode === 'riff' ? 'default' : 'secondary'}
          className="py-3 px-4 font-medium transition-all transform active:scale-95 min-h-[48px]"
          onClick={() => setCurrentMode('riff')}
          data-testid="button-riff-mode"
        >
          <i className="fas fa-music mr-2"></i>Riff Mode
        </Button>
      </div>

      {/* Roll Button */}
      <Button
        variant="secondary"
        className="w-full bg-accent text-accent-foreground py-4 px-6 font-semibold text-lg hover:bg-accent/90 transition-all transform active:scale-95 shadow-lg min-h-[48px]"
        onClick={rollDice}
        disabled={isRolling}
        data-testid="button-roll-dice"
      >
        {isRolling ? (
          <>
            <i className="fas fa-spinner fa-spin mr-2"></i>Rolling...
          </>
        ) : (
          <>
            <i className="fas fa-dice mr-2"></i>Roll Dice
          </>
        )}
      </Button>
    </div>
  );
}
