import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscription } from "@/hooks/useSubscription";
import { Crown, Lock } from "lucide-react";

interface ScaleType {
  name: string;
  intervals: number[];
  description: string;
  degrees: string[];
  keys: { [key: string]: string[] };
}

const scaleTypes: Record<string, ScaleType> = {
  major_pentatonic: {
    name: "Major Pentatonic",
    intervals: [1, 2, 3, 5, 6],
    description: "Bright, uplifting scale perfect for major chord progressions",
    degrees: ["Root", "Whole", "Major 3rd", "Perfect 5th", "Major 6th"],
    keys: {
      "C": ["C", "D", "E", "G", "A"],
      "G": ["G", "A", "B", "D", "E"],
      "F": ["F", "G", "A", "C", "D"]
    }
  },
  minor_pentatonic: {
    name: "Minor Pentatonic", 
    intervals: [1, 3, 4, 5, 7],
    description: "The backbone of blues, rock, and folk music",
    degrees: ["Root", "Minor 3rd", "Perfect 4th", "Perfect 5th", "Minor 7th"],
    keys: {
      "A": ["A", "C", "D", "E", "G"],
      "E": ["E", "G", "A", "B", "D"],
      "D": ["D", "F", "G", "A", "C"]
    }
  },
  blues: {
    name: "Blues Scale",
    intervals: [1, 3, 4, 5, 5.5, 7],
    description: "Minor pentatonic with added blues note (flat 5th)",
    degrees: ["Root", "Minor 3rd", "Perfect 4th", "Perfect 5th", "Blue Note", "Minor 7th"],
    keys: {
      "A": ["A", "C", "D", "E", "Eb", "G"],
      "E": ["E", "G", "A", "B", "Bb", "D"],
      "G": ["G", "Bb", "C", "D", "Db", "F"]
    }
  },
  dorian: {
    name: "Dorian Mode",
    intervals: [1, 2, 3, 4, 5, 6, 7],
    description: "Minor scale with natural 6th - jazzy and sophisticated",
    degrees: ["Root", "Whole", "Minor 3rd", "Perfect 4th", "Perfect 5th", "Major 6th", "Minor 7th"],
    keys: {
      "D": ["D", "E", "F", "G", "A", "B", "C"],
      "A": ["A", "B", "C", "D", "E", "F#", "G"],
      "E": ["E", "F#", "G", "A", "B", "C#", "D"]
    }
  },
  mixolydian: {
    name: "Mixolydian Mode",
    intervals: [1, 2, 3, 4, 5, 6, 7],
    description: "Major scale with flat 7th - dominant and bluesy",
    degrees: ["Root", "Whole", "Major 3rd", "Perfect 4th", "Perfect 5th", "Major 6th", "Minor 7th"],
    keys: {
      "G": ["G", "A", "B", "C", "D", "E", "F"],
      "D": ["D", "E", "F#", "G", "A", "B", "C"],
      "A": ["A", "B", "C#", "D", "E", "F#", "G"]
    }
  }
};

interface AdvancedScaleGuideProps {
  onUpgrade?: () => void;
}

export default function AdvancedScaleGuide({ onUpgrade }: AdvancedScaleGuideProps) {
  const { hasActiveSubscription } = useSubscription();
  const [selectedScale, setSelectedScale] = useState<string>("major_pentatonic");
  const [selectedKey, setSelectedKey] = useState<string>("C");

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
                Unlock advanced scales including Minor Pentatonic, Blues, Dorian, 
                Mixolydian and more to take your playing to the next level.
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
            <i className="fas fa-music mr-2 text-primary"></i>Advanced Scale Guide
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
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

  const currentScale = scaleTypes[selectedScale];
  const availableKeys = Object.keys(currentScale.keys);

  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <i className="fas fa-music mr-2 text-primary"></i>Advanced Scale Guide
        </h2>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          <Crown className="mr-1 h-3 w-3" />
          Premium
        </Badge>
      </div>

      <Tabs value={selectedScale} onValueChange={setSelectedScale} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="major_pentatonic" className="text-xs">Major Pent.</TabsTrigger>
          <TabsTrigger value="minor_pentatonic" className="text-xs">Minor Pent.</TabsTrigger>
          <TabsTrigger value="blues" className="text-xs">Blues</TabsTrigger>
        </TabsList>
        
        <div className="flex justify-center mb-3">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="dorian" className="text-xs">Dorian</TabsTrigger>
            <TabsTrigger value="mixolydian" className="text-xs">Mixolydian</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={selectedScale} className="space-y-4">
          {/* Key selector */}
          <div className="flex flex-wrap gap-2 justify-center">
            {availableKeys.map((key) => (
              <Button
                key={key}
                variant={selectedKey === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedKey(key)}
                className="text-xs"
                data-testid={`button-key-${key}`}
              >
                {key}
              </Button>
            ))}
          </div>

          {/* Scale degrees */}
          <div className="grid grid-cols-2 gap-2">
            {currentScale.keys[selectedKey]?.map((note, index) => (
              <div
                key={index}
                className="bg-primary text-primary-foreground p-2 rounded text-center text-sm font-semibold"
                data-testid={`note-${index}`}
              >
                <div className="text-xs opacity-80">{currentScale.degrees[index]}</div>
                <div>{note}</div>
              </div>
            )) || []}
          </div>

          {/* Scale description */}
          <div className="p-3 bg-muted rounded-lg">
            <h3 className="font-medium text-sm mb-1" data-testid="scale-name">{currentScale.name}</h3>
            <p className="text-xs text-muted-foreground" data-testid="scale-description">
              {currentScale.description}
            </p>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            Use these scale degrees for improvisation over your chord progressions
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}