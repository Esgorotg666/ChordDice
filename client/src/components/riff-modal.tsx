import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect } from "react";

interface RiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  progression: string[];
  onShowFretboard?: (chordName: string) => void;
}

export default function RiffModal({ isOpen, onClose, progression, onShowFretboard }: RiffModalProps) {
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

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="riff-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-card rounded-lg p-6 max-w-sm w-full border border-border animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 id="modal-title" className="text-lg font-semibold">Generated Riff Progression</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 h-auto min-h-[44px] min-w-[44px]"
            data-testid="button-close-riff-modal"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-2">
            {progression.map((chord, index) => (
              <div
                key={index}
                className="bg-primary text-primary-foreground p-3 rounded-lg text-center font-semibold animate-fade-in relative group"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`chord-${index + 1}`}
              >
                <div className="text-sm">Chord {index + 1}</div>
                <div className="text-lg mb-2">{chord}</div>
                {onShowFretboard && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs py-1 px-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    onClick={() => onShowFretboard(chord)}
                    data-testid={`button-fretboard-${index + 1}`}
                  >
                    <i className="fas fa-guitar mr-1 text-xs"></i>Fret
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground text-center" data-testid="text-progression">
              Progression: {progression.join(' → ')}
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button 
            className="flex-1 font-medium"
            data-testid="button-practice"
          >
            <i className="fas fa-play mr-2"></i>Practice
          </Button>
          <Button 
            variant="secondary" 
            className="flex-1 font-medium hover:bg-accent hover:text-accent-foreground"
            data-testid="button-save"
          >
            <i className="fas fa-heart mr-2"></i>Save
          </Button>
        </div>
      </div>
    </div>
  );
}
