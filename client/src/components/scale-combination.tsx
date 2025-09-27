import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuthContext } from "@/contexts/AuthContext";
import { Crown, Lock, Shuffle, Music, Guitar, BookOpen } from "lucide-react";
import { modes, NOTES, ModeDef, buildScaleByIntervals, generateRelatedScales } from "@/lib/music-data";

interface ScaleInfo {
  name: string;
  notes: string[];
  description: string;
  color: string;
}

interface OctaveChord {
  name: string;
  octave: number;
  notes: string[];
  fretPosition: string;
}

interface FretPosition {
  string: number; // 0-5 (E, A, D, G, B, E)
  fret: number;   // 0-12
  note: string;
}

// Standard tuning fretboard note mapping (first 12 frets)
const fretboardNotes: string[][] = [
  // String 6 (Low E): E F F# G G# A A# B C C# D D# E
  ['E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B', 'C', 'C♯', 'D', 'D♯', 'E'],
  // String 5 (A): A A# B C C# D D# E F F# G G# A
  ['A', 'A♯', 'B', 'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A'],
  // String 4 (D): D D# E F F# G G# A A# B C C# D
  ['D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B', 'C', 'C♯', 'D'],
  // String 3 (G): G G# A A# B C C# D D# E F F# G
  ['G', 'G♯', 'A', 'A♯', 'B', 'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G'],
  // String 2 (B): B C C# D D# E F F# G G# A A# B
  ['B', 'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'],
  // String 1 (High E): E F F# G G# A A# B C C# D D# E
  ['E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B', 'C', 'C♯', 'D', 'D♯', 'E']
];

const availableScales: Record<string, ScaleInfo> = {
  minor_pentatonic: {
    name: "Minor Pentatonic",
    notes: ["A", "C", "D", "E", "G"],
    description: "Classic blues and rock foundation",
    color: "bg-red-500"
  },
  major_pentatonic: {
    name: "Major Pentatonic", 
    notes: ["C", "D", "E", "G", "A"],
    description: "Bright, uplifting melodic scale",
    color: "bg-blue-500"
  },
  blues: {
    name: "Blues Scale",
    notes: ["A", "C", "D", "D♯", "E", "G"],
    description: "Minor pentatonic with blue note",
    color: "bg-purple-500"
  },
  dorian: {
    name: "Dorian Mode",
    notes: ["D", "E", "F", "G", "A", "B", "C"],
    description: "Minor with natural 6th - jazzy feel",
    color: "bg-green-500"
  },
  mixolydian: {
    name: "Mixolydian Mode", 
    notes: ["G", "A", "B", "C", "D", "E", "F"],
    description: "Major with flat 7th - dominant sound",
    color: "bg-orange-500"
  },
  natural_minor: {
    name: "Natural Minor",
    notes: ["A", "B", "C", "D", "E", "F", "G"],
    description: "Classic minor scale foundation",
    color: "bg-gray-500"
  }
};

const octaveChords: OctaveChord[] = [
  { name: "Am", octave: 1, notes: ["A3", "C4", "E4"], fretPosition: "5th fret" },
  { name: "Am", octave: 2, notes: ["A4", "C5", "E5"], fretPosition: "12th fret" },
  { name: "C", octave: 1, notes: ["C3", "E3", "G3"], fretPosition: "3rd fret" },
  { name: "C", octave: 2, notes: ["C4", "E4", "G4"], fretPosition: "8th fret" },
  { name: "Em", octave: 1, notes: ["E3", "G3", "B3"], fretPosition: "Open" },
  { name: "Em", octave: 2, notes: ["E4", "G4", "B4"], fretPosition: "7th fret" },
  { name: "G", octave: 1, notes: ["G3", "B3", "D4"], fretPosition: "3rd fret" },
  { name: "G", octave: 2, notes: ["G4", "B4", "D5"], fretPosition: "10th fret" }
];

interface ScaleCombinationProps {
  onUpgrade?: () => void;
}

export default function ScaleCombination({ onUpgrade }: ScaleCombinationProps) {
  const { hasActiveSubscription } = useSubscription();
  const { isDemoMode } = useAuthContext();
  const [selectedTab, setSelectedTab] = useState<string>("combinations");
  const [scaleCombination, setScaleCombination] = useState<ScaleInfo[]>([]);
  const [octaveCombination, setOctaveCombination] = useState<OctaveChord[]>([]);
  
  // Mode-related state
  const [selectedMode, setSelectedMode] = useState<ModeDef | null>(null);
  const [modeRoot, setModeRoot] = useState<string>('');
  const [modeNotes, setModeNotes] = useState<string[]>([]);
  const [relatedScales, setRelatedScales] = useState<Array<{name: string, notes: string[], type: string}>>([]);

  if (!hasActiveSubscription) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border relative">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <Card className="bg-card border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <Crown className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Premium Feature
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Unlock advanced scale combinations and octave chord patterns to
                take your guitar solos and compositions to the next level.
              </p>
              <Button onClick={onUpgrade} className="w-full" data-testid="button-upgrade">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Blurred background content */}
        <div className="opacity-50">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Music className="mr-2 h-5 w-5 text-primary" />
            Scale Combinations
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-primary/20 p-3 rounded-lg text-center">
                  <div className="w-8 h-8 bg-primary/40 rounded-full mx-auto"></div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
              <div className="h-3 bg-muted-foreground/20 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to find all fret positions for a given note
  const findNotePositions = (note: string): FretPosition[] => {
    const positions: FretPosition[] = [];
    const normalizedNote = note.replace('♯', '#').replace('♭', 'b');
    
    for (let stringIndex = 0; stringIndex < fretboardNotes.length; stringIndex++) {
      for (let fretIndex = 0; fretIndex < fretboardNotes[stringIndex].length; fretIndex++) {
        const fretNote = fretboardNotes[stringIndex][fretIndex].replace('♯', '#').replace('♭', 'b');
        if (fretNote === normalizedNote || 
            (normalizedNote === 'D#' && fretNote === 'Eb') ||
            (normalizedNote === 'Eb' && fretNote === 'D#')) {
          positions.push({
            string: stringIndex,
            fret: fretIndex,
            note: note
          });
        }
      }
    }
    return positions;
  };

  // Get color class without 'bg-' prefix for use in border/text colors
  const getColorHex = (bgColorClass: string) => {
    const colorMap: Record<string, string> = {
      'bg-red-500': 'rgb(239, 68, 68)',
      'bg-blue-500': 'rgb(59, 130, 246)', 
      'bg-purple-500': 'rgb(168, 85, 247)',
      'bg-green-500': 'rgb(34, 197, 94)',
      'bg-orange-500': 'rgb(249, 115, 22)',
      'bg-gray-500': 'rgb(107, 114, 128)'
    };
    return colorMap[bgColorClass] || 'rgb(59, 130, 246)';
  };

  // Fretboard visualization component
  const FretboardVisualization = ({ 
    scales, 
    mode, 
    variant = "scales" 
  }: { 
    scales?: ScaleInfo[], 
    mode?: { mode: ModeDef, root: string, notes: string[] },
    variant?: "scales" | "mode" 
  }) => {
    const strings = ['E', 'A', 'D', 'G', 'B', 'E'];
    const frets = Array.from({ length: 13 }, (_, i) => i); // 0-12 frets
    
    let scalePositions: any[] = [];
    
    if (variant === "scales" && scales) {
      // Collect all note positions for all scales
      scalePositions = scales.flatMap((scale, scaleIndex) => 
        scale.notes.flatMap(note => 
          findNotePositions(note).map(pos => ({
            ...pos,
            scaleIndex,
            scaleName: scale.name,
            color: getColorHex(scale.color),
            label: note.charAt(0)
          }))
        )
      );
    } else if (variant === "mode" && mode) {
      // Collect mode note positions with degree numbers
      scalePositions = mode.notes.flatMap((note, noteIndex) => 
        findNotePositions(note).map(pos => {
          const degree = noteIndex + 1;
          const isChordTone = mode.mode.characteristicDegrees.includes(degree) || [1, 3, 5].includes(degree);
          const isAvoid = mode.mode.avoidDegrees?.includes(degree);
          
          return {
            ...pos,
            degree,
            isChordTone,
            isAvoid,
            color: mode.mode.color,
            label: degree.toString(),
            note
          };
        })
      );
    }

    return (
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border-2 border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-center mb-3">
          <Guitar className="mr-2 h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
            Fretboard Visualization
          </h4>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* String labels */}
            <div className="flex mb-2">
              <div className="w-8 text-xs text-center">Fret</div>
              {frets.map(fret => (
                <div key={fret} className="w-12 text-xs text-center font-medium text-muted-foreground">
                  {fret}
                </div>
              ))}
            </div>
            
            {/* Fretboard strings */}
            {strings.map((string, stringIndex) => (
              <div key={stringIndex} className="flex items-center mb-1">
                {/* String name */}
                <div className="w-8 text-xs text-center font-bold text-amber-700 dark:text-amber-300">
                  {string}
                </div>
                
                {/* Frets for this string */}
                {frets.map(fret => {
                  const positionsAtThisFret = scalePositions.filter(
                    pos => pos.string === stringIndex && pos.fret === fret
                  );
                  
                  return (
                    <div key={fret} className="w-12 h-8 relative flex items-center justify-center">
                      {/* String line */}
                      <div className="absolute w-full h-0.5 bg-gray-400 dark:bg-gray-600"></div>
                      
                      {/* Fret wire */}
                      {fret > 0 && (
                        <div className="absolute left-0 w-0.5 h-8 bg-gray-600 dark:bg-gray-400"></div>
                      )}
                      
                      {/* Note markers */}
                      {positionsAtThisFret.map((position, index) => {
                        const isMode = variant === "mode";
                        const isChordTone = isMode && position.isChordTone;
                        const isAvoid = isMode && position.isAvoid;
                        
                        return (
                          <div
                            key={index}
                            className={`absolute w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10 ${
                              isAvoid ? 'opacity-50' : ''
                            }`}
                            style={{ 
                              backgroundColor: isMode && !isChordTone ? 'transparent' : position.color,
                              borderColor: position.color,
                              color: isMode && !isChordTone ? position.color : 'white',
                              borderWidth: isMode && !isChordTone ? '2px' : '2px',
                              transform: `translateY(${index * 2 - (positionsAtThisFret.length - 1)}px)`
                            }}
                            title={isMode ? 
                              `${position.note} (Degree ${position.degree}${isChordTone ? ' - Chord Tone' : ''}${isAvoid ? ' - Avoid' : ''})` :
                              `${position.note} (${position.scaleName})`
                            }
                            data-testid={`fretboard-note-${stringIndex}-${fret}-${index}`}
                          >
                            {position.label}
                          </div>
                        );
                      })}
                      
                      {/* Fret position markers (dots) */}
                      {stringIndex === 2 && [3, 5, 7, 9, 15, 17, 19, 21].includes(fret) && (
                        <div className="absolute w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>
                      )}
                      {stringIndex === 2 && fret === 12 && (
                        <div className="absolute w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 text-xs text-muted-foreground">
          {variant === "mode" ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: mode?.mode.color, borderColor: mode?.mode.color }}></div>
                  <span>Chord Tones (1,3,5)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full border-2 bg-transparent" style={{ borderColor: mode?.mode.color, color: mode?.mode.color }}></div>
                  <span>Tensions/Extensions</span>
                </div>
              </div>
              <p>💡 Tip: Numbers show scale degrees. Filled dots = chord tones, outlined = tensions. Focus on chord tones for stability!</p>
            </div>
          ) : (
            <p>💡 Tip: Each colored dot shows where to play notes from the generated scales. Multiple colors = multiple scales overlap!</p>
          )}
        </div>
      </div>
    );
  };

  const generateScaleCombination = () => {
    const scales = Object.values(availableScales);
    const numScales = Math.floor(Math.random() * 2) + 2; // 2-3 scales
    const shuffled = [...scales].sort(() => 0.5 - Math.random());
    setScaleCombination(shuffled.slice(0, numScales));
  };

  const generateOctaveCombination = () => {
    const numChords = Math.floor(Math.random() * 3) + 2; // 2-4 chords
    const shuffled = [...octaveChords].sort(() => 0.5 - Math.random());
    setOctaveCombination(shuffled.slice(0, numChords));
  };

  const generateRandomMode = () => {
    // Pick random root note
    const randomRoot = NOTES[Math.floor(Math.random() * NOTES.length)];
    
    // Pick random mode
    const randomMode = modes[Math.floor(Math.random() * modes.length)];
    
    // Build mode notes
    const notes = buildScaleByIntervals(randomRoot, randomMode.intervals);
    
    // Generate related scales
    const related = generateRelatedScales(randomMode, randomRoot);
    
    // Update state
    setSelectedMode(randomMode);
    setModeRoot(randomRoot);
    setModeNotes(notes);
    setRelatedScales(related);
  };

  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Music className="mr-2 h-5 w-5 text-primary" />
          Scale Combinations
        </h2>
        {!isDemoMode && (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Crown className="mr-1 h-3 w-3" />
            Premium
          </Badge>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="combinations" className="text-sm">Scale Mix</TabsTrigger>
          <TabsTrigger value="octaves" className="text-sm">Octave Chords</TabsTrigger>
          <TabsTrigger value="modes" className="text-sm">Modes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="combinations" className="space-y-4">
          <div className="text-center">
            <Button 
              onClick={generateScaleCombination} 
              className="w-full mb-4"
              data-testid="button-generate-scales"
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Generate Scale Combination
            </Button>
          </div>

          {scaleCombination.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-center">
                Soloing Combination
              </h3>
              <div className="grid gap-3">
                {scaleCombination.map((scale, index) => (
                  <Card key={index} className="p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${scale.color} text-white`}>
                        Scale {index + 1}
                      </Badge>
                      <span className="font-semibold text-sm">{scale.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{scale.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {scale.notes.map((note, noteIndex) => (
                        <Badge 
                          key={noteIndex} 
                          variant="outline" 
                          className="text-xs"
                          data-testid={`note-${index}-${noteIndex}`}
                        >
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
              
              {/* Fretboard Visualization */}
              <FretboardVisualization scales={scaleCombination} />
              
              <Card className="p-3 bg-primary/5 border-primary/20">
                <h4 className="font-semibold text-sm mb-2">💡 Soloing Tip</h4>
                <p className="text-xs text-muted-foreground">
                  Mix notes from these scales during your solo. Start with the first scale, 
                  then blend in notes from the others for unique melodic phrases.
                </p>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="octaves" className="space-y-4">
          <div className="text-center">
            <Button 
              onClick={generateOctaveCombination} 
              className="w-full mb-4"
              data-testid="button-generate-octaves"
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Generate Octave Combination
            </Button>
          </div>

          {octaveCombination.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-center">
                Octave Chord Pattern
              </h3>
              <div className="grid gap-3">
                {octaveCombination.map((chord, index) => (
                  <Card key={index} className="p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-indigo-500 text-white">
                        {chord.name}
                      </Badge>
                      <span className="text-xs font-medium">
                        Octave {chord.octave} - {chord.fretPosition}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {chord.notes.map((note, noteIndex) => (
                        <Badge 
                          key={noteIndex} 
                          variant="outline" 
                          className="text-xs"
                          data-testid={`octave-note-${index}-${noteIndex}`}
                        >
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
              <Card className="p-3 bg-primary/5 border-primary/20">
                <h4 className="font-semibold text-sm mb-2">🎸 Playing Tip</h4>
                <p className="text-xs text-muted-foreground">
                  Play these chord positions in sequence to create rich harmonic textures. 
                  The octave variations add depth and movement to your progressions.
                </p>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="modes" className="space-y-4">
          <div className="text-center">
            <Button 
              onClick={generateRandomMode} 
              className="w-full mb-4"
              data-testid="button-generate-mode"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Generate Random Mode
            </Button>
          </div>

          {selectedMode && (
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-center">
                {modeRoot} {selectedMode.name} Mode
              </h3>
              
              {/* Mode Summary */}
              <Card className="p-4 border" style={{ borderColor: selectedMode.color }}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge 
                      className="text-white" 
                      style={{ backgroundColor: selectedMode.color }}
                    >
                      {selectedMode.quality.charAt(0).toUpperCase() + selectedMode.quality.slice(1)}
                    </Badge>
                    <span className="text-sm font-medium">
                      {selectedMode.parentMajor}° of Major Scale
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {selectedMode.description}
                  </p>
                  
                  {/* Mode Formula */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Degree Formula:</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedMode.degreeFormula.map((degree, index) => (
                        <Badge 
                          key={index}
                          variant={selectedMode.characteristicDegrees.includes(index + 1) ? "default" : "outline"}
                          className="text-xs"
                          data-testid={`mode-degree-${index}`}
                        >
                          {degree}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Mode Notes */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Mode Notes:</h4>
                    <div className="flex flex-wrap gap-1">
                      {modeNotes.map((note, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs"
                          data-testid={`mode-note-${index}`}
                        >
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Parent Major Info */}
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    💡 <strong>Theory:</strong> {selectedMode.name} shares the same notes as the{' '}
                    {modeNotes[selectedMode.parentMajor - 1]} major scale, but starts from {modeRoot}.
                  </div>
                </div>
              </Card>
              
              {/* Related Scales */}
              {relatedScales.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Related In-Mode Scales:</h4>
                  <div className="grid gap-3">
                    {relatedScales.map((scale, index) => (
                      <Card key={index} className="p-3 border border-dashed">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">
                            {scale.name}
                          </Badge>
                          <span className="text-xs text-muted-foreground capitalize">
                            {scale.type}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {scale.notes.map((note, noteIndex) => (
                            <Badge 
                              key={noteIndex} 
                              variant="outline" 
                              className="text-xs"
                              data-testid={`related-note-${index}-${noteIndex}`}
                            >
                              {note}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Mode Fretboard Visualization */}
              <FretboardVisualization 
                mode={{ mode: selectedMode, root: modeRoot, notes: modeNotes }}
                variant="mode"
              />
              
              <Card className="p-3 bg-primary/5 border-primary/20">
                <h4 className="font-semibold text-sm mb-2">🎵 Mode Practice Tip</h4>
                <p className="text-xs text-muted-foreground">
                  Focus on the characteristic degrees (highlighted) that give this mode its unique sound. 
                  Practice the related scales to build familiarity with the mode's harmonic possibilities.
                </p>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}