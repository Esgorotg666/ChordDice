import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  progression: string[];
}

export default function RiffModal({ isOpen, onClose, progression }: RiffModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="riff-modal"
    >
      <div className="bg-card rounded-lg p-6 max-w-sm w-full border border-border animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Generated Riff Progression</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 h-auto"
            data-testid="button-close-riff-modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-2">
            {progression.map((chord, index) => (
              <div
                key={index}
                className="bg-primary text-primary-foreground p-3 rounded-lg text-center font-semibold animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`chord-${index + 1}`}
              >
                <div className="text-sm">Chord {index + 1}</div>
                <div className="text-lg">{chord}</div>
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
