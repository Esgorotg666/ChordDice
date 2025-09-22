import { useState } from "react";
import { Button } from "@/components/ui/button";
import { colorGroups, exoticNumbers } from "@/lib/music-data";

interface DiceInterfaceProps {
  onResult: (result: { type: 'single' | 'riff'; chord?: string; colorName?: string; progression?: string[] }) => void;
}

export default function DiceInterface({ onResult }: DiceInterfaceProps) {
  const [currentMode, setCurrentMode] = useState<'single' | 'riff'>('single');
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
      'Suspended': 'sus'
    };

    return key + (chordSuffixes[type] || '');
  };

  const generateChord = (colorRoll: number, numberRoll: number) => {
    const colorGroup = colorGroups[colorRoll - 1];
    const selectedKey = colorGroup.keys[Math.floor(Math.random() * colorGroup.keys.length)];
    
    let chordType: string;
    if (exoticNumbers[numberRoll as keyof typeof exoticNumbers]) {
      chordType = exoticNumbers[numberRoll as keyof typeof exoticNumbers];
    } else {
      chordType = 'Major';
    }

    return {
      chord: formatChord(selectedKey, chordType),
      colorName: colorGroup.name
    };
  };

  const generateRiff = (startingChord: string) => {
    const progression = [startingChord];
    
    for (let i = 0; i < 3; i++) {
      const randomColorRoll = Math.floor(Math.random() * 8) + 1;
      const randomNumberRoll = Math.floor(Math.random() * 8) + 1;
      
      const { chord } = generateChord(randomColorRoll, randomNumberRoll);
      progression.push(chord);
    }

    return progression;
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
        const progression = generateRiff(chord);
        onResult({ type: 'riff', progression });
      }
      
      setIsRolling(false);
    }, 1000);
  };

  const colorGroup = colorGroups[colorDiceValue - 1];

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h2 className="text-lg font-semibold mb-4 text-center">Roll the Dice</h2>
      
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
          className="py-3 px-4 font-medium transition-all transform active:scale-95"
          onClick={() => setCurrentMode('single')}
          data-testid="button-single-roll"
        >
          <i className="fas fa-dice-one mr-2"></i>Single Roll
        </Button>
        <Button
          variant={currentMode === 'riff' ? 'default' : 'secondary'}
          className="py-3 px-4 font-medium transition-all transform active:scale-95"
          onClick={() => setCurrentMode('riff')}
          data-testid="button-riff-mode"
        >
          <i className="fas fa-music mr-2"></i>Riff Mode
        </Button>
      </div>

      {/* Roll Button */}
      <Button
        variant="secondary"
        className="w-full bg-accent text-accent-foreground py-4 px-6 font-semibold text-lg hover:bg-accent/90 transition-all transform active:scale-95 shadow-lg"
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
