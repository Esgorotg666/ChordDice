import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { colorGroups, exoticNumbers } from "@/lib/music-data";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

interface DiceInterfaceProps {
  onResult: (result: { type: 'single' | 'riff'; chord?: string; colorName?: string; progression?: string[] }) => void;
  onUpgrade?: () => void;
}

type Genre = 'any' | 'jazz' | 'blues' | 'rock' | 'pop' | 'folk' | 'metal' | 'extreme-metal';

const genres: { value: Genre; label: string; description: string; isPremium?: boolean }[] = [
  { value: 'any', label: 'Any Style', description: 'Random chord combinations' },
  { value: 'jazz', label: 'Jazz', description: 'Complex 7ths, 9ths, ii-V-I progressions' },
  { value: 'blues', label: 'Blues', description: 'Dominant 7ths, I-IV-V progressions' },
  { value: 'rock', label: 'Rock', description: 'Power chords, simple triads' },
  { value: 'pop', label: 'Pop', description: 'Catchy progressions like vi-IV-I-V' },
  { value: 'folk', label: 'Folk', description: 'Simple triads, traditional patterns' },
  { value: 'metal', label: 'Metal', description: 'Power chords, chromatic riffs, aggressive progressions', isPremium: true },
  { value: 'extreme-metal', label: 'Extreme Metal', description: 'Diminished, tritones, dissonant intervals', isPremium: true }
];

export default function DiceInterface({ onResult, onUpgrade }: DiceInterfaceProps) {
  const { isAuthenticated } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  
  const [currentMode, setCurrentMode] = useState<'single' | 'riff' | 'random' | 'tapping'>('single');
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
      case 'metal':
        if (isMinor) {
          // i-♭VI-♭VII-i (minor metal power chord progression)
          return [
            buildChord(0, '5'),    // i5 (power chord)
            buildChord(8, '5'),    // ♭VI5
            buildChord(10, '5'),   // ♭VII5
            buildChord(0, '5')     // i5
          ];
        } else {
          // I-♭VII-♭VI-♭VII (major metal)
          return [
            buildChord(0, '5'),    // I5 (power chord)
            buildChord(10, '5'),   // ♭VII5
            buildChord(8, '5'),    // ♭VI5
            buildChord(10, '5')    // ♭VII5
          ];
        }
      case 'extreme-metal':
        // Extreme metal uses aggressive diminished and chromatic patterns
        if (isMinor) {
          // i-♭ii-♭iii°-iv (chromatic extreme metal)
          return [
            buildChord(0, 'm'),    // i
            buildChord(1, '5'),    // ♭ii5 (chromatic)
            buildChord(3, '°'),    // ♭iii° (diminished)
            buildChord(5, 'm')     // iv
          ];
        } else {
          // I-♭ii-tritone-i (dissonant extreme metal)
          return [
            buildChord(0, '5'),    // I5
            buildChord(1, '5'),    // ♭ii5 (chromatic)
            buildChord(6, '°'),    // tritone diminished
            buildChord(0, 'm')     // i (modal mixture)
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

  const generateRandomChords = () => {
    // Completely random chord generation for premium users
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const allChordTypes = [
      '', 'm', '7', 'M7', 'm7', '6', 'm6', '9', 'm9', 'add9', 'sus2', 'sus4', 
      '°', '+', 'dim7', 'm7b5', '11', '13', 'maj9', 'maj11', 'maj13',
      '7sus4', '7sus2', 'add11', 'add13', '6/9', 'm6/9', 'alt', '7#5', '7b5',
      'm(maj7)', 'mMaj9', '7#9', '7b9', '7#11', 'maj7#11'
    ];
    
    const progression: string[] = [];
    for (let i = 0; i < 4; i++) {
      const randomNote = notes[Math.floor(Math.random() * notes.length)];
      const randomType = allChordTypes[Math.floor(Math.random() * allChordTypes.length)];
      progression.push(randomNote + randomType);
    }
    
    return progression;
  };

  const generateTappingChords = () => {
    // Generate chord combinations optimized for double hand tapping techniques
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Chord types that work well for tapping (extended chords, wide intervals)
    const tappingChordTypes = [
      'add9', 'add11', 'maj9', 'maj11', 'maj13',  // Extended major chords
      'm9', 'm11', 'm(maj7)', 'mMaj9',            // Extended minor chords  
      '9', '11', '13', '7#11', '7b9', '7#9',      // Dominant extensions
      'sus2', 'sus4', '7sus4', '7sus2',           // Suspended chords
      'maj7#11', '6/9', 'm6/9', 'add13'          // Compound intervals
    ];
    
    // Create a progression that flows well for tapping patterns
    const progression: string[] = [];
    const baseNote = notes[Math.floor(Math.random() * notes.length)];
    const baseIndex = notes.indexOf(baseNote);
    
    // Build a progression with good voice leading for tapping
    const intervals = [0, 5, 2, 7]; // I - IV - ii - V pattern but spread for tapping
    
    for (let i = 0; i < 4; i++) {
      const noteIndex = (baseIndex + intervals[i]) % 12;
      const note = notes[noteIndex];
      const chordType = tappingChordTypes[Math.floor(Math.random() * tappingChordTypes.length)];
      progression.push(note + chordType);
    }
    
    return progression;
  };

  const rollDice = () => {
    if (isRolling) return;
    
    // Check if user clicked premium modes or selected premium genres without subscription
    const isPremiumMode = currentMode === 'random' || currentMode === 'tapping';
    const isPremiumGenre = genres.find(g => g.value === selectedGenre)?.isPremium;
    
    if ((isPremiumMode || isPremiumGenre) && !hasActiveSubscription) {
      onUpgrade?.();
      return;
    }
    
    setIsRolling(true);

    setTimeout(() => {
      if (currentMode === 'random') {
        // Random mode - generate completely random chord progression
        const progression = generateRandomChords();
        onResult({ type: 'riff', progression });
      } else if (currentMode === 'tapping') {
        // Tapping mode - generate double hand tapping chord combinations
        const progression = generateTappingChords();
        onResult({ type: 'riff', progression });
      } else {
        // Normal dice-based generation
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
              <SelectItem 
                key={genre.value} 
                value={genre.value}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{genre.label}</span>
                      {genre.isPremium && (
                        <Badge variant="secondary" className="h-4 px-1 flex items-center justify-center">
                          <Crown className="h-2 w-2" />
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{genre.description}</span>
                  </div>
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
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button
          variant={currentMode === 'single' ? 'default' : 'secondary'}
          className="py-3 px-2 font-medium transition-all transform active:scale-95 min-h-[48px] text-xs"
          onClick={() => setCurrentMode('single')}
          data-testid="button-single-roll"
        >
          <i className="fas fa-dice-one mr-1"></i>Single
        </Button>
        <Button
          variant={currentMode === 'riff' ? 'default' : 'secondary'}
          className="py-3 px-2 font-medium transition-all transform active:scale-95 min-h-[48px] text-xs"
          onClick={() => setCurrentMode('riff')}
          data-testid="button-riff-mode"
        >
          <i className="fas fa-music mr-1"></i>Riff
        </Button>
        <Button
          variant={currentMode === 'random' ? 'default' : 'secondary'}
          className={`py-3 px-2 font-medium transition-all transform active:scale-95 min-h-[48px] text-xs relative ${
            !hasActiveSubscription ? 'pr-6' : ''
          }`}
          onClick={() => {
            if (!hasActiveSubscription) {
              onUpgrade?.();
            } else {
              setCurrentMode('random');
            }
          }}
          data-testid="button-random-mode"
        >
          <i className="fas fa-random mr-1"></i>Random
          {!hasActiveSubscription && (
            <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
              <Crown className="h-2 w-2" />
            </Badge>
          )}
        </Button>
        <Button
          variant={currentMode === 'tapping' ? 'default' : 'secondary'}
          className={`py-3 px-2 font-medium transition-all transform active:scale-95 min-h-[48px] text-xs relative ${
            !hasActiveSubscription ? 'pr-6' : ''
          }`}
          onClick={() => {
            if (!hasActiveSubscription) {
              onUpgrade?.();
            } else {
              setCurrentMode('tapping');
            }
          }}
          data-testid="button-tapping-mode"
        >
          <i className="fas fa-guitar mr-1"></i>Tapping
          {!hasActiveSubscription && (
            <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
              <Crown className="h-2 w-2" />
            </Badge>
          )}
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
