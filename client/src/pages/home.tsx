import { useState } from "react";
import { Settings } from "lucide-react";
import DiceInterface from "@/components/dice-interface";
import ChordChart from "@/components/chord-chart";
import PentatonicGuide from "@/components/pentatonic-guide";
import RiffModal from "@/components/riff-modal";
import { Button } from "@/components/ui/button";

interface GeneratedResult {
  type: 'single' | 'riff';
  chord?: string;
  colorName?: string;
  progression?: string[];
}

export default function Home() {
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [showRiffModal, setShowRiffModal] = useState(false);

  const handleDiceResult = (result: GeneratedResult) => {
    setResult(result);
    if (result.type === 'riff') {
      setShowRiffModal(true);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <i className="fas fa-music text-primary text-xl"></i>
              <h1 className="text-lg font-semibold text-foreground">Chord Riff Generator</h1>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="p-2 h-auto"
              data-testid="button-settings"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Dice Interface */}
        <DiceInterface onResult={handleDiceResult} />

        {/* Result Display */}
        {result && result.type === 'single' && (
          <div className="bg-card rounded-lg p-6 border border-border animate-fade-in" data-testid="result-display">
            <h3 className="text-lg font-semibold mb-4">Result</h3>
            <div className="space-y-3">
              <div className="bg-primary text-primary-foreground p-4 rounded-lg text-center">
                <div className="text-sm text-primary-foreground/80 mb-1">Generated Chord</div>
                <div className="text-2xl font-bold animate-chord-pulse" data-testid="text-generated-chord">{result.chord}</div>
                <div className="text-sm text-primary-foreground/80 mt-1">Color Group: {result.colorName}</div>
              </div>
              <div className="text-center">
                <Button 
                  variant="secondary" 
                  className="hover:bg-accent hover:text-accent-foreground"
                  data-testid="button-show-fretboard"
                >
                  <i className="fas fa-guitar mr-2"></i>Show Fretboard
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chord Chart */}
        <ChordChart />

        {/* Pentatonic Guide */}
        <PentatonicGuide />

        {/* Quick Actions */}
        <div className="bg-card rounded-lg p-4 border border-border">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="secondary" 
              className="py-3 px-4 hover:bg-accent hover:text-accent-foreground transition-all transform active:scale-95"
              data-testid="button-history"
            >
              <i className="fas fa-history mr-2"></i>History
            </Button>
            <Button 
              variant="secondary" 
              className="py-3 px-4 hover:bg-accent hover:text-accent-foreground transition-all transform active:scale-95"
              data-testid="button-favorites"
            >
              <i className="fas fa-heart mr-2"></i>Favorites
            </Button>
            <Button 
              variant="secondary" 
              className="py-3 px-4 hover:bg-accent hover:text-accent-foreground transition-all transform active:scale-95"
              data-testid="button-share"
            >
              <i className="fas fa-share-alt mr-2"></i>Share
            </Button>
            <Button 
              variant="secondary" 
              className="py-3 px-4 hover:bg-accent hover:text-accent-foreground transition-all transform active:scale-95"
              data-testid="button-audio"
            >
              <i className="fas fa-volume-up mr-2"></i>Audio
            </Button>
          </div>
        </div>
      </div>

      {/* Riff Modal */}
      {result && result.type === 'riff' && (
        <RiffModal 
          isOpen={showRiffModal}
          onClose={() => setShowRiffModal(false)}
          progression={result.progression || []}
        />
      )}
    </div>
  );
}
