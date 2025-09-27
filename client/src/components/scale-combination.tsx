import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuthContext } from "@/contexts/AuthContext";
import { Crown, Lock, Shuffle, Music } from "lucide-react";

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
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="combinations" className="text-sm">Scale Mix</TabsTrigger>
          <TabsTrigger value="octaves" className="text-sm">Octave Chords</TabsTrigger>
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
      </Tabs>
    </div>
  );
}