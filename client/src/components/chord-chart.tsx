import { chordTypes, getAllKeys } from "@/lib/music-data";

export default function ChordChart() {
  const keys = getAllKeys();

  const getChordCellClass = (chordType: string, key: string) => {
    const baseClass = "chord-cell p-1 rounded text-center text-white text-xs";
    
    // Color coding based on key
    if (key.includes('♭') && key.includes('m')) return `${baseClass} key-abm-am`;
    if (key.includes('♭') && !key.includes('m')) return `${baseClass} key-ab-a`;
    if (key === 'A' || key === 'Am') return `${baseClass} key-ab-a`;
    if (key === 'B♭' || key === 'B♭m') return `${baseClass} key-bb-b`;
    if (key === 'B' || key === 'Bm') return `${baseClass} key-bb-b`;
    if (key === 'C' || key === 'Cm') return `${baseClass} key-c-db`;
    if (key === 'D♭' || key === 'D♭m') return `${baseClass} key-c-db`;
    if (key === 'D' || key === 'Dm') return `${baseClass} key-d-eb`;
    if (key === 'E♭' || key === 'E♭m') return `${baseClass} key-d-eb`;
    if (key === 'E' || key === 'Em') return `${baseClass} key-e-f`;
    if (key === 'F' || key === 'Fm') return `${baseClass} key-e-f`;
    if (key === 'F♯' || key === 'F♯m' || key === 'G' || key === 'Gm') return `${baseClass} key-fs-g`;
    
    // Default colors for different chord types
    if (chordType === '6th') return `${baseClass} bg-gray-600`;
    if (chordType === '7th') return `${baseClass} bg-gray-700`;
    if (chordType === '9th') return `${baseClass} bg-blue-700`;
    if (chordType === 'Minor 6th') return `${baseClass} bg-purple-700`;
    if (chordType === 'Minor 7th') return `${baseClass} bg-indigo-700`;
    if (chordType === 'Major 7th') return `${baseClass} bg-green-700`;
    if (chordType === 'Diminished') return `${baseClass} bg-red-800`;
    if (chordType === 'Augmented') return `${baseClass} bg-orange-700`;
    if (chordType === 'Suspended') return `${baseClass} bg-yellow-700`;

    return `${baseClass} bg-primary`;
  };

  const formatChordDisplay = (key: string, chordType: string) => {
    const suffixes: Record<string, string> = {
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

    if (chordType === 'Minor' && key.includes('m')) {
      return key; // Already has 'm' suffix
    }
    if (chordType === 'Major' && key.includes('m')) {
      return key.replace('m', ''); // Remove 'm' for major
    }

    return key + (suffixes[chordType] || '');
  };

  const handleChordClick = (chord: string) => {
    // Visual feedback
    console.log('Selected chord:', chord);
  };

  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <i className="fas fa-table mr-2 text-primary"></i>Chord Chart
      </h2>
      
      {/* Chart Header */}
      <div className="grid grid-cols-12 gap-1 mb-2 text-xs">
        <div className="text-center font-medium text-muted-foreground">Type</div>
        {keys.slice(0, 11).map((key: string) => (
          <div key={key} className="text-center font-medium text-muted-foreground text-[10px]">
            {key}
          </div>
        ))}
      </div>

      {/* Chord Types and Grid */}
      <div className="space-y-1 text-xs">
        {chordTypes.map((chordType: string) => (
          <div key={chordType} className="grid grid-cols-12 gap-1">
            <div className="text-center py-2 bg-muted rounded text-muted-foreground font-medium text-[10px]">
              {chordType === 'Major' ? 'Maj' : 
               chordType === 'Minor' ? 'Min' :
               chordType === 'Minor 6th' ? 'Min6' :
               chordType === 'Minor 7th' ? 'Min7' :
               chordType === 'Major 7th' ? 'Maj7' :
               chordType === 'Diminished' ? 'Dim' :
               chordType === 'Augmented' ? 'Aug' :
               chordType === 'Suspended' ? 'Sus' :
               chordType}
            </div>
            {keys.slice(0, 11).map((key: string) => {
              const chordDisplay = formatChordDisplay(key, chordType);
              return (
                <div
                  key={`${key}-${chordType}`}
                  className={getChordCellClass(chordType, key)}
                  onClick={() => handleChordClick(chordDisplay)}
                  data-testid={`chord-${key}-${chordType}`}
                >
                  {chordDisplay}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
