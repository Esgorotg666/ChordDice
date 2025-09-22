import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect } from "react";
import { ChordDiagram } from "@/lib/music-data";

interface FretboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  chordDiagram: ChordDiagram | null;
  chordName: string;
}

export default function FretboardModal({ isOpen, onClose, chordDiagram, chordName }: FretboardModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const strings = ['E', 'A', 'D', 'G', 'B', 'E'];
  const frets = [0, 1, 2, 3, 4, 5];

  const renderFretboard = () => {
    if (!chordDiagram) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No fretboard diagram available for {chordName}</p>
          <p className="text-sm text-muted-foreground mt-2">Try a common chord like C, G, Am, or D</p>
        </div>
      );
    }

    return (
      <div className="bg-muted rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4 text-center">{chordDiagram.name}</h4>
        
        {/* Fretboard visualization */}
        <div className="relative">
          {/* Nut (top of fretboard) */}
          <div className="flex justify-between mb-2">
            {strings.map((string, stringIndex) => (
              <div key={stringIndex} className="text-center w-8">
                <span className="text-xs font-medium text-muted-foreground">{string}</span>
              </div>
            ))}
          </div>

          {/* String positions at nut */}
          <div className="flex justify-between mb-1">
            {chordDiagram.positions.map((position, stringIndex) => (
              <div key={stringIndex} className="w-8 text-center">
                {position === 'X' ? (
                  <span className="text-red-500 font-bold text-lg">✗</span>
                ) : position === 0 ? (
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto text-sm font-bold">
                    O
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Fretboard grid */}
          <div className="border-t-4 border-gray-800">
            {frets.slice(1).map((fret, fretIndex) => (
              <div key={fret} className="flex justify-between items-center border-b border-gray-400 h-12 relative">
                {/* Fret number */}
                <div className="absolute -left-8 text-sm text-muted-foreground font-medium">
                  {(chordDiagram.fret || 1) + fretIndex}
                </div>
                
                {/* String positions */}
                {strings.map((_, stringIndex) => (
                  <div key={stringIndex} className="relative w-8 h-full flex items-center justify-center">
                    {/* String line */}
                    <div className="absolute w-full h-0.5 bg-gray-600"></div>
                    
                    {/* Finger position */}
                    {chordDiagram.positions[stringIndex] === ((chordDiagram.fret || 1) + fretIndex) && (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold z-10">
                        {chordDiagram.fingers?.[stringIndex] || ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Fret position markers */}
          <div className="flex justify-center mt-2">
            <div className="text-xs text-muted-foreground">
              Fret {chordDiagram.fret || 1} - {(chordDiagram.fret || 1) + 4}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 space-y-2 text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">O</div>
              <span className="text-muted-foreground">Open string</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-red-500 font-bold">✗</span>
              <span className="text-muted-foreground">Don't play</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">1</div>
            <span className="text-muted-foreground">Finger position (1=index, 2=middle, 3=ring, 4=pinky)</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="fretboard-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fretboard-title"
    >
      <div className="bg-card rounded-lg p-6 max-w-lg w-full border border-border animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 id="fretboard-title" className="text-lg font-semibold">
            Fretboard Diagram - {chordName}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 h-auto min-h-[44px] min-w-[44px]"
            data-testid="button-close-fretboard-modal"
            aria-label="Close fretboard modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {renderFretboard()}

        <div className="flex justify-center mt-6">
          <Button 
            onClick={onClose}
            className="px-6"
            data-testid="button-close-fretboard"
          >
            Got it!
          </Button>
        </div>
      </div>
    </div>
  );
}